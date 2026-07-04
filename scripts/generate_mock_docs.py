import os
from PIL import Image, ImageDraw, ImageFont

def create_document(filename, title, fields):
    width, height = (800, 500) if "cccd" in filename.lower() else (800, 1000)
    img = Image.new('RGB', (width, height), color='white')
    d = ImageDraw.Draw(img)
    
    try:
        font_title = ImageFont.truetype("arial.ttf", 30)
        font_text = ImageFont.truetype("arial.ttf", 22)
    except IOError:
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()
        
    y_text = 40
    d.text((width/2 - 200, y_text), title, fill="black", font=font_title)
    y_text += 60
    
    for key, value in fields.items():
        d.text((50, y_text), f"{key}: {value}", fill="black", font=font_text)
        y_text += 40
        
    os.makedirs("test-docs", exist_ok=True)
    filepath = os.path.join("test-docs", filename)
    img.save(filepath)
    print(f"Đã tạo file: {filepath}")

if __name__ == "__main__":
    cccd_fields = {
        "Số / No": "001234567890",
        "Họ và tên / Full name": "NGUYỄN VĂN A",
        "Ngày sinh / Date of birth": "01/01/2000",
        "Giới tính / Sex": "Nam",
        "Quốc tịch / Nationality": "Việt Nam",
        "Quê quán / Place of origin": "Phường Minh Khai, Hà Nội",
        "Nơi thường trú / Place of residence": "Phường Minh Khai, Hà Nội",
        "Có giá trị đến / Date of expiry": "01/01/2035"
    }
    create_document("test_cccd_front.jpg", "CĂN CƯỚC CÔNG DÂN", cccd_fields)
    
    ks_fields = {
        "Họ, chữ đệm, tên": "NGUYỄN VĂN A",
        "Ngày, tháng, năm sinh": "01/01/2000",
        "Giới tính": "Nam",
        "Dân tộc": "Kinh",
        "Quốc tịch": "Việt Nam",
        "Nơi sinh": "Bệnh viện Bạch Mai, Hà Nội",
        "Quê quán": "Hà Nội",
        "Số định danh cá nhân": "001234567890",
        "Họ, chữ đệm, tên người mẹ": "TRẦN THỊ B",
        "Năm sinh mẹ": "1975",
        "Họ, chữ đệm, tên người cha": "NGUYỄN VĂN C",
        "Năm sinh cha": "1970",
        "Nơi đăng ký khai sinh": "UBND phường Minh Khai",
        "Ngày, tháng, năm đăng ký": "05/01/2000",
        "Số": "01/2000/KS"
    }
    create_document("test_giay_khai_sinh.jpg", "GIẤY KHAI SINH", ks_fields)
    
    kh_fields = {
        "Số": "12/2026/KH",
        "Họ, chữ đệm, tên vợ": "TRẦN THỊ B",
        "Ngày, tháng, năm sinh vợ": "02/02/2001",
        "Dân tộc vợ": "Kinh",
        "Quốc tịch vợ": "Việt Nam",
        "Nơi cư trú của vợ": "Hà Nội",
        "Giấy tờ tùy thân của vợ": "CCCD 001111111111",
        "Họ, chữ đệm, tên chồng": "NGUYỄN VĂN A",
        "Ngày, tháng, năm sinh chồng": "01/01/2000",
        "Dân tộc chồng": "Kinh",
        "Quốc tịch chồng": "Việt Nam",
        "Nơi cư trú của chồng": "Hà Nội",
        "Giấy tờ tùy thân của chồng": "CCCD 001234567890",
        "Nơi đăng ký kết hôn": "UBND phường Minh Khai",
        "Ngày, tháng, năm đăng ký": "01/06/2026"
    }
    create_document("test_giay_ket_hon.jpg", "GIẤY CHỨNG NHẬN KẾT HÔN", kh_fields)
