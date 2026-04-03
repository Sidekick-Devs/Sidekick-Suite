# Sidekick Suites

Bộ công cụ nội bộ chạy hoàn toàn trên trình duyệt (không cần backend).

## Tính năng

| Công cụ | Chức năng |
|---|---|
| **Text Cleaner** | Trim, strip HTML/URL/emoji, xóa dòng trùng, find & replace |
| **Chuyển mã** | Unicode ↔ ASCII không dấu ↔ VIQR ↔ URL slug |
| **Word Counter** | Đếm từ/ký tự/câu, thời gian đọc, top từ hay dùng |
| **JSON Formatter** | Format, minify, validate, sort keys |
| **Regex Tester** | Test regex với highlight, replace, group capture |
| **Base64** | Encode/decode text và file |
| **Color Converter** | HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK + palette |
| **PDF Tools** | Ghép (+ resize), tách, xóa trang, xoay, resize |

## Deploy lên GitHub Pages

1. Tạo repo mới trên GitHub (public hoặc private với GitHub Pro)
2. Push code lên:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/YOUR_USERNAME/internal-tools.git
   git push -u origin main
   ```
3. Vào **Settings → Pages → Source**: chọn `main` branch, folder `/root`
4. Sau ~1 phút truy cập: `https://YOUR_USERNAME.github.io/internal-tools`

## Lưu ý

- File PDF xử lý **client-side** — không upload lên server nào
- Không cần đăng nhập, không cần backend
- Tất cả dữ liệu ở trong browser, không lưu lại sau khi đóng tab
