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
| **File Export** | Dán log/văn bản để xuất TXT, Markdown, JSON, HTML; đóng gói ảnh, video và tệp gốc cùng văn bản thành ZIP |
| **Quick Recipes** | Lưu và copy nhanh công thức Excel, regex, CSS, prompt, UTM naming và snippet hay dùng |
| **Color Converter** | HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK + palette |
| **PDF Tools** | Ghép (+ resize), tách, xóa trang, đổi thứ tự trang, xoay, resize, edit PDF, PDF → Word, PDF → PPTX |
| **QR Code** | QR danh thiếp vCard (quét là mở danh bạ, chỉ cần bấm Lưu), link, văn bản, WiFi, email, gọi điện; tải PNG/SVG/.vcf |
| **Command Palette** | `Ctrl+K` để mở nhanh tool hoặc copy Quick Recipes |

## Dùng File Export

1. Mở **File → File Export** hoặc tìm bằng `Ctrl+K`.
2. Dán log/văn bản, nhập tên file và chọn TXT hoặc Markdown để giữ nguyên nội dung UTF-8. JSON lưu văn bản trong trường `content`; HTML hiển thị văn bản an toàn, giữ xuống dòng.
3. Có thể chọn nhiều tệp, kéo thả hoặc dán ảnh từ clipboard. Khi có tệp đính kèm, dùng ZIP: gói gồm `content.txt`, `content.md` có liên kết đến tệp và thư mục `attachments/`. Các tệp trùng tên được đánh số để tránh ghi đè.
4. Nhấn **Tải file**. Dữ liệu được xử lý trong tab, không lưu nội dung vào localStorage hoặc tải lên backend. Đóng/tải lại tab sẽ mất nội dung chưa xuất.

Ảnh và video được giữ nguyên định dạng gốc trong ZIP; công cụ chưa chuyển mã media, OCR hoặc xuất DOCX/PDF. ZIP cần thư viện JSZip đã có trên trang và dùng bộ nhớ trình duyệt, nên tệp lớn phụ thuộc bộ nhớ thiết bị.

Kiểm tra logic export: `node --test tests/file-export.test.cjs` (ZIP được giả lập để kiểm tra tên tệp và dữ liệu đầu vào).

## Dùng QR Code (vCard)

1. Mở **Marketing → QR Code** hoặc tìm `qr` / `vcard` bằng `Ctrl+K`. Loại mặc định là **Danh thiếp (vCard)**.
2. Nhập họ tên, công ty, chức danh, số điện thoại, email, website, địa chỉ. QR cập nhật ngay; trường trống được bỏ qua.
3. Tải **PNG** (≈1024px, đã có viền trắng) để in/đăng, **SVG** cho thiết kế, hoặc **.vcf** để gửi kèm email.
4. Người nhận mở Camera iPhone hoặc Camera/Google Lens trên Android, chạm thông báo **Thêm liên hệ** → màn hình danh bạ đã điền sẵn → bấm **Lưu**.

QR dùng vCard 3.0 (iOS và Android đều hỗ trợ) mã hóa UTF-8 nên giữ được dấu tiếng Việt. Thông tin càng nhiều QR càng dày; nếu cảnh báo "QR khá dày", in tối thiểu 3×3 cm hoặc bật **Bỏ dấu tiếng Việt** / giảm mức sửa lỗi. Nên dùng màu QR đậm trên nền trắng.

Kiểm tra logic tạo nội dung QR: `node --test tests/qr-code.test.cjs`.

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
- Trong PDF Tools có nút **Check backend** để kiểm tra Cloud Run và Ghostscript
- Không cần đăng nhập, không cần backend
- Tất cả dữ liệu ở trong browser, không lưu lại sau khi đóng tab
