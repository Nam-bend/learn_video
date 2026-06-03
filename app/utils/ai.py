import asyncio
from fastembed import TextEmbedding

# Tải model vào RAM 1 lần duy nhất để tối ưu tốc độ
# Model: BAAI/bge-small-en-v1.5 (Rất nhẹ và tốt cho tiếng Anh/Việt)
embedding_model = TextEmbedding()

async def get_embedding(text: str) -> list[float]:
    """Chuyển đổi văn bản thành vector bằng mô hình Offline (FastEmbed)"""
    text = text.replace("\n", " ")
    
    def _embed():
        # embed() trả về một generator, ta lấy phần tử đầu tiên và chuyển thành list
        return next(embedding_model.embed([text])).tolist()
        
    # Chạy hàm đồng bộ trong thread riêng để không block event loop của FastAPI
    return await asyncio.to_thread(_embed)


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Embed nhiều văn bản trong một lần gọi duy nhất (batch).
    
    FastEmbed hỗ trợ batch natively, giảm từ N sequential calls xuống còn 1 call.
    Latency: ~100-200ms bất kể batch size (trong giới hạn RAM).
    """
    if not texts:
        return []
    
    cleaned = [t.replace("\n", " ") for t in texts]
    
    def _embed_batch():
        return [vec.tolist() for vec in embedding_model.embed(cleaned)]
    
    return await asyncio.to_thread(_embed_batch)

async def convert_text_to_markdown(text: str, model_name: str = "gpt-4o-mini") -> str:
    """Sử dụng LLM để chuyển đổi văn bản thô trích xuất từ tài liệu sang định dạng Markdown chuẩn."""
    from openai import AsyncOpenAI
    from app.config import settings

    if not text.strip():
        return ""

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    prompt = f"""Bạn là một chuyên gia xử lý tài liệu.
Nhiệm vụ của bạn là chuyển đổi đoạn văn bản thô trích xuất từ tài liệu sau đây sang định dạng Markdown (MD) chuẩn, sạch sẽ.
Yêu cầu:
1. Giữ nguyên 100% nội dung chữ, từ ngữ, số liệu và thứ tự thông tin gốc, không được tự ý lược bỏ hoặc viết lại.
2. Thêm định dạng Markdown phù hợp: tiêu đề (#, ##, ...), danh sách liệt kê (- hoặc 1. 2.), văn bản in đậm, in nghiêng hoặc bảng biểu nếu văn bản gốc có cấu trúc như vậy.
3. Không thêm lời giới thiệu, giải thích hay kết luận nào. Chỉ trả về duy nhất nội dung tài liệu đã được định dạng Markdown.

Nội dung thô cần chuyển đổi:
{text}
"""
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"🔥 Error converting to Markdown: {e}")
        return text  # Fallback

async def translate_transcript_list(transcript_list: list[dict], model_name: str = "gpt-4o-mini") -> list[dict]:
    """Dịch danh sách transcript sang tiếng Việt bằng LLM theo từng lô"""
    from openai import AsyncOpenAI
    from app.config import settings
    import json
    import re
    
    # 1. Nhận diện ngôn ngữ tự động (Nếu bản dịch gốc đã là tiếng Việt thì bỏ qua không dịch)
    if transcript_list:
        # Quét tối đa 50 câu đầu tiên
        sample_text = " ".join(item["text"] for item in transcript_list[:50])
        # Regex kiểm tra ký tự tiếng Việt có dấu
        vietnamese_accents = re.compile(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]')
        words = sample_text.split()
        vi_words_count = sum(1 for w in words if vietnamese_accents.search(w.lower()))
        
        # Nếu tỷ lệ từ có dấu tiếng Việt > 10% thì coi như video gốc đã là tiếng Việt
        if len(words) > 0 and (vi_words_count / len(words)) > 0.10:
            print("ℹ️ Bản ghi gốc phát hiện là tiếng Việt. Bỏ qua bước dịch để tiết kiệm token.")
            return [
                {
                    "start": item["start"],
                    "end": item.get("end", item["start"]),
                    "text": item["text"]
                }
                for item in transcript_list
            ]

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    translated_list = []
    
    # Tăng kích thước lô lên 100 để giảm một nửa số lượng API calls
    batch_size = 100
    for i in range(0, len(transcript_list), batch_size):
        batch = transcript_list[i : i + batch_size]
        batch_text_only = [{"index": idx, "text": item["text"]} for idx, item in enumerate(batch)]
        
        prompt = f"""Bạn là một chuyên gia dịch thuật tài liệu/phụ đề.
Nhiệm vụ của bạn là dịch danh sách văn bản sau đây sang tiếng Việt chuẩn, tự nhiên và dễ hiểu.
Hãy giữ nguyên định dạng JSON đầu ra là một mảng chứa các object có dạng:
[
  {{"index": số_chỉ_mục, "text": "văn bản đã dịch sang tiếng Việt"}}
]
Lưu ý quan trọng: Trả về DUY NHẤT chuỗi JSON hợp lệ, không thêm bất kỳ dòng text giải thích nào khác.

Danh sách văn bản cần dịch:
{json.dumps(batch_text_only, ensure_ascii=False)}
"""
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            llm_output = response.choices[0].message.content.strip()
            
            if "```json" in llm_output:
                llm_output = llm_output.split("```json")[1].split("```")[0].strip()
            elif "```" in llm_output:
                llm_output = llm_output.split("```")[1].split("```")[0].strip()
                
            translated_batch = json.loads(llm_output)
            
            translated_map = {
                item["index"]: item["text"] 
                for item in translated_batch 
                if isinstance(item, dict) and "index" in item and "text" in item
            }
            
            for idx, original_item in enumerate(batch):
                translated_text = translated_map.get(idx, original_item["text"])
                translated_list.append({
                    "start": original_item["start"],
                    "end": original_item.get("end", original_item["start"]),
                    "text": translated_text
                })
        except Exception as e:
            print(f"🔥 Error translating batch: {e}")
            # Nếu lỗi, fallback giữ nguyên text gốc
            for original_item in batch:
                translated_list.append({
                    "start": original_item["start"],
                    "end": original_item.get("end", original_item["start"]),
                    "text": original_item["text"]
                })
                
    return translated_list
