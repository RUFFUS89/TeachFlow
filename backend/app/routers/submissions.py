"""Endpoints do painel de correção (Fase 6)."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import and_, or_, select

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.permissions import is_branch_staff, require_branch_staff
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.grade import Grade, Notification, SubmissionAttachment, SubmissionCriterionScore
from app.models.identity import Profile
from app.models.quiz import AssignmentCriterion
from app.models.submission import Submission, SubmissionStatus
from app.schemas.submission import (
    CriterionScoreRead,
    GradeInput,
    GradeRead,
    SaveCriteriaPayload,
    SubmissionAttachmentRead,
    SubmissionDetail,
    SubmissionListItem,
    SubmissionsSummary,
)

router = APIRouter(tags=["submissions"])


# =============================================================================
# Helpers
# =============================================================================


async def _submission_branch(
    submission_id: UUID, db: DbSession
) -> tuple[Submission, Assignment, UUID]:
    sub = await db.get(Submission, submission_id)
    if sub is None:
        raise NotFoundError("Submissão")
    assignment = await db.get(Assignment, sub.assignment_id)
    if assignment is None:
        raise NotFoundError("Atividade")
    course = await db.get(Course, assignment.course_id)
    if course is None:
        raise NotFoundError("Curso")
    return sub, assignment, course.branch_id  # type: ignore[return-value]


async def _profile_name(profile_id: UUID, db: DbSession) -> str:
    p = await db.get(Profile, profile_id)
    return p.full_name if p else ""


# =============================================================================
# GET /submissions/summary
# =============================================================================


@router.get("/submissions/summary", response_model=SubmissionsSummary)
async def get_submissions_summary(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> SubmissionsSummary:
    """Contadores de submissões da filial. Requer staff."""
    await require_branch_staff(db, profile.id, branch_id)

    base_q = (
        select(Submission.status)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .where(Course.branch_id == branch_id)
    )

    result = await db.execute(base_q)
    rows = list(result.scalars().all())

    pending_statuses = {SubmissionStatus.SUBMITTED, SubmissionStatus.LATE}
    return SubmissionsSummary(
        total=len(rows),
        pending=sum(1 for s in rows if s in pending_statuses),
        graded=sum(1 for s in rows if s == SubmissionStatus.GRADED),
        late=sum(1 for s in rows if s == SubmissionStatus.LATE),
    )


# =============================================================================
# GET /submissions/
# =============================================================================


@router.get("/submissions", response_model=list[SubmissionListItem])
async def list_submissions(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
    status_filter: SubmissionStatus | None = Query(default=None, alias="status"),
    course_id: UUID | None = None,
    q: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> list[SubmissionListItem]:
    """Lista submissões da filial, filtradas. Requer staff."""
    await require_branch_staff(db, profile.id, branch_id)

    stmt = (
        select(Submission, Assignment, Course, Profile)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .join(Course, Assignment.course_id == Course.id)
        .join(Profile, Submission.student_profile_id == Profile.id)
        .where(Course.branch_id == branch_id)
    )

    if status_filter is not None:
        stmt = stmt.where(Submission.status == status_filter)
    if course_id is not None:
        stmt = stmt.where(Course.id == course_id)
    if q:
        stmt = stmt.where(
            or_(
                Profile.full_name.ilike(f"%{q}%"),
                Assignment.title.ilike(f"%{q}%"),
            )
        )

    stmt = stmt.order_by(Submission.submitted_at.desc().nullslast()).offset(offset).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    items: list[SubmissionListItem] = []
    for sub, assignment, course, student in rows:
        is_late = bool(
            assignment.due_date and sub.submitted_at and sub.submitted_at > assignment.due_date
        )
        items.append(
            SubmissionListItem(
                id=sub.id,
                assignment_id=sub.assignment_id,
                assignment_title=assignment.title,
                assignment_type=assignment.type.value,
                course_id=course.id,
                course_title=course.title,
                student_profile_id=sub.student_profile_id,
                student_name=student.full_name,
                attempt=sub.attempt,
                status=sub.status,
                submitted_at=sub.submitted_at,
                score=sub.score,
                is_late=is_late,
                created_at=sub.created_at,
            )
        )
    return items


# =============================================================================
# GET /submissions/{id}
# =============================================================================


@router.get("/submissions/{submission_id}", response_model=SubmissionDetail)
async def get_submission(
    submission_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> SubmissionDetail:
    """Detalhe de submissão. Acessível pelo próprio aluno ou staff da filial."""
    sub, assignment, branch_id = await _submission_branch(submission_id, db)

    is_owner = sub.student_profile_id == profile.id
    is_staff = await is_branch_staff(db, profile.id, branch_id)
    if not is_owner and not is_staff:
        raise ForbiddenError("Acesso negado")

    course = await db.get(Course, assignment.course_id)
    student = await db.get(Profile, sub.student_profile_id)

    # Grade
    grade_row = (
        await db.execute(select(Grade).where(Grade.submission_id == submission_id))
    ).scalar_one_or_none()

    # Criterion scores com nomes
    cs_result = await db.execute(
        select(SubmissionCriterionScore, AssignmentCriterion)
        .join(AssignmentCriterion, SubmissionCriterionScore.criterion_id == AssignmentCriterion.id)
        .where(SubmissionCriterionScore.submission_id == submission_id)
    )
    criterion_scores = [
        CriterionScoreRead(
            id=cs.id,
            submission_id=cs.submission_id,
            criterion_id=cs.criterion_id,
            criterion_name=crit.name,
            max_score=crit.max_score,
            score=cs.score,
            feedback=cs.feedback,
            updated_at=cs.updated_at,
        )
        for cs, crit in cs_result.all()
    ]

    # Attachments
    att_result = await db.execute(
        select(SubmissionAttachment).where(SubmissionAttachment.submission_id == submission_id)
    )
    attachments = [SubmissionAttachmentRead.model_validate(a) for a in att_result.scalars().all()]

    is_late = bool(
        assignment.due_date and sub.submitted_at and sub.submitted_at > assignment.due_date
    )

    return SubmissionDetail(
        id=sub.id,
        assignment_id=sub.assignment_id,
        assignment_title=assignment.title,
        assignment_type=assignment.type.value,
        course_title=course.title if course else "",
        student_profile_id=sub.student_profile_id,
        student_name=student.full_name if student else "",
        attempt=sub.attempt,
        content=sub.content,
        status=sub.status,
        submitted_at=sub.submitted_at,
        score=sub.score,
        is_late=is_late,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
        grade=GradeRead.model_validate(grade_row) if grade_row else None,
        criterion_scores=criterion_scores,
        attachments=attachments,
    )


# =============================================================================
# PATCH /submissions/{id} — salva rascunho de correção
# =============================================================================


@router.patch("/submissions/{submission_id}", response_model=SubmissionDetail)
async def update_submission_draft(
    submission_id: UUID,
    payload: GradeInput,
    profile: CurrentProfile,
    db: DbSession,
) -> SubmissionDetail:
    """Salva rascunho (score + feedback) sem publicar ao aluno. Requer staff."""
    sub, _, branch_id = await _submission_branch(submission_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    now = datetime.now(UTC)
    existing = (
        await db.execute(select(Grade).where(Grade.submission_id == submission_id))
    ).scalar_one_or_none()

    if existing:
        existing.score = payload.score
        existing.feedback = payload.feedback
        existing.graded_by = profile.id
        existing.graded_at = now
        if not payload.release:
            existing.released_at = None
    else:
        db.add(
            Grade(
                assignment_id=sub.assignment_id,
                student_profile_id=sub.student_profile_id,
                submission_id=submission_id,
                score=payload.score,
                feedback=payload.feedback,
                graded_by=profile.id,
                graded_at=now,
                released_at=None,
            )
        )

    await db.commit()
    return await get_submission(submission_id, profile, db)


# =============================================================================
# POST /submissions/{id}/grade — lança nota e notifica aluno
# =============================================================================


@router.post(
    "/submissions/{submission_id}/grade",
    response_model=SubmissionDetail,
    status_code=status.HTTP_200_OK,
)
async def grade_submission(
    submission_id: UUID,
    payload: GradeInput,
    profile: CurrentProfile,
    db: DbSession,
) -> SubmissionDetail:
    """Lança nota (published). Atualiza cache em submissions + insere notificação. Requer staff."""
    sub, assignment, branch_id = await _submission_branch(submission_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    now = datetime.now(UTC)
    released_at = now if payload.release else None

    existing = (
        await db.execute(select(Grade).where(Grade.submission_id == submission_id))
    ).scalar_one_or_none()

    if existing:
        existing.score = payload.score
        existing.feedback = payload.feedback
        existing.graded_by = profile.id
        existing.graded_at = now
        existing.released_at = released_at
    else:
        existing = Grade(
            assignment_id=sub.assignment_id,
            student_profile_id=sub.student_profile_id,
            submission_id=submission_id,
            score=payload.score,
            feedback=payload.feedback,
            graded_by=profile.id,
            graded_at=now,
            released_at=released_at,
        )
        db.add(existing)

    # Atualiza cache na submissions
    sub.score = payload.score
    sub.status = SubmissionStatus.GRADED

    # Notificação para o aluno (só quando realmente publicada)
    if payload.release:
        notification = Notification(
            recipient_profile_id=sub.student_profile_id,
            branch_id=branch_id,
            type="grade_released",
            title=f"Nota lançada: {assignment.title}",
            body=f"Você recebeu {payload.score} pontos.",
            link=f"/courses/{assignment.course_id}/assignments/{assignment.id}",
        )
        db.add(notification)

    await db.commit()
    return await get_submission(submission_id, profile, db)


# =============================================================================
# POST /submissions/{id}/return — devolve para retrabalho
# =============================================================================


@router.post(
    "/submissions/{submission_id}/return",
    response_model=SubmissionDetail,
    status_code=status.HTTP_200_OK,
)
async def return_submission(
    submission_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> SubmissionDetail:
    """Muda status para 'returned' sem lançar nota. Requer staff."""
    sub, _, branch_id = await _submission_branch(submission_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    sub.status = SubmissionStatus.RETURNED
    await db.commit()
    return await get_submission(submission_id, profile, db)


# =============================================================================
# POST /submissions/{id}/criteria-scores — upserta pontuações por critério
# =============================================================================


@router.post(
    "/submissions/{submission_id}/criteria-scores",
    response_model=list[CriterionScoreRead],
    status_code=status.HTTP_200_OK,
)
async def save_criteria_scores(
    submission_id: UUID,
    payload: SaveCriteriaPayload,
    profile: CurrentProfile,
    db: DbSession,
) -> list[CriterionScoreRead]:
    """Upserta pontuação por critério. Requer staff."""
    _, __, branch_id = await _submission_branch(submission_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    for item in payload.scores:
        existing = (
            await db.execute(
                select(SubmissionCriterionScore).where(
                    and_(
                        SubmissionCriterionScore.submission_id == submission_id,
                        SubmissionCriterionScore.criterion_id == item.criterion_id,
                    )
                )
            )
        ).scalar_one_or_none()

        if existing:
            existing.score = item.score
            existing.feedback = item.feedback
        else:
            new_cs = SubmissionCriterionScore(
                submission_id=submission_id,
                criterion_id=item.criterion_id,
                score=item.score,
                feedback=item.feedback,
            )
            db.add(new_cs)

    await db.commit()

    # Retorna os scores atualizados com nomes dos critérios
    cs_result = await db.execute(
        select(SubmissionCriterionScore, AssignmentCriterion)
        .join(AssignmentCriterion, SubmissionCriterionScore.criterion_id == AssignmentCriterion.id)
        .where(SubmissionCriterionScore.submission_id == submission_id)
    )
    return [
        CriterionScoreRead(
            id=cs.id,
            submission_id=cs.submission_id,
            criterion_id=cs.criterion_id,
            criterion_name=crit.name,
            max_score=crit.max_score,
            score=cs.score,
            feedback=cs.feedback,
            updated_at=cs.updated_at,
        )
        for cs, crit in cs_result.all()
    ]
