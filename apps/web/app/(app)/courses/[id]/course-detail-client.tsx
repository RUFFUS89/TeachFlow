"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApiError } from "@teachflow/api-client";
import type { CourseDetail, CourseEnrollmentRead, CourseItem, CourseModule } from "@teachflow/database";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  Label,
  Modal,
  PageHeader,
  Select,
  TabPills,
  Textarea,
  type Tone,
} from "@teachflow/ui";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import Link from "next/link";

import { useApiClient } from "@/lib/api";

// =============================================================================
// Constants
// =============================================================================

const TABS = [
  { value: "content", label: "Conteúdo" },
  { value: "students", label: "Alunos" },
  { value: "submissions", label: "Entregas" },
  { value: "settings", label: "Configurações" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const STATUS_TONE: Record<CourseDetail["status"], Tone> = {
  draft: "caramel",
  active: "sage",
  archived: "neutral",
};

const STATUS_LABEL: Record<CourseDetail["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

const TONE_OPTIONS = [
  { value: "peach", label: "Pêssego" },
  { value: "sage", label: "Sálvia" },
  { value: "caramel", label: "Caramelo" },
  { value: "butter", label: "Manteiga" },
  { value: "blush", label: "Rosa" },
  { value: "lilac", label: "Lilás" },
  { value: "accent", label: "Azul" },
];

const TONE_BG: Record<string, string> = {
  peach: "bg-peach",
  sage: "bg-sage",
  caramel: "bg-caramel",
  butter: "bg-butter",
  blush: "bg-blush",
  lilac: "bg-lilac",
  accent: "bg-accent",
};

// =============================================================================
// Root client component
// =============================================================================

export function CourseDetailClient({
  course: initialCourse,
  activeTab,
}: {
  course: CourseDetail;
  activeTab: string;
}) {
  const router = useRouter();
  const api = useApiClient();
  const [course, setCourse] = useState(initialCourse);
  const tab = (TABS.some((t) => t.value === activeTab) ? activeTab : "content") as TabValue;

  function setTab(value: string) {
    router.push(`?tab=${value}`, { scroll: false });
  }

  function refreshCourse() {
    api.courses.get(course.id).then(setCourse).catch(() => null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <CourseHeroCard course={course} />

      {/* Tabs */}
      <TabPills
        items={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          count:
            t.value === "students"
              ? course.students_count
              : t.value === "content"
                ? course.items_count
                : undefined,
        }))}
        value={tab}
        onChange={setTab}
      />

      {/* Tab content */}
      {tab === "content" && (
        <ContentTab course={course} onRefresh={refreshCourse} />
      )}
      {tab === "students" && (
        <StudentsTab courseId={course.id} branchId={course.branch_id} onRefresh={refreshCourse} />
      )}
      {tab === "submissions" && (
        <EmptyState
          icon="ClipboardList"
          title="Entregas chegam na Fase 6"
          description="A correção de atividades estará disponível em breve."
        />
      )}
      {tab === "settings" && (
        <SettingsTab course={course} onSaved={(updated) => setCourse((c) => ({ ...c, ...updated }))} />
      )}
    </div>
  );
}

// =============================================================================
// Hero card
// =============================================================================

function CourseHeroCard({ course }: { course: CourseDetail }) {
  const tone = (course.color_tone ?? "sage") as Tone;
  return (
    <Card tone={tone} padding="lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide opacity-60">Curso</p>
            <h1 className="text-2xl font-bold">{course.title}</h1>
          </div>
          <Chip tone={STATUS_TONE[course.status]}>{STATUS_LABEL[course.status]}</Chip>
        </div>
        {course.description && (
          <p className="text-sm opacity-70">{course.description}</p>
        )}
        <div className="mt-2 flex gap-4 text-sm opacity-60">
          <span className="flex items-center gap-1">
            <Icon name="Users" size={14} />
            {course.students_count} alunos
          </span>
          <span className="flex items-center gap-1">
            <Icon name="BookOpen" size={14} />
            {course.items_count} itens
          </span>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Content tab — sequence list with DnD
// =============================================================================

function ContentTab({
  course,
  onRefresh,
}: {
  course: CourseDetail;
  onRefresh: () => void;
}) {
  const api = useApiClient();
  const [items, setItems] = useOptimistic(course.items);
  const [modules, setModules] = useState(course.modules);
  const [isPending, startTransition] = useTransition();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    setModules(course.modules);
  }, [course.modules]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);

    startTransition(async () => {
      setItems(newItems);
      await api.courses.items.reorder(
        course.id,
        newItems.map((i) => i.id),
      );
      onRefresh();
    });
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Remover este item do curso?")) return;
    await api.courses.items.delete(course.id, itemId);
    onRefresh();
  }

  async function handleAddModule(name: string) {
    await api.courses.modules.create(course.id, { name });
    setModules((prev) => [...prev]);
    onRefresh();
    setShowAddModule(false);
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Remover módulo? Os itens do módulo voltam para sem módulo.")) return;
    await api.courses.modules.delete(course.id, moduleId);
    onRefresh();
  }

  async function handleAddItem(kind: "lesson" | "assignment", title: string, moduleId: string | null) {
    setAddError(null);
    try {
      await api.courses.items.create(course.id, { kind, title, module_id: moduleId });
      onRefresh();
      setShowAddItem(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.detail : "Erro ao criar item");
    }
  }

  // Group items by module
  const itemsByModule: Record<string, CourseItem[]> = {};
  const unmoduledItems: CourseItem[] = [];
  for (const item of items) {
    if (item.module_id) {
      if (!itemsByModule[item.module_id]) itemsByModule[item.module_id] = [];
      itemsByModule[item.module_id].push(item);
    } else {
      unmoduledItems.push(item);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddModule(true)}
        >
          <Icon name="Plus" size={14} />
          Módulo
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setSelectedModuleId(null);
            setShowAddItem(true);
          }}
        >
          <Icon name="Plus" size={14} />
          Adicionar item
        </Button>
      </div>

      {items.length === 0 && modules.length === 0 ? (
        <EmptyState
          icon="BookOpen"
          title="Nenhum conteúdo ainda"
          description="Adicione aulas e atividades para montar a sequência do curso."
          action={
            <Button onClick={() => setShowAddItem(true)}>
              <Icon name="Plus" size={14} />
              Adicionar primeiro item
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {/* Módulos com itens */}
              {modules.map((mod) => (
                <div key={mod.id} className="flex flex-col gap-1">
                  <ModuleHeader
                    module={mod}
                    onDelete={() => handleDeleteModule(mod.id)}
                    onAddItem={() => {
                      setSelectedModuleId(mod.id);
                      setShowAddItem(true);
                    }}
                  />
                  {(itemsByModule[mod.id] ?? []).map((item) => (
                    <SortableItemRow
                      key={item.id}
                      item={item}
                      courseId={course.id}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              ))}

              {/* Itens sem módulo */}
              {unmoduledItems.map((item) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  courseId={course.id}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isPending && (
        <p className="text-center text-xs text-inkMuted">Salvando ordem…</p>
      )}

      {/* Add item modal */}
      <AddItemModal
        open={showAddItem}
        modules={modules}
        defaultModuleId={selectedModuleId}
        error={addError}
        onClose={() => {
          setShowAddItem(false);
          setAddError(null);
        }}
        onSubmit={handleAddItem}
      />

      {/* Add module modal */}
      <AddModuleModal
        open={showAddModule}
        onClose={() => setShowAddModule(false)}
        onSubmit={handleAddModule}
      />
    </div>
  );
}

function ModuleHeader({
  module,
  onDelete,
  onAddItem,
}: {
  module: CourseModule;
  onDelete: () => void;
  onAddItem: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-surface2 px-4 py-2">
      <div className="flex items-center gap-2">
        <Icon name="ChevronRight" size={14} className="text-inkMuted" />
        <span className="text-sm font-semibold">{module.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAddItem}
          className="rounded p-1 text-inkMuted hover:text-ink"
          title="Adicionar item neste módulo"
        >
          <Icon name="Plus" size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-inkMuted hover:text-blushInk"
          title="Remover módulo"
        >
          <Icon name="Trash2" size={14} />
        </button>
      </div>
    </div>
  );
}

function SortableItemRow({
  item,
  courseId,
  onDelete,
}: {
  item: CourseItem;
  courseId: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-inkMuted active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <Icon name="GripVertical" size={16} />
      </button>

      <div className="flex flex-1 items-center gap-2 min-w-0">
        <Icon
          name={item.kind === "lesson" ? "Video" : "ClipboardList"}
          size={16}
          className="shrink-0 text-inkMuted"
        />
        <span className="truncate text-sm font-medium">{item.title || "Sem título"}</span>
      </div>

      <Chip tone={item.kind === "lesson" ? "sage" : "caramel"} size="sm">
        {item.kind === "lesson" ? "Aula" : "Atividade"}
      </Chip>

      {item.kind === "lesson" && item.lesson_id && (
        <Link
          href={`/courses/${courseId}/lessons/${item.lesson_id}`}
          className="shrink-0 rounded p-1 text-inkMuted hover:text-ink"
          title="Abrir aula"
        >
          <Icon name="ExternalLink" size={14} />
        </Link>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded p-1 text-inkMuted hover:text-blushInk"
        title="Remover item"
      >
        <Icon name="Trash2" size={14} />
      </button>
    </div>
  );
}

function AddItemModal({
  open,
  modules,
  defaultModuleId,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  modules: CourseModule[];
  defaultModuleId: string | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (kind: "lesson" | "assignment", title: string, moduleId: string | null) => Promise<void>;
}) {
  const [kind, setKind] = useState<"lesson" | "assignment">("lesson");
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState<string>(defaultModuleId ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setKind("lesson");
      setModuleId(defaultModuleId ?? "");
    }
  }, [open, defaultModuleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit(kind, title.trim(), moduleId || null);
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
        )}

        <div className="flex gap-2">
          {(["lesson", "assignment"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-card border-2 p-3 text-sm font-medium transition-colors",
                kind === k ? "border-ink bg-ink text-bg" : "border-border hover:bg-surface2",
              ].join(" ")}
            >
              <Icon name={k === "lesson" ? "Video" : "ClipboardList"} size={16} />
              {k === "lesson" ? "Aula" : "Atividade"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-title">Título *</Label>
          <Input
            id="item-title"
            placeholder={kind === "lesson" ? "Ex: Introdução ao tema" : "Ex: Lista de exercícios"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        {modules.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-module">Módulo (opcional)</Label>
            <Select
              id="item-module"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              <option value="">Sem módulo</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            Criar {kind === "lesson" ? "aula" : "atividade"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddModuleModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit(name.trim());
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo módulo">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="module-name">Nome do módulo *</Label>
          <Input
            id="module-name"
            placeholder="Ex: Módulo 1 — Fundamentos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Criar módulo
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// Students tab
// =============================================================================

function StudentsTab({
  courseId,
  branchId,
  onRefresh,
}: {
  courseId: string;
  branchId: string;
  onRefresh: () => void;
}) {
  const api = useApiClient();
  const [enrollments, setEnrollments] = useState<CourseEnrollmentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    api.courses.enrollments
      .list(courseId)
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUnenroll(studentProfileId: string, name: string) {
    if (!confirm(`Remover matrícula de ${name}?`)) return;
    await api.courses.enrollments.delete(courseId, studentProfileId);
    setEnrollments((prev) => prev.filter((e) => e.student_profile_id !== studentProfileId));
    onRefresh();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-card bg-surface2" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowEnrollModal(true)}>
          <Icon name="Plus" size={14} />
          Matricular aluno
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon="Users"
          title="Nenhum aluno matriculado"
          description="Matricule alunos para que eles possam acessar o conteúdo do curso."
          action={
            <Button onClick={() => setShowEnrollModal(true)}>
              <Icon name="Plus" size={14} />
              Matricular primeiro aluno
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Aluno</th>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Matriculado em</th>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Conclusão</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={enrollment.student_avatar_url ?? undefined}
                        name={enrollment.student_name}
                        size="sm"
                      />
                      <span className="font-medium">{enrollment.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-inkMuted">
                    {new Date(enrollment.enrolled_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.completed_at ? (
                      <Chip tone="sage" size="sm">
                        Concluído
                      </Chip>
                    ) : (
                      <span className="text-inkMuted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleUnenroll(enrollment.student_profile_id, enrollment.student_name)}
                      className="rounded p-1 text-inkMuted hover:text-blushInk"
                      title="Remover matrícula"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <EnrollStudentModal
        open={showEnrollModal}
        courseId={courseId}
        onClose={() => setShowEnrollModal(false)}
        onEnrolled={(enrollment) => {
          setEnrollments((prev) => [enrollment, ...prev]);
          onRefresh();
          setShowEnrollModal(false);
        }}
      />
    </div>
  );
}

function EnrollStudentModal({
  open,
  courseId,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onEnrolled: (enrollment: CourseEnrollmentRead) => void;
}) {
  const api = useApiClient();
  const [profileId, setProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProfileId("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const enrollment = await api.courses.enrollments.create(courseId, {
        student_profile_id: profileId.trim(),
      });
      onEnrolled(enrollment);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao matricular aluno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Matricular aluno">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-id">ID do perfil do aluno</Label>
          <Input
            id="profile-id"
            placeholder="UUID do perfil"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            required
            autoFocus
          />
          <p className="text-xs text-inkMuted">
            Cole o ID do perfil do aluno (UUID). Na Fase 7, isso será feito via convite.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={!profileId.trim()}>
            Matricular
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// Settings tab
// =============================================================================

function SettingsTab({
  course,
  onSaved,
}: {
  course: CourseDetail;
  onSaved: (updated: Partial<CourseDetail>) => void;
}) {
  const api = useApiClient();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [colorTone, setColorTone] = useState(course.color_tone ?? "sage");
  const [courseStatus, setCourseStatus] = useState<CourseDetail["status"]>(course.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.courses.update(course.id, {
        title: title.trim(),
        description: description.trim() || null,
        color_tone: colorTone,
        status: courseStatus,
      });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <PageHeader title="Configurações do curso" />

        {error && (
          <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
        )}
        {saved && (
          <div className="rounded-card bg-sage px-4 py-3 text-sm text-sageInk">
            Alterações salvas com sucesso.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-title">Nome do curso *</Label>
          <Input
            id="settings-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-desc">Descrição</Label>
          <Textarea
            id="settings-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva brevemente o curso (opcional)"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Tom de cor</Label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColorTone(opt.value)}
                title={opt.label}
                className={[
                  "size-8 rounded-full border-2 transition-transform hover:scale-110",
                  TONE_BG[opt.value] ?? "",
                  colorTone === opt.value ? "border-ink scale-110" : "border-transparent",
                ].join(" ")}
                aria-pressed={colorTone === opt.value}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-status">Status</Label>
          <Select
            id="settings-status"
            value={courseStatus}
            onChange={(e) => setCourseStatus(e.target.value as CourseDetail["status"])}
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
          </Select>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Card>
  );
}
