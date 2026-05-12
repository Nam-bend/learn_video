from pdf_oxide import PdfDocument, OfficeConverter
from pathlib import Path

def extract_text_from_pdf(file_path: str):
    """
    Trích xuất văn bản từ PDF bằng pdf_oxide.
    """
    try:
        doc = PdfDocument(file_path)
        segments = []
        for i in range(doc.page_count()):
            text = doc.extract_text(i).strip()
            if text:
                segments.append({"page": i + 1, "text": text})
        return segments
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return []

def extract_text_from_docx(file_path: str):
    """
    Trích xuất văn bản từ Word (.docx) bằng OfficeConverter của pdf_oxide.
    """
    try:
        # Chuyển đổi DOCX sang dạng tài liệu PDF nội bộ của oxide
        pdf_obj = OfficeConverter.from_docx(file_path)
        
        # Cần chuyển sang PdfDocument để trích xuất text
        pdf_bytes = pdf_obj.to_bytes()
        doc = PdfDocument.from_bytes(pdf_bytes)
        
        segments = []
        
        for i in range(doc.page_count()):
            text = doc.extract_text(i).strip()
            if text:
                segments.append({"page": i + 1, "text": text})
        return segments
    except Exception as e:
        print(f"Error extracting DOCX with office_oxide: {e}")
        return []
