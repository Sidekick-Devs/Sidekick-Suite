# Sidekick PDF Service

Backend Cloud Run cho các tác vụ PDF nặng:

- `POST /pdf/edit-text`: replace/add text, highlight, rectangle bằng PyMuPDF và font Unicode.
- `POST /pdf/convert-word`: convert PDF sang Word.
  - `mode=layout`: giữ layout tốt nhất có thể bằng `pdf2docx`.
  - `mode=text`: xuất text sạch, dễ sửa.
  - `mode=ocr`: OCR PDF scan bằng Tesseract `eng+vie`.
- `POST /pdf/analyze-text`: đọc text blocks và tọa độ.

## Local

```bash
cd backend/pdf_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Frontend có thể trỏ local backend bằng console browser:

```js
localStorage.setItem('sidekickPdfApiBase', 'http://localhost:8080')
```

## Deploy Cloud Run

### Đăng nhập OTP khi chạy frontend local

Cloud Run cần cho phép đúng origin của frontend trong `ALLOWED_ORIGINS`, gồm cả port. Cấu hình dùng cho production và Live Server port 5501:

```text
https://sidekick-devs.github.io,http://127.0.0.1:5501,http://localhost:5501
```

Nếu email OTP đã đến nhưng giao diện báo lỗi kết nối, kiểm tra CORS: trình duyệt có thể gửi POST nhưng chặn đọc phản hồi khi origin chưa được phép. Cả `/auth/send-code` và `/auth/verify-code` đều cần origin này. Khi đổi port local, bổ sung origin tương ứng và giữ domain production. Không dùng `mode: 'no-cors'` vì frontend cần đọc phản hồi và token đăng nhập.

PowerShell: cập nhật riêng biến CORS, giữ các biến môi trường khác bằng flags file để tránh lỗi dấu phẩy của gcloud trên Windows:

```powershell
$corsFlags = Join-Path $env:TEMP 'sidekick-cors-flags.json'
@{ '--update-env-vars' = @{ ALLOWED_ORIGINS = 'https://sidekick-devs.github.io,http://127.0.0.1:5501,http://localhost:5501' } } | ConvertTo-Json | Set-Content -LiteralPath $corsFlags -Encoding ascii
gcloud.cmd run services update sidekick-backend --project project-46195ba0-41f0-4a5a-af7 --region asia-southeast1 --flags-file=$corsFlags
```

```bash
gcloud run deploy sidekick-backend ^
  --source backend/pdf_service ^
  --project project-46195ba0-41f0-4a5a-af7 ^
  --region asia-southeast1 ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 2 ^
  --timeout 900 ^
  --set-env-vars ALLOWED_ORIGINS=https://YOUR_FRONTEND_DOMAIN,TESSERACT_LANG=eng+vie
```

Service hiện tại của Sidekick Suites là:

```text
https://sidekick-backend-12809406757.asia-southeast1.run.app
```

Nếu deploy sang URL khác, trỏ frontend:

```js
localStorage.setItem('sidekickPdfApiBase', 'https://YOUR_CLOUD_RUN_URL')
```

Hoặc sửa hẳn `PDF_API_BASE` trong `index.html` để URL mới là mặc định.
