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
| **PDF Tools** | Ghép (+ resize), tách, xóa trang, đổi thứ tự trang, xoay, resize, edit PDF, PDF → Word, PDF → PPTX |

## Backend PDF nâng cao

Repo có thêm backend Cloud Run tại `backend/pdf_service` cho các tác vụ PDF nặng:

- Edit/replace text trong PDF bằng PyMuPDF và font Unicode.
- Convert PDF sang Word dạng text thật/layout bằng `pdf2docx`.
- OCR PDF scan sang Word bằng Tesseract `eng+vie`.

Deploy nhanh:

```bash
gcloud run deploy sidekick-backend ^
  --source backend/pdf_service ^
  --project project-46195ba0-41f0-4a5a-af7 ^
  --region asia-southeast1 ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 2 ^
  --timeout 900
```

Service hiện tại của Sidekick Suites là:

```text
https://sidekick-backend-12809406757.asia-southeast1.run.app
```

Nếu deploy sang URL khác, trỏ frontend bằng browser console:

```js
localStorage.setItem('sidekickPdfApiBase', 'https://YOUR_CLOUD_RUN_URL')
```

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

- Phần PDF cơ bản xử lý **client-side**; edit/convert Word nâng cao sẽ upload PDF lên Cloud Run backend nếu được cấu hình
- Không cần đăng nhập, không cần backend
- Tất cả dữ liệu ở trong browser, không lưu lại sau khi đóng tab
