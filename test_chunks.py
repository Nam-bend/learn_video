import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import VideoChunk

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(VideoChunk.id).where(VideoChunk.video_id == '604c28c8-ebe7-4637-83eb-8781b94a39c8'))
        chunks = res.scalars().all()
        print(f"Total chunks for docx: {len(chunks)}")

asyncio.run(main())
