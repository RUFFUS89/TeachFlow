// Screen 3: Lesson player (aluno/professor preview) + tabs.

function LessonScreen() {
  const t = useT();
  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      {/* Breadcrumb */}
      <div style={{
        padding: '18px 32px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted,
      }}>
        <span>Redação para o ENEM</span>
        <Icon name="chev" size={12} color={t.c.inkMuted} />
        <span>Conteúdo</span>
        <Icon name="chev" size={12} color={t.c.inkMuted} />
        <span style={{ color: t.c.ink, fontWeight: 500 }}>Aula 03 — Tese e defesa</span>
        <div style={{ flex: 1 }} />
        <TButton variant="ghost" size="sm" icon={<Icon name="eye" size={13} />}>Pré-visualizar</TButton>
      </div>

      <div style={{ padding: '0 32px 40px', display: 'flex', gap: 24 }}>
        {/* Left: player + content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Video player */}
          <div style={{
            position: 'relative', borderRadius: t.r.card * 1.3, overflow: 'hidden',
            background: t.c.ink, aspectRatio: '16 / 9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at 30% 40%, ${t.c.accent}44 0%, transparent 55%), radial-gradient(circle at 75% 65%, ${t.c.sage}55 0%, transparent 60%)`,
            }} />
            <div style={{
              position: 'relative', zIndex: 1,
              width: 76, height: 76, borderRadius: '50%',
              background: t.c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <Icon name="play" size={28} color={t.c.ink} />
            </div>
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
              padding: '6px 12px', borderRadius: t.r.pill,
              fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.4,
              color: t.c.bg, fontWeight: 600, textTransform: 'uppercase',
            }}>YouTube · 18:42</div>
            <div style={{
              position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 6,
            }}>
              {['1x', 'cc', 'hd'].map(k => (
                <div key={k} style={{
                  padding: '6px 10px', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
                  borderRadius: t.r.chip, color: t.c.bg,
                  fontFamily: t.f.mono, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                }}>{k}</div>
              ))}
            </div>
          </div>

          {/* Title and actions */}
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                color: t.c.accentInk, fontWeight: 600, marginBottom: 6,
              }}>Aula 03 · Módulo 1</div>
              <h1 style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                fontSize: 30, color: t.c.ink, letterSpacing: -0.6,
                margin: 0, lineHeight: 1.1,
              }}>Tese: como definir e defender uma posição</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                <Chip tone="peach" size="sm"><Icon name="clock" size={11} />18 min</Chip>
                <Chip tone="sage" size="sm">Essencial</Chip>
                <div style={{ fontFamily: t.f.body, fontSize: 12, color: t.c.inkMuted }}>
                  Atualizado há 3 dias · 38 alunos visualizaram
                </div>
              </div>
            </div>
            <TButton variant="ghost" size="sm" icon={<Icon name="heart" size={13} />}>Favoritar</TButton>
            <TButton variant="primary" size="sm" icon={<Icon name="arrow" size={13} />}>Próxima aula</TButton>
          </div>

          {/* Tabs */}
          <div style={{
            marginTop: 24,
            borderBottom: `1px solid ${t.c.borderSoft}`,
            display: 'flex', gap: 22,
          }}>
            {['Descrição', 'Materiais', 'Comentários (12)', 'Transcrição'].map((tab, i) => (
              <div key={tab} style={{
                padding: '12px 0',
                fontFamily: t.f.body, fontSize: 13.5, fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? t.c.ink : t.c.inkMuted,
                borderBottom: `2px solid ${i === 0 ? t.c.accentInk : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1,
              }}>{tab}</div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginTop: 20, maxWidth: 680 }}>
            <p style={{
              fontFamily: t.f.body, fontSize: 15, color: t.c.inkSoft,
              lineHeight: 1.65, margin: 0, marginBottom: 14,
            }}>
              Nesta aula, vamos destrinchar um dos pilares da dissertação: a <strong>tese</strong>.
              Você vai aprender a construir uma posição clara, defensível e que sustente
              três parágrafos de argumentação sem desabar no meio do caminho.
            </p>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight,
              fontSize: 17, color: t.c.ink, margin: '20px 0 10px', letterSpacing: -0.2,
            }}>Nesta aula você vai aprender</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Como distinguir tese de tema e de tópico frasal.',
                'Três técnicas para afiar uma tese genérica.',
                'O teste do “e daí?” — um atalho para saber se sua tese aguenta o texto inteiro.',
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: t.c.sage, color: t.c.sageInk, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}>
                    <Icon name="check" size={11} color={t.c.sageInk} strokeWidth={2.5} />
                  </div>
                  <div style={{
                    fontFamily: t.f.body, fontSize: 14, color: t.c.inkSoft, lineHeight: 1.5,
                  }}>{p}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: lesson list */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <Card padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                fontSize: 16, color: t.c.ink, letterSpacing: -0.2,
              }}>Neste curso</div>
              <div style={{ flex: 1 }} />
              <span style={{
                fontFamily: t.f.mono, fontSize: 11, color: t.c.inkMuted,
              }}>3 / 24</span>
            </div>
            <div style={{
              height: 4, borderRadius: 999, background: t.c.surfaceSunken, marginBottom: 14,
            }}>
              <div style={{ width: '42%', height: '100%', background: t.c.sageInk, borderRadius: 999 }} />
            </div>
            {[
              { n: 1, t: 'Boas-vindas e plano do curso', d: '8 min', k: 'lesson', done: true },
              { n: 2, t: 'O que é uma dissertação', d: '22 min', k: 'lesson', done: true },
              { n: 3, t: 'Quiz — estrutura do texto', d: '5 perguntas', k: 'quiz', done: true },
              { n: 4, t: 'Tese e defesa', d: '18 min', k: 'lesson', current: true },
              { n: 5, t: 'Repertório sociocultural', d: '25 min', k: 'lesson' },
              { n: 6, t: 'Atividade — esboço', d: 'Prazo 24/04', k: 'activity' },
              { n: 7, t: 'Conectivos e coesão', d: '14 min', k: 'lesson' },
            ].map(l => (
              <div key={l.n} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 10px', borderRadius: t.r.chip,
                background: l.current ? t.c.accent : 'transparent',
                marginBottom: 2,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: l.done ? t.c.sage : (l.current ? t.c.surface : t.c.surfaceSunken),
                  color: l.done ? t.c.sageInk : t.c.inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.f.mono, fontSize: 10, fontWeight: 700,
                }}>
                  {l.done ? <Icon name="check" size={11} color={t.c.sageInk} strokeWidth={2.8} />
                    : (l.k === 'quiz' ? <Icon name="quiz" size={10} color={t.c.inkSoft} />
                    : l.k === 'activity' ? <Icon name="clip" size={10} color={t.c.inkSoft} />
                    : l.n)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.f.body, fontSize: 12.5,
                    fontWeight: l.current ? 600 : 500,
                    color: l.current ? t.c.accentInk : (l.done ? t.c.inkMuted : t.c.ink),
                    lineHeight: 1.3,
                    textDecoration: l.done ? 'line-through' : 'none',
                  }}>{l.t}</div>
                  <div style={{
                    fontFamily: t.f.mono, fontSize: 10.5, color: l.current ? t.c.accentInk : t.c.inkMuted,
                    opacity: l.current ? 0.7 : 1, marginTop: 1,
                  }}>{l.d}</div>
                </div>
                {l.current && <Icon name="play" size={11} color={t.c.accentInk} />}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LessonScreen });
