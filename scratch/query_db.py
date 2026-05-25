import asyncio
import json
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Video

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Video).where(Video.id == "34a8050d-85e8-48d8-b9d1-1ef41a772080"))
        v = result.scalar_one_or_none()
        if v:
            title_ascii = v.title.encode("ascii", "replace").decode("ascii")
            print("Found video/doc:", title_ascii)
            with open("scratch/docx_transcript.json", "w", encoding="utf-8") as f:
                json.dump(v.transcript, f, ensure_ascii=False, indent=2)
            print("Wrote transcript to scratch/docx_transcript.json")
        else:
            print("Not found")

if __name__ == "__main__":
    asyncio.run(main())
