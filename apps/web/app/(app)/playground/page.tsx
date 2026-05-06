"use client";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  Label,
  Modal,
  PageHeader,
  ProgressBar,
  Ring,
  Select,
  Skeleton,
  Spinner,
  Stat,
  TabPills,
  Textarea,
  useDisclosure,
} from "@teachflow/ui";
import { useState } from "react";

const TONES = ["peach", "sage", "caramel", "butter", "blush", "lilac", "accent"] as const;

export default function PlaygroundPage() {
  const modal = useDisclosure();
  const [tab, setTab] = useState("active");

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Fase 0"
        title="Playground de componentes"
        description="Vitrine das primitives do @teachflow/ui. Apague essa rota antes da Fase 1."
        actions={
          <>
            <Button variant="ghost" icon="external">
              Documentação
            </Button>
            <Button icon="sparkle">Ação primária</Button>
          </>
        }
      />

      {/* Botões */}
      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button icon="plus">Com ícone</Button>
          <Button iconRight="arrow-right">Próximo</Button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards (tone)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TONES.map((tone) => (
            <Card key={tone} tone={tone} padding="sm">
              <p className="font-display text-sm capitalize">{tone}</p>
              <p className="text-xs opacity-70">Tom acolhedor</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Chips & badges */}
      <Section title="Chips & Badges">
        <div className="flex flex-wrap items-center gap-2">
          {TONES.map((tone) => (
            <Chip key={tone} tone={tone} icon="sparkle">
              {tone}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge status="active" />
          <Badge status="draft" />
          <Badge status="scheduled" />
          <Badge status="graded" />
          <Badge status="late" />
          <Badge status="returned" />
        </div>
      </Section>

      {/* Avatares */}
      <Section title="Avatares">
        <div className="flex items-center gap-3">
          <Avatar name="Joser Rufino" size="xs" />
          <Avatar name="Laura Mendes" size="sm" />
          <Avatar name="Carla Souza" size="md" />
          <Avatar name="Pedro Lima" size="lg" />
          <Avatar name="Ana Beatriz" size="xl" />
        </div>
      </Section>

      {/* Stats e progresso */}
      <Section title="Stats / Ring / Progress">
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="Aulas ativas" value="12" delta="+2 essa semana" deltaTone="up" icon="book" tone="peach" />
          <Stat label="Alunos" value="84" delta="+5 essa semana" deltaTone="up" icon="people" tone="sage" />
          <Stat label="Entregas" value="7" delta="3 atrasadas" deltaTone="down" icon="clip" tone="blush" />
          <Stat label="Conclusão" value="68%" delta="estável" deltaTone="neutral" icon="sparkle" tone="butter" />
        </div>
        <div className="mt-4 flex items-center gap-6">
          <Ring value={68} tone="accent" size={72} />
          <Ring value={42} tone="sage" size={72} />
          <Ring value={91} tone="peach" size={72} />
          <div className="flex-1">
            <ProgressBar value={62} tone="accent" label="Curso de redação" showValue />
            <div className="h-3" />
            <ProgressBar value={28} tone="butter" label="Inglês básico" showValue />
          </div>
        </div>
      </Section>

      {/* Forms */}
      <Section title="Inputs e formulário">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Nome completo" placeholder="Joser Rufino" required />
          <Input label="Email" type="email" placeholder="voce@teachflow.com" helper="Usaremos pra avisos importantes." />
          <Select label="Filial" defaultValue="">
            <option value="" disabled>
              Selecione uma filial
            </option>
            <option value="centro">Cursinho Centro</option>
            <option value="zona-sul">Cursinho Zona Sul</option>
          </Select>
          <Input label="CNPJ" placeholder="00.000.000/0000-00" error="CNPJ inválido" />
          <div className="md:col-span-2">
            <Textarea label="Resumo do curso" placeholder="Conte rapidamente o que esse curso ensina." />
          </div>
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs (segmented control)">
        <TabPills
          items={[
            { value: "active", label: "Pendentes", count: 7 },
            { value: "graded", label: "Corrigidas", count: 24 },
            { value: "late", label: "Atrasadas", count: 3 },
            { value: "all", label: "Todas", count: 58 },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Section>

      {/* Feedback states */}
      <Section title="Feedback / Loading">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <Label>Skeleton</Label>
            <Skeleton className="mt-2 h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </Card>
          <Card>
            <Label>Spinner</Label>
            <div className="mt-3 flex items-center gap-3 text-inkSoft">
              <Spinner size={18} />
              <span className="text-sm">Carregando dados…</span>
            </div>
          </Card>
        </div>
        <div className="mt-3">
          <EmptyState
            icon="course"
            title="Você ainda não tem cursos"
            description="Crie o primeiro pra começar a montar aulas, atividades e quizzes."
            action={<Button icon="plus">Novo curso</Button>}
          />
        </div>
      </Section>

      {/* Modal */}
      <Section title="Modal">
        <Button variant="soft" onClick={modal.onOpen}>
          Abrir modal
        </Button>
        <Modal
          open={modal.open}
          onClose={modal.onClose}
          title="Criar primeira filial"
          description="Você é o OWNER, então pode criar agora."
          footer={
            <>
              <Button variant="ghost" onClick={modal.onClose}>
                Cancelar
              </Button>
              <Button onClick={modal.onClose}>Criar filial</Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Input label="Nome" placeholder="Cursinho Centro" required />
            <Input label="Slug" placeholder="cursinho-centro" required />
          </div>
        </Modal>
      </Section>

      {/* Ícones */}
      <Section title="Ícones (lucide-react)">
        <div className="flex flex-wrap gap-3 text-inkSoft">
          {(
            [
              "book",
              "people",
              "play",
              "quiz",
              "clip",
              "sparkle",
              "course",
              "lesson",
              "exam",
              "branch",
              "flame",
              "heart",
              "drag",
              "settings",
              "logout",
            ] as const
          ).map((name) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-3 py-1 text-xs">
              <Icon name={name} size={14} />
              {name}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-xs uppercase tracking-wider text-inkMuted">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
