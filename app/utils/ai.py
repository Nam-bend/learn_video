import httpx
from app.config import settings

async def get_embedding(text: str):
    """Chuyển đổi văn bản thành vector bằng Gemini model gemini-embedding-2"""
    text = text.replace("\n", " ")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={settings.GEMINI_API_KEY}"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json={"content": {"parts": [{"text": text}]}}
        )
        if response.status_code != 200:
            raise Exception(f"Gemini Embedding Error: {response.text}")
        
        result = response.json()
        return result["embedding"]["values"]
