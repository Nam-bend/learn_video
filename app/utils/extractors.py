from pathlib import Path
import subprocess
import tempfile
import os
import zipfile
import xml.etree.ElementTree as ET
import shutil

# Gắn đường dẫn cấu hình để MinerU sử dụng cấu hình cục bộ trong dự án
os.environ["MINERU_TOOLS_CONFIG_JSON"] = r"c:\devWeb\learn_video\mineru_resources\magic-pdf.json"

def extract_text_from_pdf(file_path: str):
    """
    Trích xuất văn bản từ PDF theo từng trang.
    Primary: pdf_oxide (nhanh, chính xác từng trang, hỗ trợ citation [Trang X] đúng).
    Fallback: MinerU (magic-pdf CLI, chậm hơn, dùng cho PDF phức tạp có công thức/layout đặc biệt).
    """
    # --- PRIMARY: pdf_oxide (per-page, fast) ---
    try:
        from pdf_oxide import PdfDocument
        doc = PdfDocument(file_path)
        segments = []
        for i in range(doc.page_count()):
            text = doc.extract_text(i).strip()
            if text:
                segments.append({"page": i + 1, "text": text})
        if segments:
            print(f"[pdf_oxide] Trích xuất thành công {len(segments)} trang từ {Path(file_path).name}")
            return segments
        else:
            raise Exception("pdf_oxide trả về nội dung rỗng, thử MinerU...")
    except Exception as primary_e:
        print(f"[pdf_oxide] Lỗi: {primary_e}. Chuyển sang MinerU fallback...")

    # --- FALLBACK: MinerU (magic-pdf CLI, với timeout 120 giây) ---
    try:
        temp_dir = tempfile.mkdtemp()
        cmd = ["magic-pdf", "-p", file_path, "-o", temp_dir, "-m", "auto"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise Exception(f"magic-pdf trả về lỗi: {result.stderr[:500]}")

        found_md = None
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith('.md'):
                    found_md = os.path.join(root, file)
                    break
            if found_md:
                break

        if found_md and os.path.exists(found_md):
            with open(found_md, 'r', encoding='utf-8') as f:
                markdown_content = f.read()
            print(f"[MinerU] Trích xuất thành công từ {Path(file_path).name}")
            # MinerU gom thành 1 file MD, trả về như 1 trang duy nhất
            return [{"page": 1, "text": markdown_content}]
        else:
            raise Exception("Không tìm thấy file .md đầu ra của MinerU.")
    except Exception as fallback_e:
        print(f"[MinerU] Lỗi: {fallback_e}")
        return []

def extract_text_from_docx(file_path: str):
    """
    Trích xuất văn bản và hình ảnh từ DOCX bằng cách đọc trực tiếp XML nội bộ.
    Giúp giữ nguyên font chữ tiếng Việt (không bị lỗi CMap/font khi chuyển đổi qua PDF)
    và tăng tốc độ xử lý lên gấp nhiều lần.
    """
    print("Đang xử lý DOCX bằng XML Parser...")
    try:
        doc_id = Path(file_path).stem
        uploads_dir = Path("tmp/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        copied_images = set()
        
        with zipfile.ZipFile(file_path) as docx:
            # 1. Đọc và ánh xạ quan hệ hình ảnh (rId -> image path) từ document.xml.rels
            rels_mapping = {}
            try:
                rels_content = docx.read('word/_rels/document.xml.rels')
                rels_root = ET.fromstring(rels_content)
                for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                    rel_id = rel.get('Id')
                    rel_type = rel.get('Type')
                    rel_target = rel.get('Target')
                    if rel_id and rel_target and 'relationships/image' in rel_type:
                        target_path = rel_target
                        if not target_path.startswith('word/'):
                            target_path = f"word/{target_path}"
                        rels_mapping[rel_id] = target_path
            except Exception as rels_err:
                print(f"Lỗi đọc file quan hệ .rels: {rels_err}")

            # 2. Đọc nội dung document.xml
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            ns = {
                'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                'xml': 'http://www.w3.org/XML/1998/namespace'
            }
            
            # Hàm lấy text và hình ảnh từ một paragraph (w:p) hoặc cell
            def get_para_content(para_elem):
                texts = []
                for run in para_elem.findall('.//w:t', ns):
                    if run.text:
                        texts.append(run.text)
                para_text = "".join(texts).strip()
                
                # Tìm kiếm hình ảnh trong paragraph
                images_markdown = []
                for blip in para_elem.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip'):
                    r_id = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') or blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}link')
                    if r_id and r_id in rels_mapping:
                        img_zip_path = rels_mapping[r_id]
                        img_filename = os.path.basename(img_zip_path)
                        dest_name = f"{doc_id}_{img_filename}"
                        dest_path = uploads_dir / dest_name
                        
                        if dest_name not in copied_images:
                            try:
                                with docx.open(img_zip_path) as src_img:
                                    with open(dest_path, "wb") as dest_img:
                                        shutil.copyfileobj(src_img, dest_img)
                                copied_images.add(dest_name)
                            except Exception as img_err:
                                print(f"Lỗi sao chép ảnh {img_zip_path}: {img_err}")
                                
                        images_markdown.append(f"\n\n![hình ảnh](/api/uploads/{dest_name})\n\n")
                
                full_content = para_text
                if images_markdown:
                    full_content += "".join(images_markdown)
                return full_content

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
                    text = get_para_content(child)
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
                            cell_text = " ".join(get_para_content(p) for p in cell_paras).strip()
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
