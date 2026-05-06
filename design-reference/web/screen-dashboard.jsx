// Screen 1: Professor dashboard (Minhas aulas)
// Cozy landing — warm header, stat tiles, course cards with blob decoration.

function DashboardScreen() {
  const t = useT();

  const stats = [
    { label: 'Aulas ativas', value: '12', delta: '+2 este mês', icon: 'book', tone: 'peach' },
    { label: 'Alunos matriculados', value: '184', delta: '+18 novos', icon: 'people', tone: 'sage' },
    { label: 'Entregas pendentes', value: '7', delta: 'avaliar hoje', icon: 'clip', tone: 'caramel' },
    { label: 'Taxa de conclusão', value: '87%', delta: '+4% vs. mês passado', icon: 'sparkle', tone: 'lilac' },
  ];

  const courses = [
    {
      title: 'Redação para o ENEM',
      desc: 'Técnicas de argumentação, repertório sociocultural e estrutura dissertativa.',
      tone: 'peach', lessons: 24, quizzes: 6, students: 42, progress: 72,
      tag: 'Em andamento',
    },
    {
      title: 'Literatura Brasileira — Modernismo',
      desc: 'Das Semanas de 22 à geração de 45. Leituras comentadas e análises.',
      tone: 'sage', lessons: 18, quizzes: 4, students: 36, progress: 48,
      tag: 'Em andamento',
    },
    {
      title: 'Gramática viva',
      desc: 'Sintaxe, regência e concordância com exemplos do cotidiano.',
      tone: 'caramel', lessons: 32, quizzes: 12, students: 58, progress: 91,
      tag: 'Finalizando',
    },
    {
      title: 'Oficina de escrita criativa',
      desc: 'Contos, crônicas e ensaios pessoais. Feedback individual por aluno.',
      tone: 'lilac', lessons: 9, quizzes: 2, students: 24, progress: 22,
      tag: 'Nova',
    },
    {
      title: 'Interpretação de textos',
      desc: 'Leitura atenta, inferências e estratégias para provas objetivas.',
      tone: 'butter', lessons: 16, quizzes: 8, students: 24, progress: 64,
      tag: 'Em andamento',
    },
    {
      title: 'Reescrita e revisão',
      desc: 'Ateliê prático: cada aluno reescreve um texto por semana.',
      tone: 'blush', lessons: 6, quizzes: 0, students: 0, progress: 0,
      tag: 'Rascunho',
    },
  ];

  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      <TopBar title="Bom dia, Beatriz ✿" subtitle="Painel do professor">
        <TButton variant="ghost" size="sm" icon={<Icon name="filter" size={14} />}>
          Filtros
        </TButton>
      </TopBar>

      {/* Hero strip */}
      <div style={{ padding: '28px 32px 8px', position: 'relative' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: t.c.accent,
          borderRadius: t.r.card * 1.4,
          padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ position: 'absolute', right: -60, top: -80, opacity: 0.9 }}>
            <Blob color={t.c.sage} size={280} />
          </div>
          <div style={{ position: 'absolute', right: 110, bottom: -60, opacity: 0.7 }}>
            <Blob color={t.c.butter} size={160} />
          </div>
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 11,
              color: t.c.accentInk, opacity: 0.7,
              letterSpacing: 1.6, textTransform: 'uppercase',
              marginBottom: 8,
            }}>Hoje, quinta — 17 de abril</div>
            <h1 style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight,
              fontSize: 34, color: t.c.accentInk,
              letterSpacing: -0.8, lineHeight: 1.1, margin: 0,
              maxWidth: 560,
            }}>
              Você tem <em style={{ fontStyle: 'italic' }}>3 aulas</em> agendadas
              e <em style={{ fontStyle: 'italic' }}>7 entregas</em> aguardando correção.
            </h1>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <TButton variant="primary" size="md" icon={<Icon name="play" size={14} />}>
                Continuar última aula
              </TButton>
              <TButton variant="ghost" size="md"
                style={{ background: 'rgba(255,255,255,0.5)', borderColor: 'transparent', color: t.c.accentInk }}>
                Ver agenda da semana
              </TButton>
            </div>
          </div>

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', gap: 8,
            background: t.c.surface, borderRadius: t.r.card,
            padding: 18, minWidth: 260,
            border: `1px solid rgba(255,255,255,0.8)`,
          }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10,
              color: t.c.inkMuted, letterSpacing: 1.4, textTransform: 'uppercase',
            }}>Próxima aula</div>
            <div style={{
              fontFamily: t.f.display, fontSize: 18, color: t.c.ink,
              fontWeight: t.f.displayWeight, letterSpacing: -0.3, lineHeight: 1.2,
            }}>A dissertação argumentativa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.c.inkMuted }}>
              <Icon name="clock" size={13} color={t.c.inkMuted} />
              <span style={{ fontFamily: t.f.body, fontSize: 12 }}>14:00 — 15:30</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: -6, marginTop: 8,
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <Avatar name={`Aluno ${i}`} size={24} tone={i} />
                </div>
              ))}
              <span style={{
                marginLeft: 10,
                fontFamily: t.f.body, fontSize: 12, color: t.c.inkMuted,
              }}>+38 alunos inscritos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        padding: '20px 32px 8px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
      }}>
        {stats.map((s) => {
          const bg = t.c[s.tone] || t.c.accent;
          const fg = t.c[s.tone + 'Ink'] || t.c.accentInk;
          return (
            <div key={s.label} style={{
              background: t.c.surface, border: `1px solid ${t.c.border}`,
              borderRadius: t.r.card, padding: 18, position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: bg, color: fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icon name={s.icon} size={16} color={fg} />
              </div>
              <div style={{
                fontFamily: t.f.body, fontSize: 12, color: t.c.inkMuted, fontWeight: 500,
              }}>{s.label}</div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                fontSize: 28, color: t.c.ink, letterSpacing: -0.8, lineHeight: 1.1,
                marginTop: 2,
              }}>{s.value}</div>
              <div style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted,
              }}>
                <Icon name="up" size={11} color={fg} />
                {s.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Courses header */}
      <div style={{
        padding: '28px 32px 14px',
        display: 'flex', alignItems: 'baseline', gap: 12,
      }}>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 22, color: t.c.ink, letterSpacing: -0.3,
        }}>Suas aulas</div>
        <div style={{
          fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted,
        }}>6 cursos ativos · última edição há 2 dias</div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', gap: 4,
          background: t.c.surface, border: `1px solid ${t.c.borderSoft}`,
          borderRadius: t.r.pill, padding: 3,
        }}>
          {['Todas', 'Ativas', 'Rascunhos'].map((k, i) => (
            <div key={k} style={{
              padding: '5px 12px',
              background: i === 0 ? t.c.ink : 'transparent',
              color: i === 0 ? t.c.bg : t.c.inkSoft,
              borderRadius: t.r.pill,
              fontFamily: t.f.body, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>{k}</div>
          ))}
        </div>
        <TButton variant="primary" size="md" icon={<Icon name="plus" size={14} />}>
          Nova aula
        </TButton>
      </div>

      {/* Course grid */}
      <div style={{
        padding: '0 32px 40px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
      }}>
        {courses.map((c, i) => (
          <CourseCard key={c.title} course={c} index={i} />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course, index }) {
  const t = useT();
  const bg = t.c[course.tone] || t.c.accent;
  const fg = t.c[course.tone + 'Ink'] || t.c.accentInk;

  return (
    <div style={{
      background: t.c.surface, border: `1px solid ${t.c.border}`,
      borderRadius: t.r.card, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Banner */}
      <div style={{
        height: 128, position: 'relative', overflow: 'hidden',
        background: bg,
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40 }}>
          <Blob color={`${bg}`} size={180} style={{ opacity: 0.5, filter: 'brightness(0.85)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: -30, left: -20 }}>
          <Blob color={t.c.surface} size={120} style={{ opacity: 0.3 }} />
        </div>
        <div style={{
          position: 'absolute', top: 14, left: 14,
          display: 'flex', gap: 6,
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.75)', color: fg,
            padding: '3px 10px', borderRadius: 999,
            fontFamily: t.f.mono, fontSize: 10, fontWeight: 600,
            letterSpacing: 1, textTransform: 'uppercase',
          }}>{course.tag}</span>
        </div>
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon name="dots" size={14} color={fg} />
        </div>
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          background: t.c.surface,
          padding: '6px 10px 6px 6px', borderRadius: t.r.pill,
        }}>
          <Ring value={course.progress} size={22} stroke={3} color={fg} track={t.c.surface2} />
          <span style={{
            fontFamily: t.f.mono, fontSize: 11, fontWeight: 600, color: t.c.inkSoft,
          }}>{course.progress}%</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 18, color: t.c.ink, letterSpacing: -0.3,
          lineHeight: 1.2, marginBottom: 6,
        }}>{course.title}</div>
        <div style={{
          fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted,
          lineHeight: 1.4, marginBottom: 14, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{course.desc}</div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          paddingTop: 12,
          borderTop: `1px solid ${t.c.borderSoft}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: t.c.inkSoft }}>
            <Icon name="play" size={12} color={t.c.inkMuted} />
            <span style={{ fontFamily: t.f.body, fontSize: 12, fontWeight: 500 }}>{course.lessons}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: t.c.inkSoft }}>
            <Icon name="quiz" size={12} color={t.c.inkMuted} />
            <span style={{ fontFamily: t.f.body, fontSize: 12, fontWeight: 500 }}>{course.quizzes}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: t.c.inkSoft }}>
            <Icon name="people" size={12} color={t.c.inkMuted} />
            <span style={{ fontFamily: t.f.body, fontSize: 12, fontWeight: 500 }}>{course.students}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: t.f.body, fontSize: 12, fontWeight: 600, color: t.c.ink,
            cursor: 'pointer',
          }}>
            Abrir
            <Icon name="chev" size={12} color={t.c.ink} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
