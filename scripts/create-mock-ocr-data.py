#!/usr/bin/env python3
"""
Tạo mock OCR data từ template images
Để test flow mà không cần API keys
"""

import json
from pathlib import Path

# Mock data cho các loại giấy tờ
MOCK_CCCD_ME = {
    "documentTypeCode": "CCCD",
    "fields": {
        "hoTen": "Nguyễn Thị Lan",
        "ngaySinh": "15/03/1995",
        "gioiTinh": "Nữ",
        "soCCCD": "001095012345",
        "queQuan": "Xã Tân Lập, Huyện Đan Phượng, Hà Nội",
        "diaChiThuongTru": "Số 10, Ngõ 5, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",
        "ngayCap": "10/05/2020",
        "noiCap": "Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư"
    },
    "imageQuality": {
        "brightness": 0.85,
        "sharpness": 0.90,
        "overall": "good"
    }
}

MOCK_CCCD_CHA = {
    "documentTypeCode": "CCCD",
    "fields": {
        "hoTen": "Trần Văn Minh",
        "ngaySinh": "20/08/1993",
        "gioiTinh": "Nam",
        "soCCCD": "001093098765",
        "queQuan": "Thôn Đông, Xã Hòa Bình, Huyện Chương Mỹ, Hà Nội",
        "diaChiThuongTru": "Số 10, Ngõ 5, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",
        "ngayCap": "15/06/2019",
        "noiCap": "Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư"
    },
    "imageQuality": {
        "brightness": 0.80,
        "sharpness": 0.85,
        "overall": "good"
    }
}

MOCK_GIAY_CHUNG_SINH = {
    "documentTypeCode": "GIAY_CHUNG_SINH",
    "fields": {
        "tenDuDinh": "Trần Minh An",
        "gioiTinhTreEm": "Nam",
        "ngayThangNamSinh": "05/01/2026",
        "gioSinh": "08:30",
        "noiSinh": "Bệnh viện Phụ sản Hà Nội",
        "canNang": "3.2",
        "hoTenMe": "Nguyễn Thị Lan",
        "ngaySinhMe": "15/03/1995",
        "danTocMe": "Kinh",
        "quocTichMe": "Việt Nam",
        "loaiGiayToMe": "CCCD",
        "soGiayToMe": "001095012345",
        "hoTenCha": "Trần Văn Minh",
        "ngaySinhCha": "20/08/1993",
        "danTocCha": "Kinh",
        "quocTichCha": "Việt Nam",
        "loaiGiayToCha": "CCCD",
        "soGiayToCha": "001093098765",
        "nguoiKhai": "Nguyễn Thị Lan",
        "quanHeVoiTreEm": "Mẹ"
    },
    "imageQuality": {
        "brightness": 0.75,
        "sharpness": 0.70,
        "overall": "acceptable"
    }
}

MOCK_GCN_KET_HON = {
    "documentTypeCode": "GIAY_CHUNG_NHAN_KET_HON",
    "fields": {
        "hoTenChong": "Trần Văn Minh",
        "ngaySinhChong": "20/08/1993",
        "hoTenVo": "Nguyễn Thị Lan",
        "ngaySinhVo": "15/03/1995",
        "ngayDangKy": "10/05/2024",
        "coQuanDangKy": "UBND Phường Láng Thượng, Quận Đống Đa, Hà Nội",
        "soGiayChungNhan": "KH-2024-001234"
    },
    "imageQuality": {
        "brightness": 0.82,
        "sharpness": 0.88,
        "overall": "good"
    }
}

# Scenarios với mức độ mismatch khác nhau
SCENARIOS = {
    "happy_path": {
        "description": "Tất cả giấy tờ khớp hoàn toàn",
        "ocrData": {
            "cccd_nguoi_yeu_cau": MOCK_CCCD_ME,
            "cccd_cha": MOCK_CCCD_CHA,
            "giay_chung_sinh": MOCK_GIAY_CHUNG_SINH,
            "giay_chung_nhan_ket_hon": MOCK_GCN_KET_HON
        }
    },

    "mother_name_mismatch": {
        "description": "Họ tên mẹ không khớp (HIGH severity)",
        "ocrData": {
            "cccd_nguoi_yeu_cau": {
                **MOCK_CCCD_ME,
                "fields": {**MOCK_CCCD_ME["fields"], "hoTen": "Nguyễn Thị Lan Anh"}
            },
            "cccd_cha": MOCK_CCCD_CHA,
            "giay_chung_sinh": MOCK_GIAY_CHUNG_SINH,
            "giay_chung_nhan_ket_hon": MOCK_GCN_KET_HON
        }
    },

    "father_name_mismatch": {
        "description": "Họ tên cha không khớp (MEDIUM severity)",
        "ocrData": {
            "cccd_nguoi_yeu_cau": MOCK_CCCD_ME,
            "cccd_cha": {
                **MOCK_CCCD_CHA,
                "fields": {**MOCK_CCCD_CHA["fields"], "hoTen": "Trần Minh Văn"}
            },
            "giay_chung_sinh": MOCK_GIAY_CHUNG_SINH
        }
    },

    "no_marriage_cert": {
        "description": "Không có giấy chứng nhận kết hôn (skipIfMissing)",
        "ocrData": {
            "cccd_nguoi_yeu_cau": MOCK_CCCD_ME,
            "cccd_cha": MOCK_CCCD_CHA,
            "giay_chung_sinh": MOCK_GIAY_CHUNG_SINH
        }
    },

    "single_mother": {
        "description": "Mẹ đơn thân - không có CCCD cha",
        "ocrData": {
            "cccd_nguoi_yeu_cau": MOCK_CCCD_ME,
            "giay_chung_sinh": {
                **MOCK_GIAY_CHUNG_SINH,
                "fields": {
                    **MOCK_GIAY_CHUNG_SINH["fields"],
                    "hoTenCha": "",
                    "ngaySinhCha": "",
                    "soGiayToCha": ""
                }
            }
        }
    },

    "normalized_pass": {
        "description": "Khác dấu/hoa thường nhưng vẫn PASS nhờ normalization",
        "ocrData": {
            "cccd_nguoi_yeu_cau": {
                **MOCK_CCCD_ME,
                "fields": {**MOCK_CCCD_ME["fields"], "hoTen": "NGUYEN THI LAN"}
            },
            "cccd_cha": {
                **MOCK_CCCD_CHA,
                "fields": {**MOCK_CCCD_CHA["fields"], "hoTen": "Trần Văn Mịnh"}
            },
            "giay_chung_sinh": MOCK_GIAY_CHUNG_SINH
        }
    }
}


def create_mock_session_payload(scenario_name: str):
    """Tạo payload để POST /sessions/mock"""
    scenario = SCENARIOS[scenario_name]
    return {
        "procedureCode": "DANG_KY_KHAI_SINH",
        "description": scenario["description"],
        "ocrData": scenario["ocrData"]
    }


def save_all_scenarios(output_dir: Path):
    """Lưu tất cả scenarios vào files"""
    output_dir.mkdir(parents=True, exist_ok=True)

    for name, scenario in SCENARIOS.items():
        payload = create_mock_session_payload(name)
        output_file = output_dir / f"{name}.json"

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved: {output_file.name} - {scenario['description']}")


def main():
    output_dir = Path(__file__).parent.parent / "data" / "test-documents" / "mock-ocr-sessions"

    print("🎭 Tạo mock OCR data cho test\n")
    save_all_scenarios(output_dir)

    print(f"\n📁 Output: {output_dir}")
    print("\n📝 Sử dụng:")
    print("   curl -X POST http://localhost:3001/api/sessions/mock \\")
    print("     -H 'Content-Type: application/json' \\")
    print(f"     -d @{output_dir}/happy_path.json")


if __name__ == "__main__":
    main()
