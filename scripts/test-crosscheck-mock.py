#!/usr/bin/env python3
"""
Test cross-check với mock data (không cần real services)
Gọi trực tiếp CrossChecker từ rule-engine
"""

import sys
import json
from pathlib import Path

# Mock CrossChecker (giả lập logic từ @govtrust/rule-engine)
class CrossChecker:
    def run(self, procedure, documents):
        """Chạy cross-check rules"""
        results = {
            "checks": [],
            "summary": {"mismatches": 0, "missing": 0}
        }

        # Extract fields from documents
        doc_fields = {}
        for doc in documents:
            checklistId = doc["checklistId"]
            fields = doc.get("fields", {})
            doc_fields[checklistId] = fields

        # Run each cross-check rule
        for rule in procedure.get("crossCheckRules", []):
            check_result = self._check_rule(rule, doc_fields)
            results["checks"].append(check_result)

            if check_result["status"] == "MISMATCH":
                results["summary"]["mismatches"] += 1

        return results

    def _check_rule(self, rule, doc_fields):
        """Check single rule"""
        left_path = rule["left"]  # e.g., "cccd_nguoi_yeu_cau.hoTen"
        right_path = rule["right"]  # e.g., "giay_chung_sinh.hoTenMe"

        # Parse paths
        left_doc, left_field = left_path.split(".", 1)
        right_doc, right_field = right_path.split(".", 1)

        # Get values
        left_value = self._get_field_value(doc_fields.get(left_doc, {}), left_field)
        right_value = self._get_field_value(doc_fields.get(right_doc, {}), right_field)

        # Skip if missing and skipIfMissing is set
        skip_if_missing = rule.get("skipIfMissing", "")
        if skip_if_missing and not doc_fields.get(skip_if_missing):
            return {
                "name": rule["name"],
                "status": "SKIPPED",
                "severity": rule["severityIfMismatch"],
                "reason": f"Missing document: {skip_if_missing}"
            }

        # Skip if either value is missing
        if not left_value or not right_value:
            return {
                "name": rule["name"],
                "status": "SKIPPED",
                "severity": rule["severityIfMismatch"],
                "leftValue": left_value,
                "rightValue": right_value
            }

        # Match based on matchType
        match_type = rule.get("matchType", "exact")
        matched = self._match_values(left_value, right_value, match_type, rule.get("tolerance", 0.8))

        return {
            "name": rule["name"],
            "status": "MATCH" if matched else "MISMATCH",
            "severity": rule["severityIfMismatch"],
            "leftValue": left_value,
            "rightValue": right_value,
            "field": left_path
        }

    def _get_field_value(self, fields, field_path):
        """Extract nested field value"""
        if not fields:
            return None

        # Handle nested paths like "hoTen"
        if "." in field_path:
            parts = field_path.split(".")
            value = fields
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return None
            return value

        return fields.get(field_path)

    def _match_values(self, left, right, match_type, tolerance):
        """Compare two values based on match type"""
        if match_type == "normalized":
            # Remove diacritics, lowercase, trim
            left_norm = self._normalize(str(left))
            right_norm = self._normalize(str(right))
            return left_norm == right_norm

        elif match_type == "fuzzy":
            # Simple fuzzy match (character overlap)
            left_str = str(left).lower()
            right_str = str(right).lower()

            if not left_str or not right_str:
                return False

            # Levenshtein-like ratio
            matches = sum(1 for a, b in zip(left_str, right_str) if a == b)
            max_len = max(len(left_str), len(right_str))
            ratio = matches / max_len if max_len > 0 else 0

            return ratio >= tolerance

        else:  # exact
            return str(left) == str(right)

    def _normalize(self, text):
        """Normalize Vietnamese text"""
        import unicodedata

        # Remove diacritics
        text = unicodedata.normalize('NFD', text)
        text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')

        # Lowercase and strip
        return text.lower().strip()


def load_procedure():
    """Load DANG_KY_KHAI_SINH procedure definition"""
    return {
        "code": "DANG_KY_KHAI_SINH",
        "name": "Đăng ký khai sinh",
        "crossCheckRules": [
            {
                "name": "Họ tên mẹ trên CCCD khớp với Giấy chứng sinh",
                "left": "cccd_nguoi_yeu_cau.hoTen",
                "right": "giay_chung_sinh.hoTenMe",
                "matchType": "normalized",
                "severityIfMismatch": "HIGH",
                "skipIfMissing": "giay_chung_sinh"
            },
            {
                "name": "Họ tên cha trên CCCD khớp với Giấy chứng sinh",
                "left": "cccd_cha.hoTen",
                "right": "giay_chung_sinh.hoTenCha",
                "matchType": "normalized",
                "severityIfMismatch": "MEDIUM",
                "skipIfMissing": "cccd_cha"
            },
            {
                "name": "Họ tên vợ/chồng trên GCN kết hôn khớp với CCCD cha mẹ",
                "left": "giay_chung_nhan_ket_hon.hoTenVo",
                "right": "cccd_nguoi_yeu_cau.hoTen",
                "matchType": "normalized",
                "severityIfMismatch": "LOW",
                "skipIfMissing": "giay_chung_nhan_ket_hon"
            }
        ]
    }


def convert_ocr_to_documents(ocr_data):
    """Convert ocrData format to documents array"""
    documents = []

    for checklist_id, doc_data in ocr_data.items():
        documents.append({
            "checklistId": checklist_id,
            "documentTypeCode": doc_data.get("documentTypeCode", ""),
            "fields": doc_data.get("fields", {})
        })

    return documents


def test_scenario(scenario_file: Path):
    """Test một scenario"""
    print(f"\n{'='*80}")
    print(f"📋 Testing: {scenario_file.name}")
    print(f"{'='*80}\n")

    # Load mock data
    with open(scenario_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"📝 Description: {data.get('description', 'N/A')}")

    # Convert to documents
    documents = convert_ocr_to_documents(data["ocrData"])

    # Load procedure
    procedure = load_procedure()

    # Run cross-check
    checker = CrossChecker()
    result = checker.run(procedure, documents)

    # Print results
    print(f"\n🔍 Cross-check results:")
    print(f"   Mismatches: {result['summary']['mismatches']}")
    print(f"   Missing: {result['summary']['missing']}")

    print(f"\n📊 Detailed checks:")
    for check in result["checks"]:
        status_icon = "✅" if check["status"] == "MATCH" else "❌" if check["status"] == "MISMATCH" else "⏭️"
        severity_color = {
            "HIGH": "🔴",
            "MEDIUM": "🟡",
            "LOW": "🟢"
        }.get(check["severity"], "⚪")

        print(f"\n{status_icon} {check['name']}")
        print(f"   Status: {check['status']} {severity_color} {check['severity']}")

        if check["status"] != "SKIPPED":
            print(f"   Left:  {check.get('leftValue', 'N/A')}")
            print(f"   Right: {check.get('rightValue', 'N/A')}")
        elif "reason" in check:
            print(f"   Reason: {check['reason']}")

    return result


def main():
    print("🧪 Testing Cross-Check với Mock Data\n")

    # Find all mock scenarios
    mock_dir = Path(__file__).parent.parent / "data" / "test-documents" / "mock-ocr-sessions"

    if not mock_dir.exists():
        print(f"❌ Mock data directory not found: {mock_dir}")
        sys.exit(1)

    scenario_files = sorted(mock_dir.glob("*.json"))

    if not scenario_files:
        print(f"❌ No scenario files found in {mock_dir}")
        sys.exit(1)

    print(f"Found {len(scenario_files)} scenarios\n")

    # Test each scenario
    results = {}
    for scenario_file in scenario_files:
        try:
            result = test_scenario(scenario_file)
            results[scenario_file.stem] = result
        except Exception as e:
            print(f"\n❌ Error testing {scenario_file.name}: {e}")
            import traceback
            traceback.print_exc()

    # Summary
    print(f"\n\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}\n")

    for name, result in results.items():
        mismatches = result["summary"]["mismatches"]
        status = "✅ PASS" if mismatches == 0 else f"❌ {mismatches} mismatches"
        print(f"{status:20s} {name}")


if __name__ == "__main__":
    main()
