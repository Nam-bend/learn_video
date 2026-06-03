import asyncio
import json
import httpx

async def main():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api") as client:
        # Get latest quiz
        res1 = await client.get("/quiz/604c28c8-ebe7-4637-83eb-8781b94a39c8")
        quiz = res1.json()
        quiz_id = quiz['id']
        questions = quiz['questions']
        
        print(f"Latest quiz_id: {quiz_id}")
        
        # Submit attempt (4 correct, 6 wrong to get 40%)
        answers = []
        for i, q in enumerate(questions):
            if i < 4:
                answers.append(q['answer'])
            else:
                answers.append((q['answer'] + 1) % 4) # wrong answer
                
        res2 = await client.post(f"/quiz/submit/604c28c8-ebe7-4637-83eb-8781b94a39c8", json={"quiz_id": quiz_id, "answers": answers})
        print(f"Submit attempt: {res2.status_code}")
        
        # Generate new quiz (should be remedial)
        print("Generating new quiz...")
        res3 = await client.post(f"/quiz/generate/604c28c8-ebe7-4637-83eb-8781b94a39c8")
        new_quiz = res3.json()
        print(json.dumps(new_quiz['quiz_meta'], indent=2, ensure_ascii=False))

asyncio.run(main())
