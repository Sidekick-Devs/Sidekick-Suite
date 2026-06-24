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
