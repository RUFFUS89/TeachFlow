// Screen 2: Course detail — lesson/quiz sequence with drag handles.

function CourseDetailScreen() {
  const t = useT();

  const items = [
    { kind: 'lesson', title: 'Boas-vindas e plano do curso', dur: '8 min', tone: 'peach', status: 'pub' },
    { kind: 'lesson', title: 'O que é uma dissertação argumentativa', dur: '22 min', tone: 'peach', status: 'pub' },
    { kind: 'quiz', title: 'Quiz rápido — estrutura do texto', dur: '5 perguntas', tone: 'sage', status: 'pub' },
    { kind: 'lesson', title: 'Tese: como definir e defender', dur: '18 min', tone: 'peach', status: 'pub' },
    { kind: 'lesson', title: 'Repertório sociocultural produtivo', dur: '25 min', tone: 'peach', status: 'pub' },
    { kind: 'activity', title: 'Atividade — esboço de redação', dur: 'Prazo 24/04', tone: 'caramel', status: 'pub' },
    { kind: 'lesson', title: 'Conectivos e coesão textual', dur: '14 min', tone: 'peach', status: 'draft' },
    { kind: 'quiz', title: 'Quiz — coesão e concordância', dur: '8 perguntas', tone: 'sage', status: 'draft' },
  ];

  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      {/* Breadcrumb top */}
      <div style={{
        padding: '18px 32px 0',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted,
      }}>
        <span>Minhas aulas</span>
        <Icon name="chev" size={12} color={t.c.inkMuted} />
        <span style={{ color: t.c.ink, fontWeight: 500 }}>Redação para o ENEM</span>
      </div>

      {/* Course hero */}
      <div style={{ padding: '16px 32px 24px' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: t.c.accent, borderRadius: t.r.card * 1.3,
          padding: '28px 32px',
          display: 'flex', gap: 24,
        }}>
          <div style={{ position: 'absolute', right: -80, top: -100, opacity: 0.85 }}>
            <Blob color={t.c.blush} size={320} />
          </div>
          <div style={{ position: 'absolute', right: 140, bottom: -80, opacity: 0.55 }}>
            <Blob color={t.c.butter} size={180} />
          </div>

          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Chip tone="ink" size="sm">ATIVO</Chip>
              <Chip tone="neutral" size="sm">Turma 3º ano · noturno</Chip>
            </div>
            <h1 style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight,
              fontSize: 36, color: t.c.accentInk, letterSpacing: -0.8,
              lineHeight: 1.05, margin: 0, marginBottom: 8,
            }}>Redação para o ENEM</h1>
            <p style={{
              fontFamily: t.f.body, fontSize: 14, color: t.c.accentInk,
              opacity: 0.82, lineHeight: 1.5, margin: 0,
              maxWidth: 540,
            }}>
              Técnicas de argumentação, repertório sociocultural e estrutura dissertativa —
              do esqueleto à lapidação do texto final.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <TButton variant="primary" size="md" icon={<Icon name="plus" size={14} />}>
                Adicionar conteúdo
              </TButton>
              <TButton variant="ghost" size="md"
                style={{ background: 'rgba(255,255,255,0.5)', borderColor: 'transparent', color: t.c.accentInk }}
                icon={<Icon name="eye" size={14} />}>
                Ver como aluno
              </TButton>
            </div>
          </div>

          {/* Right metrics card */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: t.c.surface, borderRadius: t.r.card,
            padding: 20, minWidth: 260,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {[
              { l: 'Alunos matriculados', v: '42', ic: 'people' },
              { l: 'Itens no curso', v: '24 + 6 quizzes', ic: 'book' },
              { l: 'Conclusão média', v: '72%', ic: 'sparkle' },
            ].map(m => (
              <div key={m.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: t.c.surface2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={m.ic} size={16} color={t.c.inkSoft} />
                </div>
                <div>
                  <div style={{ fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted }}>{m.l}</div>
                  <div style={{
                    fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 18,
                    color: t.c.ink, letterSpacing: -0.3,
                  }}>{m.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '0 32px', borderBottom: `1px solid ${t.c.borderSoft}`,
        display: 'flex', gap: 24,
      }}>
        {['Conteúdo', 'Alunos', 'Entregas', 'Relatório', 'Configurações'].map((tab, i) => (
          <div key={tab} style={{
            padding: '14px 0',
            fontFamily: t.f.body, fontSize: 13.5, fontWeight: i === 0 ? 600 : 500,
            color: i === 0 ? t.c.ink : t.c.inkMuted,
            borderBottom: `2px solid ${i === 0 ? t.c.ink : 'transparent'}`,
            cursor: 'pointer', marginBottom: -1,
          }}>
            {tab} {i === 2 && <span style={{
              background: t.c.accent, color: t.c.accentInk,
              padding: '1px 6px', borderRadius: 999, fontSize: 10,
              marginLeft: 5,
            }}>7</span>}
          </div>
        ))}
      </div>

      {/* Sequence */}
      <div style={{ padding: '24px 32px 40px', display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', marginBottom: 14,
          }}>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight,
              fontSize: 20, color: t.c.ink, letterSpacing: -0.3,
            }}>Sequência do curso</div>
            <span style={{
              fontFamily: t.f.body, fontSize: 12.5, color: t.c.inkMuted, marginLeft: 10,
            }}>Arraste para reordenar</span>
            <div style={{ flex: 1 }} />
            <TButton variant="ghost" size="sm" icon={<Icon name="plus" size={13} />}>
              Aula
            </TButton>
            <div style={{ width: 6 }} />
            <TButton variant="ghost" size="sm" icon={<Icon name="plus" size={13} />}>
              Quiz
            </TButton>
            <div style={{ width: 6 }} />
            <TButton variant="ghost" size="sm" icon={<Icon name="plus" size={13} />}>
              Atividade
            </TButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, idx) => (
              <SequenceItem key={idx} item={it} idx={idx} />
            ))}
          </div>
        </div>

        {/* Right column: activity log */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <Card padding={18}>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight,
              fontSize: 16, color: t.c.ink, marginBottom: 14, letterSpacing: -0.2,
            }}>Atividade recente</div>
            {[
              { n: 'Laura Mendes', a: 'entregou', o: 'Esboço de redação', t: 'agora' },
              { n: 'Pedro Dias', a: 'concluiu', o: 'Quiz — estrutura', t: '12 min' },
              { n: 'Sofia Lemos', a: 'comentou', o: 'Aula 2', t: '1h' },
              { n: 'Ana Ribeiro', a: 'entregou', o: 'Esboço de redação', t: '2h' },
              { n: 'Matheus Sá', a: 'concluiu', o: 'Aula 3', t: 'ontem' },
            ].map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 0',
                borderTop: i > 0 ? `1px solid ${t.c.borderSoft}` : 'none',
              }}>
                <Avatar name={e.n} size={28} tone={i % 6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.f.body, fontSize: 12.5, color: t.c.ink, lineHeight: 1.35,
                  }}>
                    <span style={{ fontWeight: 600 }}>{e.n}</span>{' '}
                    <span style={{ color: t.c.inkMuted }}>{e.a}</span>{' '}
                    <span style={{ fontWeight: 500 }}>{e.o}</span>
                  </div>
                  <div style={{
                    fontFamily: t.f.mono, fontSize: 10.5, color: t.c.inkMuted,
                    letterSpacing: 0.4, marginTop: 2,
                  }}>{e.t}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SequenceItem({ item, idx }) {
  const t = useT();
  const icons = { lesson: 'play', quiz: 'quiz', activity: 'clip' };
  const labels = { lesson: 'Aula', quiz: 'Quiz', activity: 'Atividade' };
  const bg = t.c[item.tone];
  const fg = t.c[item.tone + 'Ink'];
  const isDraft = item.status === 'draft';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: t.c.surface, border: `1px solid ${t.c.border}`,
      borderRadius: t.r.card,
      opacity: isDraft ? 0.78 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: t.c.inkMuted, cursor: 'grab',
      }}>
        <Icon name="grip" size={14} color={t.c.inkMuted} />
      </div>
      <div style={{
        fontFamily: t.f.mono, fontSize: 11, fontWeight: 600, color: t.c.inkMuted,
        minWidth: 22, textAlign: 'center',
      }}>{String(idx + 1).padStart(2, '0')}</div>
      <div style={{
        width: 40, height: 40, borderRadius: t.r.chip,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icons[item.kind]} size={17} color={fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{
            fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.2,
            color: fg, textTransform: 'uppercase', fontWeight: 600,
          }}>{labels[item.kind]}</span>
          {isDraft && (
            <span style={{
              fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.2,
              color: t.c.inkMuted, textTransform: 'uppercase', fontWeight: 600,
            }}>· Rascunho</span>
          )}
        </div>
        <div style={{
          fontFamily: t.f.body, fontSize: 14.5, fontWeight: 600,
          color: t.c.ink, letterSpacing: -0.1,
        }}>{item.title}</div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: t.f.body, fontSize: 12, color: t.c.inkMuted,
      }}>
        <Icon name="clock" size={12} color={t.c.inkMuted} />
        {item.dur}
      </div>
      <div style={{
        display: 'flex', gap: 4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: t.r.chip, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.c.inkMuted,
        }}>
          <Icon name="edit" size={14} color={t.c.inkMuted} />
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: t.r.chip, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.c.inkMuted,
        }}>
          <Icon name="dots" size={14} color={t.c.inkMuted} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CourseDetailScreen });
