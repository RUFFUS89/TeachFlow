/**
 * Tipos do domínio TeachFlow.
 *
 * Estes são tipos manuais escritos pra refletir o schema 01_schema_v2.sql.
 * Quando o projeto Supabase estiver mais maduro, gere os tipos automáticos:
 *
 *   pnpm --filter @teachflow/database generate-types
 *
 * E substitua este arquivo pelos tipos gerados, mantendo as exportações
 * de conveniência abaixo.
 */

// =============================================================================
// Enums
// =============================================================================

export type BranchRole = "owner" | "admin" | "usuario";

export type MemberStatus = "active" | "inactive" | "pending";

export type TutorRelationshipType =
  | "mother"
  | "father"
  | "stepparent"
  | "grandparent"
  | "sibling"
  | "legal_guardian"
  | "other";

export type CourseStatus = "draft" | "active" | "archived";

export type CourseItemKind = "lesson" | "assignment";

export type AssignmentType = "task" | "quiz" | "exam" | "project";

export type QuizFeedbackMode = "immediate" | "on_submit" | "manual_release";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_text"
  | "long_text";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "late"
  | "returned"
  | "graded";

export type ItemProgressStatus = "not_started" | "in_progress" | "completed";

export type VideoProvider = "youtube" | "vimeo" | "mux" | "self_hosted";

export type NotificationType =
  | "assignment_due"
  | "grade_released"
  | "comment"
  | "announcement"
  | "enrollment"
  | "other";

// =============================================================================
// Identidade
// =============================================================================

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BranchMember {
  id: string;
  branch_id: string;
  profile_id: string;
  role: BranchRole;
  status: MemberStatus;
  created_at: string;
}

// Vista combinada do /api/v1/me/
export interface BranchMembership {
  branch_id: string;
  role: BranchRole;
  status: MemberStatus;
}

export interface Me {
  profile: Profile;
  memberships: BranchMembership[];
}

// =============================================================================
// Cursos
// =============================================================================

export interface Course {
  id: string;
  branch_id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  color_tone: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CourseListItem extends Course {
  students_count: number;
  items_count: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface CourseItem {
  id: string;
  course_id: string;
  module_id: string | null;
  position: number;
  kind: CourseItemKind;
  lesson_id: string | null;
  assignment_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_profile_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface CourseEnrollmentRead extends CourseEnrollment {
  student_name: string;
  student_avatar_url: string | null;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
  items: CourseItem[];
  students_count: number;
  items_count: number;
}

export interface CourseActivityItem {
  kind: string;
  actor_name: string;
  actor_avatar_url: string | null;
  description: string;
  created_at: string;
}

// =============================================================================
// Lições
// =============================================================================

export interface Lesson {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  video_provider: VideoProvider | null;
  video_duration_seconds: number | null;
  is_essential: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface LessonComment {
  id: string;
  lesson_id: string;
  author_id: string;
  parent_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface ItemProgress {
  id: string;
  course_item_id: string;
  student_profile_id: string;
  status: ItemProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  watch_seconds: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Atividades
// =============================================================================

export interface Assignment {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  instructions: string | null;
  type: AssignmentType;
  max_score: number;
  weight: number;
  due_date: string | null;
  available_from: string | null;
  published_at: string | null;
  allow_late_submission: boolean;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  feedback_mode: QuizFeedbackMode;
  pass_threshold_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  position: number;
}

export interface QuizOptionStudent {
  id: string;
  question_id: string;
  content: string;
  position: number;
}

export interface QuizQuestion {
  id: string;
  assignment_id: string;
  prompt: string;
  hint: string | null;
  type: QuestionType;
  points: number;
  position: number;
  options: QuizOption[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionStudent {
  id: string;
  prompt: string;
  hint: string | null;
  type: QuestionType;
  points: number;
  position: number;
  options: QuizOptionStudent[];
}

export interface AssignmentCriterion {
  id: string;
  assignment_id: string;
  name: string;
  description: string | null;
  max_score: number;
  position: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_profile_id: string;
  attempt: number;
  content: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentPlayResponse {
  assignment: Assignment;
  questions: QuizQuestionStudent[];
  submission: Submission | null;
}

// =============================================================================
// Dashboard
// =============================================================================

export interface DashboardStats {
  active_courses: number;
  active_students: number;
  pending_submissions: number;
  weekly_activity_count: number;
}

// =============================================================================
// Re-exports de conveniência
// =============================================================================

export type AnyRole = BranchRole;
