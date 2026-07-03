#!/usr/bin/env python3
"""
Test Qwen OCR với Giấy chứng sinh (file .doc)
Convert DOC → PDF → Image → Qwen OCR
"""

import sys
import os
from pathlib import Path

# Add ai-svc to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'apps' / 'ai-svc'))

from app.services.qwen_ocr import QwenOcrService
import subprocess
import json

def doc_to_pdf(doc_path: str, output_dir: str) -> str:
    """Convert DOC to PDF using LibreOffice"""
    print(f"📄 Converting DOC to PDF...")
    cmd = [
        'libreoffice',
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', output_dir,
        doc_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"LibreOffice conversion failed: {result.stderr}")

    pdf_path = os.path.join(output_dir, Path(doc_path).stem + '.pdf')
    print(f"✅ PDF created: {pdf_path}")
    return pdf_path

def pdf_to_image(pdf_path: str, output_dir: str) -> str:
    """Convert PDF first page to PNG using pdftoppm"""
    print(f"🖼️  Converting PDF to image...")
    output_prefix = os.path.join(output_dir, Path(pdf_path).stem)
    cmd = [
        'pdftoppm',
        '-png',
        '-f', '1',
        '-l', '1',
        '-singlefile',
        pdf_path,
        output_prefix
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"pdftoppm conversion failed: {result.stderr}")

    image_path = output_prefix + '.png'
    print(f"✅ Image created: {image_path}")
    return image_path

def extract_giay_chung_sinh_fields(ocr_result: dict) -> dict:
    """Extract structured fields from Qwen OCR result"""
    text = ocr_result.get('text', '')

    # Parse fields - Qwen should return structured data
    fields = {
        # Header
        'so': None,
        'quyenSo': None,

        # Thông tin mẹ
        'hoTenMe': None,
        'namSinhMe': None,
        'noiThuongTruMe': None,
        'maSoBHXH': None,
        'soCMND': None,
        'ngayCapCMND': None,
        'noiCapCMND': None,
        'danTocMe': None,

        # Thông tin cha
        'hoTenCha': None,

        # Thông tin sinh con
        'thoiGianSinh': None,  # giờ, phút, ngày, tháng, năm
        'noiSinh': None,
        'soConTrongLanSinhNay': None,
        'gioiTinhCon': None,
        'canNang': None,
        'tenDuDinh': None,

        # Ghi chú
        'ghiChu': None,

        # Chữ ký
        'ngayKy': None,
        'nguoiDoiDe': None,
        'nguoiGhiPhieu': None,
        'thuTruongCoSo': None,
    }

    # TODO: Parse text using regex or structured extraction
    # For now, return raw text
    fields['rawText'] = text

    return fields

async def main():
    doc_path = '/home/dangkien/1st-Main/hackaithon/GovTrust-AI/data/test-documents/DK_THUONG_TRU/Mau-giay-chung-sinh.doc'
    temp_dir = '/tmp/qwen-ocr-test'
    os.makedirs(temp_dir, exist_ok=True)

    print("🔧 Testing Qwen OCR with Giấy chứng sinh\n")

    try:
        # Step 1: DOC → PDF
        pdf_path = doc_to_pdf(doc_path, temp_dir)

        # Step 2: PDF → Image
        image_path = pdf_to_image(pdf_path, temp_dir)

        # Step 3: Qwen OCR
        print(f"\n🤖 Running Qwen OCR...")

        # Get API key from environment
        qwen_api_key = os.getenv('QWEN_OCR_API_KEY')
        qwen_base_url = os.getenv('QWEN_OCR_BASE_URL', 'https://api.shopaikey.com/v1')

        if not qwen_api_key:
            print("⚠️  Warning: QWEN_OCR_API_KEY not set. Using dummy key for testing...")
            qwen_api_key = "dummy-key-for-testing"

        qwen_service = QwenOcrService(api_key=qwen_api_key, base_url=qwen_base_url)

        # Read image as bytes
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        # Use httpx client
        import httpx
        async with httpx.AsyncClient() as client:
            ocr_result = await qwen_service.extract(
                image=image_bytes,
                document_type='GIAY_CHUNG_SINH',
                http_client=client
            )

        print(f"\n✅ Qwen OCR Result:")
        print(json.dumps(ocr_result, indent=2, ensure_ascii=False))

        # Step 4: Extract structured fields
        print(f"\n📋 Extracted Fields:")
        fields = extract_giay_chung_sinh_fields(ocr_result)
        print(json.dumps(fields, indent=2, ensure_ascii=False))

        # Save results
        output_file = os.path.join(temp_dir, 'giay-chung-sinh-ocr-result.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'ocr_result': ocr_result,
                'extracted_fields': fields
            }, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {output_file}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
