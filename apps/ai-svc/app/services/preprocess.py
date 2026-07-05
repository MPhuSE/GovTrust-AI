"""Tiền xử lý ảnh trước khi gửi OCR: xoay đúng chiều (EXIF) + nắn phối cảnh.

Ảnh chụp tay có nhiều góc: nghiêng, chéo, xoay theo hướng cầm máy. Hai bước:
- Lớp 2 (auto-orient): iPhone/Android ghi hướng vào EXIF nhưng khi convert
  HEIC/AVIF -> JPEG cờ này bị mất -> ảnh nằm ngang. exif_transpose xoay pixel thật.
- Lớp 3 (deskew): dò tứ giác tài liệu rồi warp 4 điểm về hình chữ nhật thẳng.
  Best-effort: không tìm được tứ giác đủ tốt thì trả ảnh đã orient, không phá ảnh.
"""

import io
import logging

logger = logging.getLogger(__name__)

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    logger.info("pillow-heif không sẵn sàng; bỏ qua hỗ trợ HEIC/AVIF")

# Chỉ warp khi tứ giác chiếm phần lớn khung hình (tránh nhận nhầm vật thể nhỏ).
_MIN_AREA_RATIO = 0.20
# Cạnh kết quả nhỏ hơn ngưỡng này coi như dò sai, bỏ qua warp.
_MIN_OUTPUT_EDGE = 200


def preprocess_image(data: bytes) -> bytes:
    """PDF giữ nguyên. Ảnh: auto-orient (EXIF) -> deskew -> JPEG.
    Mọi lỗi decode/xử lý đều fallback về bytes gốc để không chặn luồng OCR."""
    if data[:5].lower().startswith(b"%pdf"):
        return data
    try:
        from PIL import Image, ImageOps

        with Image.open(io.BytesIO(data)) as img:
            oriented = ImageOps.exif_transpose(img).convert("RGB")
    except Exception as exc:  # pragma: no cover - ảnh hỏng/không decode được
        logger.warning("Không decode được ảnh (%s); gửi nguyên bytes", exc)
        return data

    deskewed = _deskew_document(oriented)
    buf = io.BytesIO()
    deskewed.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def _deskew_document(pil_image):
    """Dò tứ giác tài liệu bằng OpenCV rồi warp về hình chữ nhật.
    Trả lại ảnh gốc nếu không có OpenCV hoặc không tìm thấy tứ giác đáng tin."""
    try:
        import cv2
        import numpy as np
    except Exception:  # pragma: no cover - thiếu opencv thì bỏ qua lớp 3
        logger.info("OpenCV không sẵn sàng; bỏ qua deskew phối cảnh")
        return pil_image

    image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    height, width = image.shape[:2]
    quad = _find_document_quad(image, cv2, np)
    if quad is None:
        return pil_image

    if cv2.contourArea(quad) < _MIN_AREA_RATIO * width * height:
        return pil_image

    warped = _four_point_transform(image, quad.reshape(4, 2), cv2, np)
    if min(warped.shape[:2]) < _MIN_OUTPUT_EDGE:
        return pil_image

    from PIL import Image

    return Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))


def _find_document_quad(image, cv2, np):
    """Tìm contour 4 đỉnh lớn nhất — ứng viên viền tài liệu."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            return approx
    return None


def _order_points(pts, np):
    """Sắp 4 điểm theo thứ tự: trên-trái, trên-phải, dưới-phải, dưới-trái."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _four_point_transform(image, pts, cv2, np):
    """Warp phối cảnh tứ giác về hình chữ nhật thẳng đứng."""
    rect = _order_points(pts.astype("float32"), np)
    (tl, tr, br, bl) = rect
    width = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    height = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    dst = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype="float32",
    )
    matrix = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, matrix, (width, height))


def is_pdf(data: bytes) -> bool:
    """Nhận diện PDF qua magic byte (khớp OcrService._detect_file)."""
    return data[:5].lower().startswith(b"%pdf")


# Giới hạn số trang render để chặn PDF quá lớn làm nghẽn OCR (mỗi trang = 1 lượt
# gọi Qwen). Hợp đồng/sổ đỏ thực tế hiếm khi quá số này; trang dư bị bỏ (log rõ).
_MAX_PDF_PAGES = 8
# 200 DPI đủ nét cho VL model đọc chữ hợp đồng mà không phình payload quá mức.
_PDF_RENDER_DPI = 200


def pdf_to_images(data: bytes, max_pages: int = _MAX_PDF_PAGES) -> list[bytes]:
    """Render mỗi trang PDF thành 1 ảnh JPEG (bytes) bằng pypdfium2.

    Dùng cho các giấy đi Qwen VL (sổ đỏ, hợp đồng chuyển nhượng...) khi người dùng
    nộp PDF nhiều trang: Qwen chỉ nhận ảnh raster, không đọc trực tiếp PDF. Trả về
    list ảnh theo thứ tự trang; người gọi OCR từng trang rồi hợp nhất field.

    pypdfium2 là wheel tự chứa (không cần poppler hệ thống) → an toàn cho Docker/prod.
    Lỗi render (PDF hỏng, mã hóa) → raise để luồng OCR báo lỗi rõ, KHÔNG nuốt lặng.
    """
    import pypdfium2 as pdfium

    scale = _PDF_RENDER_DPI / 72.0  # pypdfium2 tính theo point (72 DPI gốc)
    images: list[bytes] = []
    pdf = pdfium.PdfDocument(data)
    try:
        total = len(pdf)
        pages = min(total, max_pages)
        if total > max_pages:
            logger.warning(
                "PDF có %d trang, chỉ render %d trang đầu (giới hạn OCR)", total, max_pages
            )
        for i in range(pages):
            page = pdf[i]
            try:
                pil_image = page.render(scale=scale).to_pil().convert("RGB")
            finally:
                page.close()
            buf = io.BytesIO()
            pil_image.save(buf, format="JPEG", quality=95)
            images.append(buf.getvalue())
    finally:
        pdf.close()
    if not images:
        raise ValueError("PDF không có trang nào để render")
    return images
