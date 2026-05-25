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

import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(file_path: str):
    """
    Trích xuất văn bản nâng cao (Advanced Semantic Extraction) từ Word (.docx):
    1. Bảo toàn cấu trúc tiêu đề (Headings) để làm ngữ cảnh phân cấp (Heading Hierarchy).
    2. Chuyển đổi bảng biểu (Tables) thành định dạng Markdown chuẩn giúp RAG và LLM hiểu số liệu 100%.
    3. Giữ định dạng danh sách (Bullet points).
    Giúp hệ thống RAG hoạt động với độ chính xác cao nhất tuyệt đối.
    """
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            ns = {
                'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                'xml': 'http://www.w3.org/XML/1998/namespace'
            }
            
            # Hàm lấy text từ một paragraph (w:p) hoặc cell
            def get_para_text(para_elem):
                texts = []
                for run in para_elem.findall('.//w:t', ns):
                    if run.text:
                        texts.append(run.text)
                return "".join(texts).strip()

            # Kiểm tra xem paragraph có phải là Heading không
            def get_para_heading_level(para_elem):
                p_style = para_elem.find('.//w:pPr/w:pStyle', ns)
                if p_style is not None:
                    val = p_style.get(f'{{{ns["w"]}}}val')
                    if val and ('Heading' in val or 'Title' in val):
                        return val
                return None

            # Kiểm tra danh sách (Bullet / Numbered list)
            def is_list_item(para_elem):
                num_pr = para_elem.find('.//w:pPr/w:numPr', ns)
                return num_pr is not None

            body = root.find('.//w:body', ns)
            if body is None:
                return []

            elements_data = []
            current_heading_path = [] # Lưu vết Heading để gán ngữ cảnh

            # Duyệt qua các phần tử con trực tiếp của w:body theo thứ tự xuất hiện
            for child in body:
                tag = child.tag.split('}')[-1]
                
                if tag == 'p': # Paragraph
                    text = get_para_text(child)
                    if not text:
                        continue
                    
                    heading_style = get_para_heading_level(child)
                    
                    if heading_style:
                        # Xác định cấp độ heading (Heading1, Heading2...)
                        level_str = heading_style.replace('Heading', '').replace('Title', '1')
                        level = int(level_str) if level_str.isdigit() else 1
                        
                        # Cập nhật đường dẫn tiêu đề hiện tại
                        if len(current_heading_path) >= level:
                            current_heading_path = current_heading_path[:level - 1]
                        current_heading_path.append(text)
                        
                        elements_data.append({
                            "type": "heading",
                            "text": f"\n{'#' * level} {text}\n",
                            "raw_text": text
                        })
                    else:
                        # Đính kèm ngữ cảnh tiêu đề vào đoạn văn (Context-Enrichment)
                        context_prefix = ""
                        if current_heading_path:
                            context_prefix = f"[{' > '.join(current_heading_path)}]: "
                        
                        prefix = "- " if is_list_item(child) else ""
                        
                        elements_data.append({
                            "type": "text",
                            "text": f"{prefix}{text}",
                            "context_text": f"{context_prefix}{prefix}{text}",
                            "raw_text": text
                        })
                        
                elif tag == 'tbl': # Table
                    rows = child.findall('.//w:tr', ns)
                    if not rows:
                        continue
                    
                    markdown_rows = []
                    grid_data = []
                    for row in rows:
                        row_cells = []
                        cells = row.findall('.//w:tc', ns)
                        for cell in cells:
                            cell_paras = cell.findall('.//w:p', ns)
                            cell_text = " ".join(get_para_text(p) for p in cell_paras).strip()
                            row_cells.append(cell_text.replace('|', '\\|')) # Tránh hỏng định dạng markdown table
                        if any(row_cells): 
                            grid_data.append(row_cells)
                    
                    if not grid_data:
                        continue
                    
                    max_cols = max(len(r) for r in grid_data)
                    
                    # Tạo Markdown Table
                    for idx, r in enumerate(grid_data):
                        r += [""] * (max_cols - len(r))
                        markdown_rows.append("| " + " | ".join(r) + " |")
                        if idx == 0:
                            markdown_rows.append("| " + " | ".join(["---"] * max_cols) + " |")
                    
                    table_markdown = "\n" + "\n".join(markdown_rows) + "\n"
                    
                    context_prefix = ""
                    if current_heading_path:
                        context_prefix = f"[{' > '.join(current_heading_path)} (Bảng)]: "
                    
                    elements_data.append({
                        "type": "table",
                        "text": table_markdown,
                        "context_text": f"{context_prefix}\n{table_markdown}",
                        "raw_text": table_markdown
                    })

            if not elements_data:
                return []

            # Gom nhóm thành các trang để RAG và hiển thị
            segments = []
            current_page = 1
            current_page_texts = []
            word_count = 0
            
            for elem in elements_data:
                # Đối với RAG, ta dùng context_text để có ngữ cảnh đầy đủ nhất
                content_for_rag = elem.get("context_text", elem["text"])
                current_page_texts.append(content_for_rag)
                word_count += len(elem["raw_text"].split())
                
                if word_count >= 250 or len(current_page_texts) >= 6:
                    page_text = "\n\n".join(current_page_texts).strip()
                    segments.append({
                        "page": current_page,
                        "text": page_text
                    })
                    current_page += 1
                    current_page_texts = []
                    word_count = 0
            
            if current_page_texts:
                page_text = "\n\n".join(current_page_texts).strip()
                segments.append({
                    "page": current_page,
                    "text": page_text
                })
                
            return segments
            
    except Exception as e:
        print(f"Error in Advanced Semantic DOCX Parser: {e}")
        return []
