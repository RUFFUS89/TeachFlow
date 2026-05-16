"""Endpoints de atividades (assignments), quiz e submissões."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func as sa_func
from sqlalchemy import select

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import NotFoundError
from app.core.permissions import require_branch_member, require_branch_staff
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.quiz import AssignmentCriterion, QuizOption, QuizQuestion
from app.models.submission import QuizResponse, Submission, SubmissionStatus
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentCriterionRead,
    AssignmentPlayResponse,
    AssignmentRead,
    AssignmentUpdate,
    QuizOptionCreate,
    QuizOptionRead,
    QuizOptionStudentRead,
    QuizOptionUpdate,
    QuizQuestionCreate,
    QuizQuestionRead,
    QuizQuestionStudentRead,
    QuizQuestionUpdate,
    SubmissionRead,
    SubmitAnswersPayload,
)

router = APIRouter(tags=["assignments"])


# =============================================================================
# Helpers
# =============================================================================


async def _branch_id_for_course(course_id: UUID, db: DbSession) -> UUID:
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    return course.branch_id  # type: ignore[return-value]


async def _get_assignment_and_branch(assignment_id: UUID, db: DbSession) -> tuple[Assignment, UUID]:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Atividade")
    branch_id = await _branch_id_for_course(assignment.course_id, db)
    return assignment, branch_id


async def _questions_with_options(
    assignment_id: UUID, db: DbSession, *, student_view: bool = False
) -> list[QuizQuestionRead] | list[QuizQuestionStudentRead]:
    q_result = await db.execute(
        select(QuizQuestion)
        .where(QuizQuestion.assignment_id == assignment_id)
        .order_by(QuizQuestion.position)
    )
    questions = q_result.scalars().all()

    result = []
    for q in questions:
        o_result = await db.execute(
            select(QuizOption).where(QuizOption.question_id == q.id).order_by(QuizOption.position)
        )
        options_raw = o_result.scalars().all()

        if student_view:
            options = [
                QuizOptionStudentRead(
                    id=o.id,
                    question_id=o.question_id,
                    content=o.content,
                    position=o.position,
                )
                for o in options_raw
            ]
            result.append(
                QuizQuestionStudentRead(
                    id=q.id,
                    prompt=q.prompt,
                    hint=q.hint,
                    type=q.type,
                    points=q.points,
                    position=q.position,
                    options=options,
                )
            )
        else:
            options = [
                QuizOptionRead(
                    id=o.id,
                    question_id=o.question_id,
                    content=o.content,
                    is_correct=o.is_correct,
                    position=o.position,
                )
                for o in options_raw
            ]
            result.append(
                QuizQuestionRead(
                    id=q.id,
                    assignment_id=q.assignment_id,
                    prompt=q.prompt,
                    hint=q.hint,
                    type=q.type,
                    points=q.points,
                    position=q.position,
                    options=options,
                    created_at=q.created_at,
                    updated_at=q.updated_at,
                )
            )
    return result  # type: ignore[return-value]


# =============================================================================
# Assignment CRUD
# =============================================================================


@router.post("/assignments", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> Assignment:
    """Cria atividade. Requer owner|admin da filial."""
    branch_id = await _branch_id_for_course(payload.course_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    assignment = Assignment(
        course_id=payload.course_id,
        author_id=profile.id,
        title=payload.title,
        instructions=payload.instructions,
        type=payload.type,
        max_score=payload.max_score,
        weight=payload.weight,
        due_date=payload.due_date,
        available_from=payload.available_from,
        allow_late_submission=payload.allow_late_submission,
        max_attempts=payload.max_attempts,
        time_limit_minutes=payload.time_limit_minutes,
        shuffle_questions=payload.shuffle_questions,
        feedback_mode=payload.feedback_mode,
        pass_threshold_percent=payload.pass_threshold_percent,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.get("/assignments/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> Assignment:
    assignment, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_member(db, profile.id, branch_id)
    return assignment


@router.patch("/assignments/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> Assignment:
    assignment, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    assignment, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)
    await db.delete(assignment)
    await db.commit()


# =============================================================================
# Questions (staff)
# =============================================================================


@router.get(
    "/assignments/{assignment_id}/questions",
    response_model=list[QuizQuestionRead],
)
async def list_questions(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[QuizQuestionRead]:
    """Lista questões com is_correct. Requer owner|admin."""
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)
    return await _questions_with_options(assignment_id, db, student_view=False)  # type: ignore[return-value]


@router.post(
    "/assignments/{assignment_id}/questions",
    response_model=QuizQuestionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_question(
    assignment_id: UUID,
    payload: QuizQuestionCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> QuizQuestionRead:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    if payload.position is None:
        max_pos = await db.execute(
            select(sa_func.coalesce(sa_func.max(QuizQuestion.position), 0)).where(
                QuizQuestion.assignment_id == assignment_id
            )
        )
        position = (max_pos.scalar_one() or 0) + 1
    else:
        position = payload.position

    question = QuizQuestion(
        assignment_id=assignment_id,
        prompt=payload.prompt,
        hint=payload.hint,
        type=payload.type,
        points=payload.points,
        position=position,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return QuizQuestionRead(
        id=question.id,
        assignment_id=question.assignment_id,
        prompt=question.prompt,
        hint=question.hint,
        type=question.type,
        points=question.points,
        position=question.position,
        options=[],
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.patch(
    "/assignments/{assignment_id}/questions/{question_id}",
    response_model=QuizQuestionRead,
)
async def update_question(
    assignment_id: UUID,
    question_id: UUID,
    payload: QuizQuestionUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> QuizQuestionRead:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    question = await db.get(QuizQuestion, question_id)
    if question is None or question.assignment_id != assignment_id:
        raise NotFoundError("Questão")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    await db.commit()
    await db.refresh(question)

    o_result = await db.execute(
        select(QuizOption)
        .where(QuizOption.question_id == question_id)
        .order_by(QuizOption.position)
    )
    options = [
        QuizOptionRead(
            id=o.id,
            question_id=o.question_id,
            content=o.content,
            is_correct=o.is_correct,
            position=o.position,
        )
        for o in o_result.scalars().all()
    ]
    return QuizQuestionRead(
        id=question.id,
        assignment_id=question.assignment_id,
        prompt=question.prompt,
        hint=question.hint,
        type=question.type,
        points=question.points,
        position=question.position,
        options=options,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.delete(
    "/assignments/{assignment_id}/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_question(
    assignment_id: UUID,
    question_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    question = await db.get(QuizQuestion, question_id)
    if question is None or question.assignment_id != assignment_id:
        raise NotFoundError("Questão")
    await db.delete(question)
    await db.commit()


# =============================================================================
# Options (staff)
# =============================================================================


@router.post(
    "/assignments/{assignment_id}/questions/{question_id}/options",
    response_model=QuizOptionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_option(
    assignment_id: UUID,
    question_id: UUID,
    payload: QuizOptionCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> QuizOptionRead:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    question = await db.get(QuizQuestion, question_id)
    if question is None or question.assignment_id != assignment_id:
        raise NotFoundError("Questão")

    max_pos = await db.execute(
        select(sa_func.coalesce(sa_func.max(QuizOption.position), 0)).where(
            QuizOption.question_id == question_id
        )
    )
    position = (max_pos.scalar_one() or 0) + 1

    option = QuizOption(
        question_id=question_id,
        content=payload.content,
        is_correct=payload.is_correct,
        position=position,
    )
    db.add(option)
    await db.commit()
    await db.refresh(option)
    return QuizOptionRead(
        id=option.id,
        question_id=option.question_id,
        content=option.content,
        is_correct=option.is_correct,
        position=option.position,
    )


@router.patch(
    "/assignments/{assignment_id}/questions/{question_id}/options/{option_id}",
    response_model=QuizOptionRead,
)
async def update_option(
    assignment_id: UUID,
    question_id: UUID,
    option_id: UUID,
    payload: QuizOptionUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> QuizOptionRead:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    option = await db.get(QuizOption, option_id)
    if option is None or option.question_id != question_id:
        raise NotFoundError("Opção")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(option, field, value)
    await db.commit()
    await db.refresh(option)
    return QuizOptionRead(
        id=option.id,
        question_id=option.question_id,
        content=option.content,
        is_correct=option.is_correct,
        position=option.position,
    )


@router.delete(
    "/assignments/{assignment_id}/questions/{question_id}/options/{option_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_option(
    assignment_id: UUID,
    question_id: UUID,
    option_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    option = await db.get(QuizOption, option_id)
    if option is None or option.question_id != question_id:
        raise NotFoundError("Opção")
    await db.delete(option)
    await db.commit()


# =============================================================================
# Criteria (staff)
# =============================================================================


@router.get(
    "/assignments/{assignment_id}/criteria",
    response_model=list[AssignmentCriterionRead],
)
async def list_criteria(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[AssignmentCriterionRead]:
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_member(db, profile.id, branch_id)

    result = await db.execute(
        select(AssignmentCriterion)
        .where(AssignmentCriterion.assignment_id == assignment_id)
        .order_by(AssignmentCriterion.position)
    )
    return [AssignmentCriterionRead.model_validate(c) for c in result.scalars().all()]


# =============================================================================
# Play (student safe — no is_correct)
# =============================================================================


@router.get(
    "/assignments/{assignment_id}/play",
    response_model=AssignmentPlayResponse,
)
async def play_assignment(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> AssignmentPlayResponse:
    """Retorna questões SEM is_correct. Requer membro da filial."""
    assignment, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_member(db, profile.id, branch_id)

    questions = await _questions_with_options(assignment_id, db, student_view=True)

    sub_result = await db.execute(
        select(Submission)
        .where(
            Submission.assignment_id == assignment_id,
            Submission.student_profile_id == profile.id,
        )
        .order_by(Submission.attempt.desc())
        .limit(1)
    )
    submission = sub_result.scalar_one_or_none()

    return AssignmentPlayResponse(
        assignment=AssignmentRead.model_validate(assignment),
        questions=questions,  # type: ignore[arg-type]
        submission=SubmissionRead.model_validate(submission) if submission else None,
    )


# =============================================================================
# Submissions
# =============================================================================


@router.post(
    "/assignments/{assignment_id}/submissions",
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def start_submission(
    assignment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> Submission:
    """Inicia ou retorna rascunho de submissão existente."""
    _, branch_id = await _get_assignment_and_branch(assignment_id, db)
    await require_branch_member(db, profile.id, branch_id)

    existing = await db.execute(
        select(Submission)
        .where(
            Submission.assignment_id == assignment_id,
            Submission.student_profile_id == profile.id,
            Submission.status == SubmissionStatus.DRAFT,
        )
        .limit(1)
    )
    draft = existing.scalar_one_or_none()
    if draft:
        return draft

    attempt_result = await db.execute(
        select(sa_func.coalesce(sa_func.max(Submission.attempt), 0)).where(
            Submission.assignment_id == assignment_id,
            Submission.student_profile_id == profile.id,
        )
    )
    attempt = (attempt_result.scalar_one() or 0) + 1

    submission = Submission(
        assignment_id=assignment_id,
        student_profile_id=profile.id,
        attempt=attempt,
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission


@router.post(
    "/submissions/{submission_id}/answers",
    response_model=SubmissionRead,
)
async def submit_answers(
    submission_id: UUID,
    payload: SubmitAnswersPayload,
    profile: CurrentProfile,
    db: DbSession,
) -> Submission:
    """Salva respostas e opcionalmente finaliza a submissão."""
    submission = await db.get(Submission, submission_id)
    if submission is None:
        raise NotFoundError("Submissão")
    if submission.student_profile_id != profile.id:
        raise NotFoundError("Submissão")
    if submission.status not in (SubmissionStatus.DRAFT,):
        raise HTTPException(status_code=409, detail="Submissão já finalizada")

    for answer in payload.answers:
        existing_resp = await db.execute(
            select(QuizResponse).where(
                QuizResponse.submission_id == submission_id,
                QuizResponse.question_id == answer.question_id,
            )
        )
        resp = existing_resp.scalar_one_or_none()
        if resp:
            resp.selected_option_id = answer.selected_option_id
            resp.text_answer = answer.text_answer
        else:
            db.add(
                QuizResponse(
                    submission_id=submission_id,
                    question_id=answer.question_id,
                    selected_option_id=answer.selected_option_id,
                    text_answer=answer.text_answer,
                )
            )

    if payload.finalize:
        submission.status = SubmissionStatus.SUBMITTED
        submission.submitted_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(submission)
    return submission
