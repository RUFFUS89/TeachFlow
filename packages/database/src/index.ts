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
// Re-exports de conveniência
// =============================================================================

export type AnyRole = BranchRole;
