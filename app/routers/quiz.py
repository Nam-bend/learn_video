from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Video, Quiz, QuizAttempt
from app.config import settings
from openai import AsyncOpenAI
import uuid
import json

router = APIRouter()

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

@router.post("/quiz/generate/{video_id}")
async def generate_quiz(video_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Lấy video và transcript
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    
    if not video or video.status != "done":
        raise HTTPException(400, "Video chưa sẵn sàng hoặc không tồn tại")

    transcript_text = " ".join(s["text"] for s in (video.transcript or []))

    # 2. Kiểm tra lịch sử câu sai
    attempts_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.video_id == video.id)
        .order_by(desc(QuizAttempt.created_at))
        .limit(3)
    )
    prev_attempts = attempts_result.scalars().all()
    
    wrong_context = ""
    if prev_attempts:
        wrongs = []
        for att in prev_attempts:
            if att.wrong_answers:
                wrongs.extend([w.get('question', '') for w in att.wrong_answers])
        
        if wrongs:
            wrong_context = f"\n\nLưu ý: Người dùng đã làm sai các câu hỏi liên quan đến nội dung sau: {', '.join(wrongs[:5])}. Hãy tạo câu hỏi giúp họ hiểu rõ hơn các phần này."

    # 3. Gọi AI tạo Quiz
    prompt = f"""
Dựa trên nội dung video sau đây, hãy tạo 5 câu hỏi trắc nghiệm để kiểm tra kiến thức của người dùng.
Mỗi câu hỏi phải có 4 lựa chọn, 1 đáp án đúng và 1 câu giải thích ngắn gọn.

Nội dung video: {transcript_text}
{wrong_context}

Yêu cầu trả về DUY NHẤT định dạng JSON là một danh sách các object như sau:
[
  {{
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "answer": 0,
    "explanation": "Giải thích tại sao A đúng..."
  }}
]
(Trong đó answer là chỉ số 0-3 của đáp án đúng trong mảng options)
"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" } if "gpt-4" in settings.OPENAI_API_KEY else None 
        )
        
        content = response.choices[0].message.content
        # Xử lý trường hợp AI wrap trong ```json
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        quiz_data = json.loads(content)
        if isinstance(quiz_data, dict) and "questions" in quiz_data:
            quiz_data = quiz_data["questions"]

        # 4. Lưu vào DB
        new_quiz = Quiz(video_id=video.id, questions=quiz_data)
        db.add(new_quiz)
        await db.commit()
        await db.refresh(new_quiz)

        return {"id": str(new_quiz.id), "questions": quiz_data}

    except Exception as e:
        print(f"🔥 Quiz Generation Error: {e}")
        raise HTTPException(500, f"Lỗi tạo Quiz: {str(e)}")

@router.get("/quiz/{video_id}")
async def get_latest_quiz(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.video_id == uuid.UUID(video_id))
        .order_by(desc(Quiz.created_at))
    )
    quiz = result.scalars().first()
    if not quiz:
        return {"questions": []}
    return {"id": str(quiz.id), "questions": quiz.questions}

@router.get("/quiz/instance/{quiz_id}")
async def get_quiz_by_id(quiz_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == uuid.UUID(quiz_id)))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Không tìm thấy bộ câu hỏi")
    return {"id": str(quiz.id), "questions": quiz.questions}

@router.post("/quiz/submit/{video_id}")
async def submit_quiz(video_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    quiz_id = payload.get("quiz_id")
    user_answers = payload.get("answers", [])
    
    if not quiz_id:
        raise HTTPException(400, "Thiếu ID của bộ câu hỏi (quiz_id)")

    try:
        quiz_uuid = uuid.UUID(quiz_id)
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_uuid))
        quiz = result.scalar_one_or_none()
    except ValueError:
        raise HTTPException(400, "ID bộ câu hỏi không hợp lệ")
    
    if not quiz:
        raise HTTPException(404, "Không tìm thấy bộ câu hỏi")

    questions = quiz.questions
    score = 0
    wrong_answers = []

    for i, q in enumerate(questions):
        user_ans = user_answers[i] if i < len(user_answers) else None
        if user_ans == q['answer']:
            score += 1
        else:
            wrong_answers.append({
                "question": q['question'],
                "user_answer": user_ans,
                "correct_answer": q['answer'],
                "explanation": q.get('explanation', '')
            })

    # Lưu kết quả làm bài
    attempt = QuizAttempt(
        video_id=uuid.UUID(video_id),
        quiz_id=uuid.UUID(quiz_id),
        score=score,
        total=len(questions),
        wrong_answers=wrong_answers
    )
    db.add(attempt)
    await db.commit()

    return {
        "score": score,
        "total": len(questions),
        "wrong_answers": wrong_answers
    }

@router.get("/quiz/history/{video_id}")
async def get_quiz_history(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.video_id == uuid.UUID(video_id))
        .order_by(desc(QuizAttempt.created_at))
    )
    attempts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "quiz_id": str(a.quiz_id) if a.quiz_id else None,
            "score": a.score,
            "total": a.total,
            "wrong_answers": a.wrong_answers,
            "created_at": a.created_at.isoformat()
        }
        for a in attempts
    ]

@router.get("/quiz/analysis/{video_id}")
async def get_quiz_analysis(video_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Lấy tất cả các lần làm bài sai
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.video_id == uuid.UUID(video_id))
        .order_by(desc(QuizAttempt.created_at))
        .limit(10)
    )
    attempts = result.scalars().all()
    
    if not attempts:
        return {"analysis": "Chưa có dữ liệu luyện tập để phân tích."}

    all_wrongs = []
    total_score = 0
    total_q = 0
    for a in attempts:
        total_score += a.score
        total_q += a.total
        if a.wrong_answers:
            all_wrongs.extend([w.get('question', '') for w in a.wrong_answers])

    if not all_wrongs:
        return {
            "stats": {"avg_score": total_score/len(attempts) if attempts else 0},
            "analysis": "Tuyệt vời! Bạn làm đúng hết các câu hỏi gần đây. Hãy tiếp tục duy trì phong độ!"
        }

    # 2. Nhờ AI phân tích
    prompt = f"""
Hãy đóng vai một chuyên gia giáo dục. Dưới đây là danh sách các câu hỏi mà học sinh đã trả lời SAI sau khi xem video.
Câu hỏi sai: {all_wrongs[:15]}

Hãy phân tích:
1. Học sinh đang gặp khó khăn ở mảng kiến thức nào?
2. Đưa ra 3 lời khuyên ngắn gọn để cải thiện kiến thức này.
3. Dự đoán điểm yếu của họ.

Trả về kết quả bằng tiếng Việt, súc tích, định dạng Markdown.
"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        analysis = response.choices[0].message.content
        return {
            "stats": {
                "avg_score": round(total_score / total_q * 10, 1) if total_q > 0 else 0,
                "total_attempts": len(attempts)
            },
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(500, str(e))
