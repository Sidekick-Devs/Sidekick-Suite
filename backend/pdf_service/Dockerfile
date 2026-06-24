FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080 \
    TESSERACT_LANG=eng+vie \
    PDF_FONT_PATH=/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ghostscript \
      fonts-noto-core \
      tesseract-ocr \
      tesseract-ocr-eng \
      tesseract-ocr-vie \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
