# YouLearn AI - Nền tảng Hỗ trợ Học tập thông minh qua Video & Tài liệu

YouLearn AI là một hệ thống hỗ trợ học tập thông minh dựa trên AI, giúp học viên tự động trích xuất phụ đề từ Video (Whisper), chuyển đổi tài liệu PDF/Word (MinerU/pdf-oxide/mammoth), trò chuyện hỏi đáp trực tiếp trên nội dung tài liệu (RAG) và tạo câu hỏi kiểm tra thích ứng (Adaptive Learning Engine).

---

## 🛠️ Yêu cầu Hệ thống (Prerequisites)

* **Backend**: Python 3.10 trở lên, PostgreSQL (cần kích hoạt Extension pg_trgm nếu dùng tìm kiếm nâng cao).
* **Frontend**: Node.js 18 trở lên & npm.

---

## 🚀 Hướng dẫn Cài đặt & Vận hành

### 1. Cấu hình Backend (FastAPI)

1. **Khởi tạo môi trường ảo Python**:
   ```bash
   python -m venv .venv
   ```
2. **Kích hoạt môi trường ảo**:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. **Cài đặt thư viện phụ thuộc**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Cấu hình biến môi trường**:
   * Sao chép file cấu hình mẫu:
     ```bash
     cp .env.example .env
     ```
   * Mở file `.env` mới tạo và điền các thông tin:
     * `DATABASE_URL`: Đường dẫn kết nối database PostgreSQL (ví dụ `postgresql+asyncpg://user:pass@localhost:5432/db_name`).
     * `OPENAI_API_KEY`: API Key OpenAI để sinh tóm tắt, RAG chat và quiz.
5. **Khởi chạy Backend Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   API sẽ chạy tại địa chỉ: [http://localhost:8000](http://localhost:8000). Tài liệu hướng dẫn Swagger UI khả dụng tại [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Cấu hình Frontend (Next.js)

1. **Di chuyển vào thư mục frontend**:
   ```bash
   cd frontend
   ```
2. **Cài đặt các thư viện**:
   ```bash
   npm install
   ```
3. **Cấu hình biến môi trường (Tùy chọn)**:
   Mặc định, frontend sẽ trỏ tới API Backend tại `http://localhost:8000`. Nếu chạy Backend trên cổng khác, hãy tạo tệp `.env.local` trong thư mục `frontend` và thêm dòng:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```
4. **Khởi chạy ứng dụng Next.js**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ khả dụng tại: [http://localhost:3000](http://localhost:3000).

---

### 📖 Lưu ý về cấu hình MinerU (Xử lý PDF Fallback)

Hệ thống YouLearn AI sử dụng công cụ **MinerU (magic-pdf)** để chuyển đổi tài liệu PDF phức tạp chứa công thức và bảng biểu:
* Cấu hình MinerU được đồng bộ trong thư mục `mineru_resources/`.
* Các tệp tin mô hình nặng (`mineru_resources/models/`) đã được cấu hình ẩn trong `.gitignore` để tránh đẩy lên Git.
* Khi chạy dự án lần đầu, hệ thống sẽ tự động cập nhật động đường dẫn tuyệt đối của thư mục `models/` trên máy của bạn vào tệp cấu hình [magic-pdf.json](file:///c:/devWeb/learn_video/mineru_resources/magic-pdf.json) để đảm bảo tính năng chạy không bị lỗi đường dẫn.
* Để tải bộ dữ liệu mô hình của MinerU, vui lòng tham khảo tài liệu chính thức của [MinerU GitHub](https://github.com/opendatalab/MinerU).
