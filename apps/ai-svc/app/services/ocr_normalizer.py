"""
Chuẩn hóa output từ VNPT OCR về schema thống nhất.
VNPT trả về field name khác nhau tùy loại giấy tờ —
module này map tất cả về cùng một khuôn { value, confidence }.
"""

FIELD_MAPPING: dict[str, dict[str, str]] = {
    "CCCD": {
        "id_number": "soCCCD",
        "full_name": "hoTen",
        "date_of_birth": "ngaySinh",
        "gender": "gioiTinh",
        "nationality": "quocTich",
        "place_of_origin": "queQuan",
        "place_of_residence": "noiThuongTru",
        "expiry_date": "ngayHetHan",
    },
    "CMND": {
        "id_number": "soCMND",
        "full_name": "hoTen",
        "date_of_birth": "ngaySinh",
        "gender": "gioiTinh",
        "hometown": "queQuan",
        "address": "noiThuongTru",
    },
    "GIAY_KHAI_SINH": {
        "child_name": "hoTenCon",
        "date_of_birth": "ngaySinhCon",
        "gender": "gioiTinhCon",
        "father_name": "hoTenCha",
        "mother_name": "hoTenMe",
        "registration_date": "ngayDangKy",
    },
    "GIAY_CHUNG_SINH": {
        "child_name": "hoTenCon",
        "date_of_birth": "ngaySinh",
        "mother_name": "hoTenMe",
        "hospital": "coSoYte",
    },
    "HO_KHAU": {
        "household_owner": "chuHo",
        "address": "diaChiThuongTru",
        "members": "thanhVien",
    },
}


def normalize_ocr_result(raw_result: dict, doc_type: str) -> dict:
    """Chuyển raw VNPT OCR response → chuẩn hóa theo field schema."""
    mapping = FIELD_MAPPING.get(doc_type, {})
    raw_data = raw_result.get("data", raw_result)
    raw_confidence = raw_result.get("confidence", {})

    normalized_fields: dict[str, dict] = {}

    for vnpt_key, our_key in mapping.items():
        if vnpt_key in raw_data:
            normalized_fields[our_key] = {
                "value": str(raw_data[vnpt_key]).strip(),
                "confidence": float(raw_confidence.get(vnpt_key, raw_data.get("prob", 0.9))),
            }

    avg_confidence = (
        sum(f["confidence"] for f in normalized_fields.values()) / len(normalized_fields)
        if normalized_fields
        else 0.0
    )

    return {
        "fields": normalized_fields,
        "avg_confidence": round(avg_confidence, 3),
        "processing_time_ms": raw_result.get("processing_time", 0),
    }
