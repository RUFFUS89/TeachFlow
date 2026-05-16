/**
 * Cliente HTTP tipado pro backend FastAPI do TeachFlow.
 *
 * Uso:
 *   import { createApiClient } from "@teachflow/api-client";
 *
 *   const api = createApiClient({
 *     baseUrl: "http://localhost:8000",
 *     getToken: async () => session?.access_token ?? null,
 *   });
 *
 *   const me = await api.me.get();
 */

import type {
  Branch,
  Course,
  CourseActivityItem,
  CourseDetail,
  CourseEnrollmentRead,
  CourseItem,
  CourseListItem,
  CourseModule,
  DashboardStats,
  Me,
} from "@teachflow/database";

// =============================================================================
// Tipos auxiliares
// =============================================================================

export interface ApiClientOptions {
  /** URL base do backend (ex: http://localhost:8000) */
  baseUrl: string;
  /** Função que retorna o JWT atual do usuário (ou null se não logado). */
  getToken: () => Promise<string | null> | string | null;
  /** Hook opcional pra logar/instrumentar requests (ex: Sentry) */
  onError?: (error: ApiError) => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public path: string,
  ) {
    super(`[${status}] ${path}: ${detail}`);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

// =============================================================================
// Factory
// =============================================================================

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getToken, onError } = options;

  async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, searchParams } = init;

    const url = new URL(path, baseUrl);
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const token = await getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "omit",
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const data = (await response.json()) as { detail?: string };
        if (data.detail) detail = data.detail;
      } catch {
        // resposta não-JSON, mantém statusText
      }
      const err = new ApiError(response.status, detail, path);
      onError?.(err);
      throw err;
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    /** GET /health — healthcheck simples (não requer auth) */
    health: () => request<{ status: string }>("/health"),

    me: {
      /** GET /api/v1/me/ — perfil + memberships do usuário logado */
      get: () => request<Me>("/api/v1/me/"),

      /** PATCH /api/v1/me/ — atualiza o próprio perfil */
      update: (data: Partial<Pick<Me["profile"], "full_name" | "avatar_url" | "phone" | "birth_date">>) =>
        request<Me["profile"]>("/api/v1/me/", { method: "PATCH", body: data }),
    },

    branches: {
      /** GET /api/v1/branches/ — lista filiais do usuário */
      list: () => request<Branch[]>("/api/v1/branches/"),

      /** POST /api/v1/branches/ — cria filial (criador vira owner) */
      create: (data: {
        name: string;
        slug: string;
        cnpj?: string | null;
        address_line?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        logo_url?: string | null;
      }) => request<Branch>("/api/v1/branches/", { method: "POST", body: data }),

      /** GET /api/v1/branches/{id} */
      get: (id: string) => request<Branch>(`/api/v1/branches/${id}`),

      /** PATCH /api/v1/branches/{id} — só owner */
      update: (id: string, data: Partial<Branch>) =>
        request<Branch>(`/api/v1/branches/${id}`, { method: "PATCH", body: data }),
    },

    dashboard: {
      /** GET /api/v1/dashboard/stats?branch_id= — 4 contadores do dashboard professor */
      stats: (branchId: string) =>
        request<DashboardStats>("/api/v1/dashboard/stats", {
          searchParams: { branch_id: branchId },
        }),
    },

    courses: {
      /** GET /api/v1/courses/?branch_id= — lista cursos da filial (staff) */
      list: (params: { branch_id: string; status?: string }) =>
        request<CourseListItem[]>("/api/v1/courses/", { searchParams: params }),

      /** POST /api/v1/courses/ — cria curso */
      create: (data: {
        branch_id: string;
        title: string;
        description?: string | null;
        cover_url?: string | null;
        color_tone?: string | null;
      }) => request<Course>("/api/v1/courses/", { method: "POST", body: data }),

      /** GET /api/v1/courses/{id} — detalhes com módulos e itens */
      get: (id: string) => request<CourseDetail>(`/api/v1/courses/${id}`),

      /** PATCH /api/v1/courses/{id} */
      update: (
        id: string,
        data: Partial<Pick<Course, "title" | "description" | "cover_url" | "color_tone" | "status">>,
      ) => request<Course>(`/api/v1/courses/${id}`, { method: "PATCH", body: data }),

      modules: {
        /** POST /api/v1/courses/{id}/modules */
        create: (courseId: string, data: { name: string }) =>
          request<CourseModule>(`/api/v1/courses/${courseId}/modules`, {
            method: "POST",
            body: data,
          }),

        /** PATCH /api/v1/courses/{id}/modules/{moduleId} */
        update: (courseId: string, moduleId: string, data: { name?: string; position?: number }) =>
          request<CourseModule>(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
            method: "PATCH",
            body: data,
          }),

        /** DELETE /api/v1/courses/{id}/modules/{moduleId} */
        delete: (courseId: string, moduleId: string) =>
          request<void>(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
            method: "DELETE",
          }),
      },

      items: {
        /** POST /api/v1/courses/{id}/items — cria shell de lesson ou assignment */
        create: (
          courseId: string,
          data: { kind: "lesson" | "assignment"; title: string; module_id?: string | null },
        ) =>
          request<CourseItem>(`/api/v1/courses/${courseId}/items`, {
            method: "POST",
            body: data,
          }),

        /** PATCH /api/v1/courses/{id}/items/reorder */
        reorder: (courseId: string, orderedIds: string[]) =>
          request<void>(`/api/v1/courses/${courseId}/items/reorder`, {
            method: "PATCH",
            body: { ordered_ids: orderedIds },
          }),

        /** DELETE /api/v1/courses/{id}/items/{itemId} */
        delete: (courseId: string, itemId: string) =>
          request<void>(`/api/v1/courses/${courseId}/items/${itemId}`, { method: "DELETE" }),
      },

      enrollments: {
        /** GET /api/v1/courses/{id}/enrollments */
        list: (courseId: string) =>
          request<CourseEnrollmentRead[]>(`/api/v1/courses/${courseId}/enrollments`),

        /** POST /api/v1/courses/{id}/enrollments */
        create: (courseId: string, data: { student_profile_id: string }) =>
          request<CourseEnrollmentRead>(`/api/v1/courses/${courseId}/enrollments`, {
            method: "POST",
            body: data,
          }),

        /** DELETE /api/v1/courses/{id}/enrollments/{profileId} */
        delete: (courseId: string, studentProfileId: string) =>
          request<void>(`/api/v1/courses/${courseId}/enrollments/${studentProfileId}`, {
            method: "DELETE",
          }),
      },

      /** GET /api/v1/courses/{id}/activity */
      activity: (courseId: string) =>
        request<CourseActivityItem[]>(`/api/v1/courses/${courseId}/activity`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
