from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Video, Quiz, QuizAttempt
from app.config import settings
from app.utils.ai import get_embeddings_batch
from openai import AsyncOpenAI
import uuid
import json
import math
import re
import numpy as np

router = APIRouter()

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

# ───────────────────────────────────────────────
#  Hằng số cấu hình hệ thống Quiz
# ───────────────────────────────────────────────
QUIZ_QUESTION_COUNT = 10          # Số câu hỏi mỗi bộ quiz
MIN_ACCEPTABLE_QUESTIONS = 7      # Nếu dedup loại quá nhiều, fallback về bộ gốc
HISTORY_DECAY_HALF_LIFE = 3       # Sau N lượt thi, trọng số giảm còn 50%
SEMANTIC_DEDUP_THRESHOLD = 0.88   # Cosine similarity >= threshold => coi là câu trùng/paraphrase
CONSOLIDATION_LOW = 0.60          # Dưới ngưỡng này => chế độ Remedial (tập trung lỗi)
CONSOLIDATION_HIGH = 0.85         # Trên ngưỡng này => chế độ Challenge (mở rộng, khó hơn)
MAX_TRANSCRIPT_TOKENS = 4000      # Số ký tự tối đa của tài liệu gửi vào prompt


# ───────────────────────────────────────────────
#  Hàm tính trọng số lịch sử theo exponential decay
# ───────────────────────────────────────────────
def compute_weighted_wrongs(attempts: list, max_wrongs: int = 15) -> tuple[list[str], float]:
    """
    Tính danh sách câu sai có trọng số theo exponential decay.
    Lượt gần nhất có weight = 1.0, cũ hơn theo hàm 0.5^(n/half_life).

    Trả về:
        - weighted_wrongs: danh sách câu sai được ưu tiên theo trọng số
        - avg_score_rate: tỷ lệ đúng trung bình có trọng số (0.0 - 1.0)
    """
    if not attempts:
        return [], 0.0

    total_weight = 0.0
    weighted_score_sum = 0.0
    wrong_counter: dict[str, float] = {}

    for i, attempt in enumerate(attempts):
        # Lượt 0 (gần nhất) có weight cao nhất
        weight = math.pow(0.5, i / HISTORY_DECAY_HALF_LIFE)
        total_weight += weight

        score_rate = attempt.score / attempt.total if attempt.total > 0 else 0.0
        weighted_score_sum += score_rate * weight

        if attempt.wrong_answers:
            for w in attempt.wrong_answers:
                q = w.get("question", "").strip()
                if q:
                    wrong_counter[q] = wrong_counter.get(q, 0.0) + weight

    # Sắp xếp câu sai theo trọng số giảm dần (sai nhiều + gần đây => ưu tiên cao)
    sorted_wrongs = sorted(wrong_counter.items(), key=lambda x: x[1], reverse=True)
    weighted_wrongs = [q for q, _ in sorted_wrongs[:max_wrongs]]
    avg_score_rate = weighted_score_sum / total_weight if total_weight > 0 else 0.0

    return weighted_wrongs, avg_score_rate


# ───────────────────────────────────────────────
#  Hàm phân loại chế độ Quiz theo vùng học tập
# ───────────────────────────────────────────────
def determine_quiz_mode(avg_score_rate: float, has_history: bool) -> str:
    """
    Phân loại 4 chế độ:
      - 'first_time'    : Chưa có lịch sử
      - 'remedial'      : avg_score < 60% → tập trung sửa lỗi
      - 'consolidation' : 60% ≤ avg_score ≤ 85% → củng cố + mở rộng nhẹ
      - 'challenge'     : avg_score > 85% → mở rộng hoàn toàn + tăng độ khó
    """
    if not has_history:
        return "first_time"
    if avg_score_rate < CONSOLIDATION_LOW:
        return "remedial"
    if avg_score_rate <= CONSOLIDATION_HIGH:
        return "consolidation"
    return "challenge"


# ───────────────────────────────────────────────
#  Hàm extract JSON an toàn bằng regex
# ───────────────────────────────────────────────
def extract_json_array(content: str) -> str:
    """
    Trích xuất JSON array từ LLM response một cách an toàn.
    
    Thứ tự ưu tiên:
    1. Của sổ ```json...``` hoặc ```...```
    2. Regex tìm [...] lớn nhất (bắt đầu từ '[' đầu tiên, kết thúc tại ']' cuối cùng)
    3. Fallback: return nguyên content (sẽ lỗi ở json.loads)
    """
    # Strip fenced code blocks (đặt cả newline trước/sau fence)
    fence_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()
    
    # Regex tìm array bắt đầu từ '[' đầu tiên đến ']' cuối cùng
    # (bắt được cả trường hợp LLM thêm text trước/sau JSON)
    array_match = re.search(r'\[.*\]', content, re.DOTALL)
    if array_match:
        return array_match.group(0)
    
    return content  # Để json.loads raise lỗi rõ ràng


# ───────────────────────────────────────────────
#  Hàm semantic dedup: loại bỏ câu hỏi quá tương đồng
# ───────────────────────────────────────────────
async def semantic_dedup(
    new_questions: list[dict],
    prev_questions: list[str]
) -> tuple[list[dict], bool]:
    """
    Loại câu hỏi paraphrase bằng BATCH embedding (2 calls tổng cộng thay vì N calls).
    
    Trả về:
        - unique_questions: danh sách câu hỏi sau khi lọc
        - dedup_ok: True nếu số câu còn lại >= MIN_ACCEPTABLE_QUESTIONS
    """
    if not prev_questions or not new_questions:
        return new_questions, True

    try:
        # --- BATCH 1: embed toàn bộ câu hỏi cũ trong 1 call ---
        prev_vecs = await get_embeddings_batch(prev_questions)
        prev_matrix = np.array(prev_vecs)           # (N_prev, dim)
        prev_norms = np.linalg.norm(prev_matrix, axis=1) + 1e-9

        # --- BATCH 2: embed toàn bộ câu hỏi mới trong 1 call ---
        new_texts = [q.get("question", "") for q in new_questions]
        new_vecs = await get_embeddings_batch(new_texts)
        new_matrix = np.array(new_vecs)             # (N_new, dim)
        new_norms = np.linalg.norm(new_matrix, axis=1) + 1e-9

        # --- So sánh: sim_matrix[i, j] = cosine(new_i, prev_j) ---
        sim_matrix = (new_matrix @ prev_matrix.T) / np.outer(new_norms, prev_norms)
        max_sims = sim_matrix.max(axis=1)           # max similarity của mỗi câu mới với bất kỳ câu cũ

        unique_questions = []
        for q_obj, max_sim in zip(new_questions, max_sims):
            if max_sim < SEMANTIC_DEDUP_THRESHOLD:
                unique_questions.append(q_obj)
            else:
                q_text = q_obj.get('question', '')[:60]
                print(f"[SemanticDedup] Loại paraphrase (sim={max_sim:.2f}): {q_text}...")

        dedup_ok = len(unique_questions) >= MIN_ACCEPTABLE_QUESTIONS
        return unique_questions, dedup_ok

    except Exception as e:
        print(f"⚠️ Semantic dedup lỗi, bỏ qua: {e}")
        return new_questions, True


# ───────────────────────────────────────────────
#  Endpoint: Tạo Quiz thích ứng
# ───────────────────────────────────────────────
@router.post("/quiz/generate/{video_id}")
async def generate_quiz(video_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Lấy video/tài liệu và transcript
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(404, "Không tìm thấy tài liệu")

    if video.status not in ("done", "completed"):
        raise HTTPException(400, f"Tài liệu chưa sẵn sàng (status: {video.status})")

    # Lấy transcript text, xử lý các kiểu dữ liệu khác nhau
    raw_transcript = video.transcript or []
    if isinstance(raw_transcript, list):
        transcript_text = " ".join(
            item["text"] if isinstance(item, dict) else str(item)
            for item in raw_transcript
            if item
        ).strip()
    elif isinstance(raw_transcript, str):
        transcript_text = raw_transcript.strip()
    else:
        transcript_text = ""

    if not transcript_text:
        raise HTTPException(400, "Tài liệu chưa có nội dung. Vui lòng trích xuất văn bản trước.")

    # 2. Lấy TOÀN BỘ lịch sử làm bài (không cắt cứng) để tính weighted score
    attempts_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.video_id == video.id)
        .order_by(desc(QuizAttempt.created_at))
        .limit(20)  # Giới hạn hợp lý về chi phí DB
    )
    all_attempts = attempts_result.scalars().all()

    # Tính trọng số lịch sử
    weighted_wrongs, avg_score_rate = compute_weighted_wrongs(all_attempts, max_wrongs=15)

    # Xác định chế độ quiz
    quiz_mode = determine_quiz_mode(avg_score_rate, has_history=len(all_attempts) > 0)
    print(f"[QuizMode] mode={quiz_mode}, avg_score={avg_score_rate:.2%}, total_attempts={len(all_attempts)}")

    # 3. Thu thập câu hỏi cũ để semantic dedup (lượt gần nhất)
    prev_questions: list[str] = []
    if all_attempts and all_attempts[0].quiz_id:
        result_q = await db.execute(select(Quiz).where(Quiz.id == all_attempts[0].quiz_id))
        latest_quiz = result_q.scalar_one_or_none()
        if latest_quiz and latest_quiz.questions:
            prev_questions = [q.get("question", "") for q in latest_quiz.questions]

    # 4. Xây dựng prompt theo chế độ
    mode_instructions = {
        "first_time": (
            "Đây là lần đầu tiên người dùng làm bài với tài liệu này. "
            "Hãy tạo các câu hỏi bao phủ đồng đều các chủ đề chính của tài liệu, "
            "từ cơ bản đến trung bình, để đánh giá toàn diện kiến thức ban đầu."
        ),
        "remedial": (
            f"Người dùng đang gặp khó khăn (điểm trung bình: {avg_score_rate:.0%}). "
            f"Các chủ đề cần tập trung luyện tập (ưu tiên theo mức độ sai): {', '.join(weighted_wrongs[:8])}. "
            "Hãy tạo câu hỏi MỚI HOÀN TOÀN về các chủ đề trên, không lặp lại từ ngữ cũ, "
            "nhưng vẫn bao gồm 2-3 câu về các phần khác để tránh học tủ."
        ),
        "consolidation": (
            f"Người dùng đạt mức trung bình ({avg_score_rate:.0%}). "
            "Dây là giai đoạn CỦNG CỐ & TIẾN TRIỂN: "
            + (
                # Có câu sai: mix củng cố điểm yếu + mở rộng
                f"- 5 câu đào sâu vào vùng còn yếu: {', '.join(weighted_wrongs[:5])}. "
                "- 5 câu mở rộng sang khía cạnh khác, độ khó trung bình-cao."
                if weighted_wrongs else
                # Không có câu sai nhưng điểm 60-85%: điều này nghĩa là học viên làm tốt
                # nhưng chưa chắc chắn — cần challenge nhẹ chứ không cần remedial
                "Không có câu sai rõ ràng, nhưng vấn đỏ điểm chưa cao. "
                "Hãy tạo 10 câu hỏi hoàn toàn mới: khai thác chi tiết kỹ thuật, "
                "so sánh khái niệm, tình huống ứng dụng. Độ khó trung bình-cao, "
                "tránh câu định nghĩa đơn giản. Hành xử gần giống challenge mode."
            )
        ),
        "challenge": (
            f"Người dùng đạt điểm cao ({avg_score_rate:.0%}). "
            "Hãy tạo câu hỏi MỚI HOÀN TOÀN với độ khó CAO: "
            "khai thác các chi tiết kỹ thuật, nguyên nhân-kết quả, so sánh khái niệm, "
            "suy luận từ thông tin trong tài liệu. Tránh các câu hỏi định nghĩa đơn giản."
        )
    }

    avoid_context = ""
    if prev_questions:
        avoid_context = (
            f"\n\nDUYỆT BỎ CỨNG: Các câu hỏi sau đây ĐÃ được hỏi ở lượt trước. "
            f"KHÔNG được hỏi lại hoặc diễn đạt tương tự về cùng ý tứ: {'; '.join(prev_questions)}."
        )

    prompt = f"""Bạn là chuyên gia giáo dục. Hãy tạo {QUIZ_QUESTION_COUNT} câu hỏi trắc nghiệm dựa trên tài liệu.

Nội dung tài liệu:
{transcript_text[:MAX_TRANSCRIPT_TOKENS]}
{avoid_context}

CHIẾN LƯỢC TẠO CÂU HỎI ({quiz_mode.upper()}):
{mode_instructions[quiz_mode]}

QUY TẮC BẮT BUỘC:
1. Mỗi câu hỏi phải có 4 lựa chọn (A/B/C/D), 1 đáp án đúng, 1 giải thích ngắn gọn.
2. Các lựa chọn sai phải hợp lý, không quá dễ loại trừ (tránh "bẫy vô lý").
3. Câu hỏi phải bám sát nội dung tài liệu, không tự sáng tạo kiến thức ngoài.
4. Phân bố đều câu hỏi, không lặp đi lặp lại cùng một đoạn tài liệu.

Trả về DUY NHẤT JSON (mảng, không bọc ```):
[
  {{
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "answer": 0,
    "explanation": "Giải thích tại sao A đúng..."
  }}
]
(answer là chỉ số 0–3 của đáp án đúng trong mảng options)"""

    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )

        content = ""
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                content += chunk.choices[0].delta.content

        content = content.strip()
        if not content:
            raise Exception("AI không trả về nội dung (Proxy error)")

        # Regex extraction: an toàn hơn string split thông thường
        content = extract_json_array(content)

        quiz_data = json.loads(content)
        if isinstance(quiz_data, dict) and "questions" in quiz_data:
            quiz_data = quiz_data["questions"]

        # 5. Semantic dedup: lọc bỏ câu hỏi paraphrase từ lượt trước
        dedup_applied = False
        if prev_questions:
            original_quiz_data = quiz_data.copy()
            deduped, dedup_ok = await semantic_dedup(quiz_data, prev_questions)
            print(f"[SemanticDedup] {len(deduped)}/{len(quiz_data)} câu sau khi lọc (ok={dedup_ok})")

            if dedup_ok:
                quiz_data = deduped
                dedup_applied = True
            else:
                # Dedup loại quá nhiều câu (íd bị phá quiz) — giữ nguyên bộ gốc
                print(f"[SemanticDedup] Fallback về bộ gốc ({len(original_quiz_data)} câu) vì sau dedup chỉ còn {len(deduped)} câu")
                quiz_data = original_quiz_data

        # 6. Lưu vào DB
        new_quiz = Quiz(video_id=video.id, questions=quiz_data)
        db.add(new_quiz)
        await db.commit()
        await db.refresh(new_quiz)

        return {
            "id": str(new_quiz.id),
            "questions": quiz_data,
            # Metadata giúp frontend hiển thị context cho người dùng
            "quiz_meta": {
                "mode": quiz_mode,
                "avg_score_rate": round(avg_score_rate, 2),
                "total_attempts": len(all_attempts),
                "question_count": len(quiz_data),
                "dedup_applied": dedup_applied,
                "mode_label": {
                    "first_time": "📘 Khảo sát lần đầu",
                    "remedial": f"🔧 Tập trung sửa lỗi ({avg_score_rate:.0%})",
                    "consolidation": f"⚖️ Củng cố & Mở rộng ({avg_score_rate:.0%})",
                    "challenge": f"🚀 Nâng cao thử thách ({avg_score_rate:.0%})"
                }.get(quiz_mode, quiz_mode)
            }
        }

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
        if user_ans == q["answer"]:
            score += 1
        else:
            wrong_answers.append({
                "question": q["question"],
                "user_answer": user_ans,
                "correct_answer": q["answer"],
                "explanation": q.get("explanation", "")
            })

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
        "wrong_answers": wrong_answers,
        "score_rate": round(score / len(questions), 2) if questions else 0
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
            "score_rate": round(a.score / a.total, 2) if a.total else 0,
            "wrong_answers": a.wrong_answers,
            "created_at": a.created_at.isoformat()
        }
        for a in attempts
    ]


@router.get("/quiz/analysis/{video_id}")
async def get_quiz_analysis(video_id: str, db: AsyncSession = Depends(get_db)):
    """Phân tích lỗ hổng kiến thức với decay factor — lỗi gần đây được tính nặng hơn."""
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.video_id == uuid.UUID(video_id))
        .order_by(desc(QuizAttempt.created_at))
        .limit(20)
    )
    attempts = result.scalars().all()

    if not attempts:
        return {"analysis": "Chưa có dữ liệu luyện tập để phân tích."}

    weighted_wrongs, avg_score_rate = compute_weighted_wrongs(attempts)

    if not weighted_wrongs:
        return {
            "stats": {
                "avg_score_rate": round(avg_score_rate, 2),
                "total_attempts": len(attempts)
            },
            "analysis": "Tuyệt vời! Bạn đang làm đúng hết các câu hỏi gần đây. Hãy tiếp tục duy trì phong độ!"
        }

    prompt = f"""Hãy đóng vai một chuyên gia giáo dục. Dưới đây là danh sách các câu hỏi mà học sinh trả lời SAI,
được xếp hạng từ sai nhiều/gần đây nhất đến ít hơn (đã áp dụng trọng số thời gian).

Danh sách câu sai (ưu tiên cao → thấp): {weighted_wrongs[:15]}
Điểm trung bình có trọng số: {avg_score_rate:.0%}

Hãy phân tích:
1. Xác định 3 lỗ hổng kiến thức lớn nhất đang ảnh hưởng đến điểm số.
2. Giải thích tại sao học sinh hay nhầm ở những điểm đó.
3. Đưa ra 3 lời khuyên cụ thể và có thể thực hiện ngay để cải thiện.

Trả về kết quả bằng tiếng Việt, súc tích, định dạng Markdown."""

    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )

        analysis = ""
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                analysis += chunk.choices[0].delta.content

        if not analysis:
            raise Exception("AI không trả về nội dung")

        return {
            "stats": {
                "avg_score_rate": round(avg_score_rate, 2),
                "total_attempts": len(attempts),
                "quiz_mode": determine_quiz_mode(avg_score_rate, has_history=True)
            },
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(500, str(e))
