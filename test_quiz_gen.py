import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Video

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Video.id, Video.title).where(Video.status.in_(['done', 'completed'])).limit(3))
        for r in res:
            print(f"{r.id} | {r.title}")

asyncio.run(main())
