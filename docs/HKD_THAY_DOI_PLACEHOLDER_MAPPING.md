# Mapping Placeholder cho HKD_THAY_DOI Template

## File template DOCX
`/home/dangkien/1st-Main/hackaithon/GovTrust-AI/template/renderable/HKD_THAY_DOI.docx`

## Cấu trúc tờ khai (từ mau-thong-bao-thay-di-chu-ho-kinh-doanh.md)

### Header
- `{{tenHoKinhDoanh}}` (dòng 5, cột trái: "TÊN HỘ KINH DOANH")
- `{{ngayThang}}` (dòng 7: "......, ngày...... tháng...... năm......")
- `{{soVanBan}}` (dòng 7: "Số: .................")

### Thông tin cơ bản hộ kinh doanh (dòng 14-25)
- `{{coQuanTiepNhan}}` (dòng 14: "Kính gửi: Phòng Tài chính - Kế hoạch ................")
- `{{hoKinhDoanh.tenHoKinhDoanh}}` (dòng 16)
- `{{hoKinhDoanh.maSo}}` (dòng 18: "Mã số hộ kinh doanh/Mã số thuế")
- `{{hoKinhDoanh.maSoDangKy}}` (dòng 20: "Mã số đăng ký hộ kinh doanh")
- `{{hoKinhDoanh.dienThoai}}` (dòng 22)
- `{{hoKinhDoanh.fax}}` (dòng 22)
- `{{hoKinhDoanh.email}}` (dòng 24)
- `{{hoKinhDoanh.website}}` (dòng 24)

### Lý do thay đổi (dòng 28-34) - Checkbox
- `{{thayDoi.lyDo.uyQuyen}}` (dòng 30: checkbox "Thành viên hộ gia đình ủy quyền")
- `{{thayDoi.lyDo.tang}}` (dòng 32: checkbox "Tặng cho hộ kinh doanh")
- `{{thayDoi.lyDo.ban}}` (dòng 33: checkbox "Bán hộ kinh doanh")
- `{{thayDoi.lyDo.thuaKe}}` (dòng 34: checkbox "Thừa kế hộ kinh doanh")

### Phần 1: Chủ hộ CŨ (TRƯỚC khi thay đổi) - dòng 36-73
- `{{chuHoCu.hoTen}}` (dòng 38)
- `{{chuHoCu.gioiTinh}}` (dòng 38)
- `{{chuHoCu.ngaySinh}}` (dòng 40: "........./....../........")
- `{{chuHoCu.danToc}}` (dòng 40)
- `{{chuHoCu.quocTich}}` (dòng 40)

#### Loại giấy tờ pháp lý (dòng 42-45) - Checkbox
- `{{chuHoCu.loaiGiayTo.cccd}}` (dòng 44: checkbox "Căn cước công dân")
- `{{chuHoCu.loaiGiayTo.cmnd}}` (dòng 44: checkbox "Chứng minh nhân dân")

#### Thông tin CCCD chủ hộ cũ
- `{{chuHoCu.soCCCD}}` (dòng 47: "Số giấy tờ pháp lý của cá nhân")
- `{{chuHoCu.ngayCap}}` (dòng 49: "Ngày cấp: ..../..../.....")
- `{{chuHoCu.noiCap}}` (dòng 49: "Nơi cấp")
- `{{chuHoCu.hanSuDung}}` (dòng 51: "Có giá trị đến ngày")

#### Địa chỉ thường trú chủ hộ cũ (dòng 53-61)
- `{{chuHoCu.diaChiThuongTru.soNha}}` (dòng 55)
- `{{chuHoCu.diaChiThuongTru.xaPhuong}}` (dòng 57)
- `{{chuHoCu.diaChiThuongTru.quanHuyen}}` (dòng 59)
- `{{chuHoCu.diaChiThuongTru.tinhThanh}}` (dòng 61)

#### Địa chỉ liên lạc chủ hộ cũ (dòng 63-71)
- `{{chuHoCu.diaChiLienLac.soNha}}` (dòng 65)
- `{{chuHoCu.diaChiLienLac.xaPhuong}}` (dòng 67)
- `{{chuHoCu.diaChiLienLac.quanHuyen}}` (dòng 69)
- `{{chuHoCu.diaChiLienLac.tinhThanh}}` (dòng 71)

#### Liên hệ chủ hộ cũ
- `{{chuHoCu.dienThoai}}` (dòng 73)
- `{{chuHoCu.email}}` (dòng 73)

### Phần 2: Chủ hộ MỚI (SAU khi thay đổi) - dòng 75-112
- `{{chuHoMoi.hoTen}}` (dòng 77)
- `{{chuHoMoi.gioiTinh}}` (dòng 77)
- `{{chuHoMoi.ngaySinh}}` (dòng 79: "........./....../........")
- `{{chuHoMoi.danToc}}` (dòng 79)
- `{{chuHoMoi.quocTich}}` (dòng 79)

#### Loại giấy tờ pháp lý (dòng 81-84) - Checkbox
- `{{chuHoMoi.loaiGiayTo.cccd}}` (dòng 83: checkbox "Căn cước công dân")
- `{{chuHoMoi.loaiGiayTo.cmnd}}` (dòng 83: checkbox "Chứng minh nhân dân")

#### Thông tin CCCD chủ hộ mới
- `{{chuHoMoi.soCCCD}}` (dòng 86: "Số giấy tờ pháp lý của cá nhân")
- `{{chuHoMoi.ngayCap}}` (dòng 88: "Ngày cấp: ..../..../.....")
- `{{chuHoMoi.noiCap}}` (dòng 88: "Nơi cấp")
- `{{chuHoMoi.hanSuDung}}` (dòng 90: "Có giá trị đến ngày")

#### Địa chỉ thường trú chủ hộ mới (dòng 92-100)
- `{{chuHoMoi.diaChiThuongTru.soNha}}` (dòng 94)
- `{{chuHoMoi.diaChiThuongTru.xaPhuong}}` (dòng 96)
- `{{chuHoMoi.diaChiThuongTru.quanHuyen}}` (dòng 98)
- `{{chuHoMoi.diaChiThuongTru.tinhThanh}}` (dòng 100)

#### Địa chỉ liên lạc chủ hộ mới (dòng 102-110)
- `{{chuHoMoi.diaChiLienLac.soNha}}` (dòng 104)
- `{{chuHoMoi.diaChiLienLac.xaPhuong}}` (dòng 106)
- `{{chuHoMoi.diaChiLienLac.quanHuyen}}` (dòng 108)
- `{{chuHoMoi.diaChiLienLac.tinhThanh}}` (dòng 110)

#### Liên hệ chủ hộ mới
- `{{chuHoMoi.dienThoai}}` (dòng 112)
- `{{chuHoMoi.email}}` (dòng 112)

### Chữ ký (dòng 118)
- **Chủ hộ mới** ký bên trái: "CHỦ HỘ KINH DOANH SAU KHI THAY ĐỔI (Ký và ghi họ tên)"
- **Chủ hộ cũ** ký bên phải: "CHỦ HỘ KINH DOANH TRƯỚC KHI THAY ĐỔI (Ký và ghi họ tên)"

---

## Mapping với formFields trong mvp-procedures.ts

| FormField ID | Placeholder trong DOCX |
|-------------|------------------------|
| `coQuanTiepNhan` | `{{coQuanTiepNhan}}` |
| `hoKinhDoanh.tenHoKinhDoanh` | `{{hoKinhDoanh.tenHoKinhDoanh}}` |
| `hoKinhDoanh.maSo` | `{{hoKinhDoanh.maSo}}` |
| `hoKinhDoanh.dienThoai` | `{{hoKinhDoanh.dienThoai}}` |
| `hoKinhDoanh.email` | `{{hoKinhDoanh.email}}` |
| `chuHoCu.hoTen` | `{{chuHoCu.hoTen}}` |
| `chuHoCu.soCCCD` | `{{chuHoCu.soCCCD}}` |
| `chuHoCu.ngaySinh` | `{{chuHoCu.ngaySinh}}` |
| `chuHoCu.gioiTinh` | `{{chuHoCu.gioiTinh}}` |
| `chuHoCu.danToc` | `{{chuHoCu.danToc}}` |
| `chuHoCu.quocTich` | `{{chuHoCu.quocTich}}` |
| `chuHoCu.ngayCap` | `{{chuHoCu.ngayCap}}` |
| `chuHoCu.noiCap` | `{{chuHoCu.noiCap}}` |
| `chuHoCu.diaChiThuongTru` | `{{chuHoCu.diaChiThuongTru.soNha}}` + xã/huyện/tỉnh |
| `chuHoCu.dienThoai` | `{{chuHoCu.dienThoai}}` |
| `chuHoCu.email` | `{{chuHoCu.email}}` |
| `chuHoMoi.hoTen` | `{{chuHoMoi.hoTen}}` |
| `chuHoMoi.soCCCD` | `{{chuHoMoi.soCCCD}}` |
| `chuHoMoi.ngaySinh` | `{{chuHoMoi.ngaySinh}}` |
| `chuHoMoi.gioiTinh` | `{{chuHoMoi.gioiTinh}}` |
| `chuHoMoi.danToc` | `{{chuHoMoi.danToc}}` |
| `chuHoMoi.quocTich` | `{{chuHoMoi.quocTich}}` |
| `chuHoMoi.ngayCap` | `{{chuHoMoi.ngayCap}}` |
| `chuHoMoi.noiCap` | `{{chuHoMoi.noiCap}}` |
| `chuHoMoi.diaChiThuongTru` | `{{chuHoMoi.diaChiThuongTru.soNha}}` + xã/huyện/tỉnh |
| `chuHoMoi.dienThoai` | `{{chuHoMoi.dienThoai}}` |
| `chuHoMoi.email` | `{{chuHoMoi.email}}` |
| `thayDoi.lyDo` | `{{thayDoi.lyDo}}` (checkbox) |
| `thayDoi.noiDung` | `{{thayDoi.noiDung}}` |

---

## Hướng dẫn sửa file DOCX

### Bước 1: Mở file trong Word/LibreOffice

```bash
libreoffice /home/dangkien/1st-Main/hackaithon/GovTrust-AI/template/renderable/HKD_THAY_DOI.docx
```

### Bước 2: Find & Replace

Thay thế các dấu chấm/gạch ngang bằng placeholder:

#### Header
- Tìm: `TÊN HỘ KINH DOANH\-------`
- Thay: `{{hoKinhDoanh.tenHoKinhDoanh}}`

- Tìm: `Số: .................`
- Thay: `Số: {{soVanBan}}`

- Tìm: `......, ngày...... tháng...... năm......`
- Thay: `{{ngayThang}}`

#### Thông tin hộ kinh doanh
- Tìm: `Tên hộ kinh doanh (*ghi bằng chữ in hoa*): ......................................................................`
- Thay: `Tên hộ kinh doanh: {{hoKinhDoanh.tenHoKinhDoanh}}`

- Tìm: `Mã số hộ kinh doanh/Mã số thuế: ................................................................................`
- Thay: `Mã số hộ kinh doanh/Mã số thuế: {{hoKinhDoanh.maSo}}`

- Tìm: `Điện thoại (*nếu có*): ..................................................................`
- Thay: `Điện thoại: {{hoKinhDoanh.dienThoai}}`

- Tìm: `Email* *(*nếu có*): ........................................................................`
- Thay: `Email: {{hoKinhDoanh.email}}`

#### Chủ hộ cũ (Phần 1)
- Tìm: `Họ và tên (*ghi bằng chữ in hoa*): ...............................................  Giới tính: ....................`
- Thay: `Họ và tên: {{chuHoCu.hoTen}}  Giới tính: {{chuHoCu.gioiTinh}}`

- Tìm: `Sinh ngày: ........./....../........ Dân tộc: ......  Quốc tịch: ....................`
- Thay: `Sinh ngày: {{chuHoCu.ngaySinh}} Dân tộc: {{chuHoCu.danToc}}  Quốc tịch: {{chuHoCu.quocTich}}`

- Tìm: `Số giấy tờ pháp lý của cá nhân: ............................................................................`
- Thay: `Số giấy tờ pháp lý của cá nhân: {{chuHoCu.soCCCD}}`

- Tìm: `Ngày cấp: ..../..../.... Nơi cấp: ...................................................................................`
- Thay: `Ngày cấp: {{chuHoCu.ngayCap}} Nơi cấp: {{chuHoCu.noiCap}}`

- Tìm: `Số nhà, ngách, hẻm, ngõ, đường phố/tổ/xóm/ấp/thôn: .................................................`
- Thay: `{{chuHoCu.diaChiThuongTru.soNha}}`

- Tìm: `Xã/Phường/Thị trấn: ....................................................................................................`
- Thay: `Xã/Phường/Thị trấn: {{chuHoCu.diaChiThuongTru.xaPhuong}}`

- Tìm: `Quận/Huyện/Thị xã/Thành phố thuộc tỉnh: .....................................................................`
- Thay: `Quận/Huyện/Thị xã/Thành phố thuộc tỉnh: {{chuHoCu.diaChiThuongTru.quanHuyen}}`

- Tìm: `Tỉnh/Thành phố: ...........................................................................................................`
- Thay: `Tỉnh/Thành phố: {{chuHoCu.diaChiThuongTru.tinhThanh}}`

- Tìm: `Điện thoại* *(*nếu có*): ................................................  Email* *(*nếu có*): .............................`
- Thay: `Điện thoại: {{chuHoCu.dienThoai}}  Email: {{chuHoCu.email}}`

#### Chủ hộ mới (Phần 2)
Lặp lại tương tự với `chuHoMoi.*`

### Bước 3: Checkbox
Thay checkbox `□` bằng:
- `{{#if thayDoi.lyDo.uyQuyen}}☑{{else}}☐{{/if}}`
- `{{#if thayDoi.lyDo.tang}}☑{{else}}☐{{/if}}`
- `{{#if thayDoi.lyDo.ban}}☑{{else}}☐{{/if}}`
- `{{#if thayDoi.lyDo.thuaKe}}☑{{else}}☐{{/if}}`

---

## Tool hỗ trợ

Nếu cần tôi tạo script Python để tự động convert DOCX → template với placeholder?
