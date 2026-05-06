// Mobile screens for TeachFlow — inside iOS device frame.
// Uses PALETTES/FONT_SYSTEMS/RADII via the TweakContext so theme tokens sync
// with the desktop canvas.

function MobileFrame({ label, dark = false, title, children, width = 402, height = 874 }) {
  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8,
          fontSize: 12, fontWeight: 500, color: 'rgba(60,50,40,0.7)',
          whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
      <IOSDevice width={width} height={height} dark={dark} title={title}>
        {children}
      </IOSDevice>
    </div>
  );
}

function MBody({ children, style = {} }) {
  const t = useT();
  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative', ...style }}>
      {t.texture && <PaperBg opacity={0.3} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

function MTabBar({ active }) {
  const t = useT();
  const items = [
    { id: 'home', icon: 'home', l: 'Início' },
    { id: 'courses', icon: 'book', l: 'Cursos' },
    { id: 'tasks', icon: 'clip', l: 'Tarefas' },
    { id: 'profile', icon: 'smile', l: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 34,
      paddingTop: 8,
      background: t.c.surface,
      borderTop: `1px solid ${t.c.borderSoft}`,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(i => {
        const on = i.id === active;
        return (
          <div key={i.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 14px', borderRadius: 14,
            background: on ? t.c.accent : 'transparent',
          }}>
            <Icon name={i.icon} size={20} color={on ? t.c.accentInk : t.c.inkMuted} />
            <span style={{
              fontFamily: t.f.body, fontSize: 10.5, fontWeight: 600,
              color: on ? t.c.accentInk : t.c.inkMuted,
            }}>{i.l}</span>
          </div>
        );
      })}
    </div>
  );
}

// 1) Mobile home (aluno)
function MHome() {
  const t = useT();
  return (
    <MBody>
      <div style={{ padding: '60px 20px 10px' }}>
        <div style={{
          fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
          color: t.c.inkMuted, fontWeight: 600,
        }}>Quinta · 17 abr</div>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 30, color: t.c.ink, letterSpacing: -0.8, lineHeight: 1.1,
          marginTop: 4,
        }}>Bom dia, Laura ✿</div>

        {/* Continue */}
        <div style={{
          marginTop: 18, borderRadius: 22,
          background: t.c.accent, padding: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -60, opacity: 0.7 }}>
            <Blob color={t.c.butter} size={170} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14, background: t.c.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="play" size={22} color={t.c.bg} />
            </div>
            <div>
              <div style={{
                fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase',
                color: t.c.accentInk, opacity: 0.8, fontWeight: 600,
              }}>Continue</div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 17,
                color: t.c.accentInk, letterSpacing: -0.3, lineHeight: 1.15, marginTop: 2,
              }}>Tese: defender uma posição</div>
              <div style={{
                fontFamily: t.f.body, fontSize: 11.5, color: t.c.accentInk, opacity: 0.75,
                marginTop: 4,
              }}>restam 12 min · aula 3/24</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { l: 'Streak', v: '14', sub: 'dias', tone: 'sage' },
            { l: 'Nota média', v: '8.4', sub: 'últimas 4', tone: 'caramel' },
          ].map(s => (
            <div key={s.l} style={{
              padding: 14, borderRadius: 16, background: t.c[s.tone],
            }}>
              <div style={{ fontFamily: t.f.body, fontSize: 11, color: t.c[s.tone + 'Ink'], opacity: 0.8, fontWeight: 500 }}>{s.l}</div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 24,
                color: t.c[s.tone + 'Ink'], letterSpacing: -0.5, marginTop: 2,
              }}>{s.v}</div>
              <div style={{ fontFamily: t.f.mono, fontSize: 10, color: t.c[s.tone + 'Ink'], opacity: 0.65, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* My courses */}
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 18, color: t.c.ink, letterSpacing: -0.3, marginTop: 22, marginBottom: 10,
        }}>Meus cursos</div>

        {[
          { t: 'Redação para o ENEM', p: 42, tone: 'peach', next: 'Tese e defesa' },
          { t: 'Gramática viva', p: 78, tone: 'caramel', next: 'Regência verbal' },
          { t: 'Literatura — Modernismo', p: 18, tone: 'lilac', next: 'Oswald de Andrade' },
        ].map((c, i) => (
          <div key={i} style={{
            background: t.c.surface, border: `1px solid ${t.c.border}`,
            borderRadius: 16, padding: 12, display: 'flex', gap: 12, marginBottom: 8,
            alignItems: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: t.c[c.tone],
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="book" size={18} color={t.c[c.tone + 'Ink']} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.f.body, fontSize: 14, fontWeight: 600, color: t.c.ink, lineHeight: 1.2 }}>{c.t}</div>
              <div style={{ fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted, marginTop: 3 }}>
                próxima · {c.next}
              </div>
              <div style={{ height: 4, borderRadius: 999, background: t.c.surfaceSunken, marginTop: 6 }}>
                <div style={{ width: `${c.p}%`, height: '100%', borderRadius: 999, background: t.c.ink }} />
              </div>
            </div>
            <Icon name="chev" size={14} color={t.c.inkMuted} />
          </div>
        ))}
        <div style={{ height: 90 }} />
      </div>
      <MTabBar active="home" />
    </MBody>
  );
}

// 2) Mobile lesson player
function MLesson() {
  const t = useT();
  return (
    <MBody>
      {/* Video */}
      <div style={{
        paddingTop: 54,
        background: t.c.ink, height: 230, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: '54px 0 0 0',
          background: `radial-gradient(circle at 30% 50%, ${t.c.accent}55 0%, transparent 55%), radial-gradient(circle at 75% 55%, ${t.c.sage}55 0%, transparent 60%)`,
        }} />
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: t.c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <Icon name="play" size={22} color={t.c.ink} />
        </div>
        <div style={{
          position: 'absolute', bottom: 10, left: 16, right: 16,
          display: 'flex', alignItems: 'center', gap: 8, color: t.c.bg,
        }}>
          <span style={{ fontFamily: t.f.mono, fontSize: 11, fontWeight: 600 }}>06:12</span>
          <div style={{ flex: 1, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.25)' }}>
            <div style={{ width: '34%', height: '100%', background: t.c.bg, borderRadius: 999 }} />
          </div>
          <span style={{ fontFamily: t.f.mono, fontSize: 11, opacity: 0.7 }}>18:42</span>
        </div>
      </div>

      <div style={{ padding: '18px 20px 100px' }}>
        <div style={{
          fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
          color: t.c.accentInk, fontWeight: 600,
        }}>Aula 03 · Módulo 1</div>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 22, color: t.c.ink, letterSpacing: -0.4, lineHeight: 1.15, marginTop: 4,
        }}>Tese: como defender uma posição</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Chip tone="peach" size="sm"><Icon name="clock" size={11} />18 min</Chip>
          <Chip tone="sage" size="sm">Essencial</Chip>
        </div>

        {/* Tabs */}
        <div style={{
          marginTop: 18, display: 'flex', gap: 16,
          borderBottom: `1px solid ${t.c.borderSoft}`,
        }}>
          {['Descrição', 'Materiais', 'Comentários'].map((x, i) => (
            <div key={x} style={{
              padding: '10px 0', fontFamily: t.f.body, fontSize: 13,
              fontWeight: i === 0 ? 600 : 500,
              color: i === 0 ? t.c.ink : t.c.inkMuted,
              borderBottom: `2px solid ${i === 0 ? t.c.accentInk : 'transparent'}`,
              marginBottom: -1,
            }}>{x}</div>
          ))}
        </div>

        <p style={{
          marginTop: 14, fontFamily: t.f.body, fontSize: 14, color: t.c.inkSoft, lineHeight: 1.55,
        }}>
          Nesta aula, vamos destrinchar um dos pilares da dissertação: a <strong>tese</strong>.
          Você vai aprender a construir uma posição clara e defensável.
        </p>

        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 15, color: t.c.ink, letterSpacing: -0.2, marginTop: 14, marginBottom: 8,
        }}>Você vai aprender</div>

        {[
          'Distinguir tese de tema e tópico frasal',
          'Três técnicas para afiar uma tese',
          'O teste do "e daí?" — validar sua posição',
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: t.c.sage, color: t.c.sageInk,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
            }}>
              <Icon name="check" size={10} color={t.c.sageInk} strokeWidth={3} />
            </div>
            <div style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.inkSoft, lineHeight: 1.45 }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 34,
        padding: '12px 20px 14px',
        background: `linear-gradient(to top, ${t.c.bg} 70%, ${t.c.bg}00)`,
        display: 'flex', gap: 10,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: t.c.surface, border: `1px solid ${t.c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="heart" size={16} color={t.c.inkSoft} />
        </div>
        <div style={{ flex: 1 }}>
          <TButton variant="primary" size="lg" full icon={<Icon name="arrow" size={14} />}>
            Próxima aula
          </TButton>
        </div>
      </div>
    </MBody>
  );
}

// 3) Mobile activities / tasks
function MTasks() {
  const t = useT();
  const tasks = [
    { t: 'Esboço de redação', c: 'Redação para o ENEM', d: 'amanhã', tone: 'blush', status: 'due' },
    { t: 'Quiz — estrutura', c: 'Redação para o ENEM', d: '25/04', tone: 'sage', status: 'todo' },
    { t: 'Reescrita semanal', c: 'Oficina de escrita', d: '28/04', tone: 'butter', status: 'todo' },
    { t: 'Leitura: Oswald', c: 'Literatura — Modernismo', d: 'concluída', tone: 'neutral', status: 'done' },
  ];
  return (
    <MBody>
      <div style={{ padding: '60px 20px 100px' }}>
        <div style={{
          fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
          color: t.c.inkMuted, fontWeight: 600,
        }}>Suas entregas</div>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 30, color: t.c.ink, letterSpacing: -0.8, lineHeight: 1.1, marginTop: 4,
        }}>Tarefas</div>

        {/* Summary pill */}
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 18,
          background: t.c.caramel, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, bottom: -40, opacity: 0.55 }}>
            <Blob color={t.c.butter} size={130} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase',
              color: t.c.caramelInk, opacity: 0.75, fontWeight: 600,
            }}>Próxima entrega</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
              color: t.c.caramelInk, letterSpacing: -0.4, marginTop: 3,
            }}>Esboço de redação</div>
            <div style={{ fontFamily: t.f.body, fontSize: 12, color: t.c.caramelInk, opacity: 0.85, marginTop: 4 }}>
              Prazo amanhã, 18:00 · Prof. Beatriz
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16, overflowX: 'auto' }}>
          {['Todas', 'A fazer', 'Entregues', 'Corrigidas'].map((k, i) => (
            <div key={k} style={{
              padding: '6px 12px',
              background: i === 0 ? t.c.ink : t.c.surface,
              border: `1px solid ${i === 0 ? t.c.ink : t.c.borderSoft}`,
              color: i === 0 ? t.c.bg : t.c.inkSoft,
              borderRadius: 999,
              fontFamily: t.f.body, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{k}</div>
          ))}
        </div>

        {/* List */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((x, i) => {
            const isDone = x.status === 'done';
            const tone = x.tone === 'neutral' ? 'surface2' : x.tone;
            const bg = x.tone === 'neutral' ? t.c.surface2 : t.c[x.tone];
            const fg = x.tone === 'neutral' ? t.c.inkSoft : t.c[x.tone + 'Ink'];
            return (
              <div key={i} style={{
                background: t.c.surface, border: `1px solid ${t.c.border}`,
                borderRadius: 16, padding: 14, display: 'flex', gap: 12,
                opacity: isDone ? 0.6 : 1, alignItems: 'center',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name={isDone ? 'check' : 'clip'} size={16} color={fg} strokeWidth={isDone ? 3 : 1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.f.body, fontSize: 14, fontWeight: 600, color: t.c.ink,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>{x.t}</div>
                  <div style={{ fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted, marginTop: 2 }}>
                    {x.c}
                  </div>
                </div>
                <div style={{
                  fontFamily: t.f.mono, fontSize: 11, fontWeight: 600,
                  color: x.status === 'due' ? t.c.blushInk : t.c.inkMuted,
                  textTransform: 'uppercase', letterSpacing: 0.6,
                }}>{x.d}</div>
              </div>
            );
          })}
        </div>
      </div>
      <MTabBar active="tasks" />
    </MBody>
  );
}

// 4) Mobile quiz
function MQuiz() {
  const t = useT();
  return (
    <MBody>
      <div style={{ padding: '54px 20px 120px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: t.c.surface,
            border: `1px solid ${t.c.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="arrow" size={15} color={t.c.inkSoft} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: t.c.surfaceSunken }}>
            <div style={{ width: '38%', height: '100%', borderRadius: 999, background: t.c.sageInk }} />
          </div>
          <span style={{ fontFamily: t.f.mono, fontSize: 12, color: t.c.inkSoft, fontWeight: 600 }}>3/8</span>
        </div>

        <div style={{
          marginTop: 22, fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4,
          textTransform: 'uppercase', color: t.c.sageInk, fontWeight: 600,
        }}>Quiz · estrutura do texto</div>
        <div style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight,
          fontSize: 24, color: t.c.ink, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 6,
        }}>
          Qual NÃO é parte da dissertação argumentativa?
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { t: 'Introdução com tese', sel: false },
            { t: 'Desenvolvimento com argumentos', sel: false },
            { t: 'Epígrafe em verso', sel: true },
            { t: 'Conclusão com intervenção', sel: false },
          ].map((o, i) => (
            <div key={i} style={{
              padding: '16px 14px', borderRadius: 16,
              background: o.sel ? t.c.sage : t.c.surface,
              border: `1.5px solid ${o.sel ? t.c.sageInk : t.c.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: o.sel ? t.c.sageInk : t.c.surface2,
                color: o.sel ? t.c.sage : t.c.inkMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.f.mono, fontSize: 12, fontWeight: 700,
              }}>
                {o.sel ? <Icon name="check" size={13} color={t.c.sage} strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </div>
              <span style={{
                flex: 1,
                fontFamily: t.f.body, fontSize: 14, fontWeight: o.sel ? 600 : 500,
                color: o.sel ? t.c.sageInk : t.c.ink,
              }}>{o.t}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, padding: 12, borderRadius: 14,
          background: t.c.butter, color: t.c.butterInk,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Icon name="sparkle" size={14} color={t.c.butterInk} />
          <div>
            <div style={{ fontFamily: t.f.body, fontSize: 12, fontWeight: 600 }}>Dica</div>
            <div style={{ fontFamily: t.f.body, fontSize: 11.5, opacity: 0.9, marginTop: 3, lineHeight: 1.4 }}>
              Pense na estrutura canônica: introdução, desenvolvimento e conclusão.
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 34,
        padding: '12px 20px 14px',
        background: `linear-gradient(to top, ${t.c.bg} 70%, ${t.c.bg}00)`,
      }}>
        <TButton variant="primary" size="lg" full icon={<Icon name="arrow" size={14} />}>
          Responder e continuar
        </TButton>
      </div>
    </MBody>
  );
}

// 5) Professor mobile dashboard
function MProfHome() {
  const t = useT();
  return (
    <MBody>
      <div style={{ padding: '56px 20px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Beatriz" size={44} tone={0} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
              color: t.c.inkMuted, fontWeight: 600,
            }}>Professora</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
              color: t.c.ink, letterSpacing: -0.3,
            }}>Beatriz Álvares</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: t.c.surface,
            border: `1px solid ${t.c.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Icon name="bell" size={15} color={t.c.inkSoft} />
            <div style={{
              position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: '50%',
              background: t.c.accent, border: `2px solid ${t.c.surface}`,
            }} />
          </div>
        </div>

        {/* Hero next */}
        <div style={{
          marginTop: 18, padding: 18, borderRadius: 22,
          background: t.c.accent, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -50, top: -60, opacity: 0.8 }}>
            <Blob color={t.c.sage} size={180} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase',
              color: t.c.accentInk, fontWeight: 600, opacity: 0.8,
            }}>Hoje · 14:00</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 22,
              color: t.c.accentInk, letterSpacing: -0.5, lineHeight: 1.15, marginTop: 4,
            }}>A dissertação argumentativa</div>
            <div style={{ fontFamily: t.f.body, fontSize: 12.5, color: t.c.accentInk, opacity: 0.8, marginTop: 4 }}>
              42 alunos · Redação para o ENEM · aula 3
            </div>
            <div style={{ marginTop: 14 }}>
              <TButton variant="primary" size="sm" icon={<Icon name="play" size={12} />}>
                Começar aula
              </TButton>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { l: 'Entregas pendentes', v: '7', tone: 'butter', icon: 'clip' },
            { l: 'Alunos ativos', v: '164', tone: 'sage', icon: 'people' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 16, background: t.c.surface,
              border: `1px solid ${t.c.border}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: t.c[s.tone], color: t.c[s.tone + 'Ink'],
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
              }}>
                <Icon name={s.icon} size={15} color={t.c[s.tone + 'Ink']} />
              </div>
              <div style={{ fontFamily: t.f.body, fontSize: 11, color: t.c.inkMuted, fontWeight: 500 }}>{s.l}</div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 24,
                color: t.c.ink, letterSpacing: -0.5, marginTop: 2,
              }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Courses shortcut */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginTop: 22, marginBottom: 10,
        }}>
          <div style={{
            fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 18,
            color: t.c.ink, letterSpacing: -0.3,
          }}>Minhas aulas</div>
          <span style={{ fontFamily: t.f.body, fontSize: 12, color: t.c.accentInk, fontWeight: 600 }}>Ver todas →</span>
        </div>
        {[
          { t: 'Redação para o ENEM', sub: '42 alunos · 24 aulas', tone: 'peach', prog: 72 },
          { t: 'Gramática viva', sub: '58 alunos · 32 aulas', tone: 'caramel', prog: 91 },
        ].map((c, i) => (
          <div key={i} style={{
            background: t.c.surface, border: `1px solid ${t.c.border}`,
            borderRadius: 16, padding: 14, marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, background: t.c[c.tone],
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              position: 'relative', overflow: 'hidden',
            }}>
              <Icon name="book" size={18} color={t.c[c.tone + 'Ink']} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.f.body, fontSize: 14, fontWeight: 600, color: t.c.ink }}>{c.t}</div>
              <div style={{ fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted, marginTop: 2 }}>{c.sub}</div>
            </div>
            <Ring value={c.prog} size={30} stroke={3} color={t.c[c.tone + 'Ink']} />
          </div>
        ))}
      </div>
      <MTabBar active="home" />
    </MBody>
  );
}

// 6) Mobile login
function MLogin() {
  const t = useT();
  return (
    <MBody style={{ background: t.c.accent }}>
      <div style={{ position: 'absolute', right: -60, top: 40, opacity: 0.7 }}>
        <Blob color={t.c.butter} size={260} />
      </div>
      <div style={{ position: 'absolute', left: -60, bottom: -20, opacity: 0.55 }}>
        <Blob color={t.c.sage} size={220} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        padding: '70px 24px 34px', height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: t.c.accentInk, color: t.c.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.f.display, fontWeight: 700, fontSize: 17, letterSpacing: -0.4,
          }}>T</div>
          <div style={{ fontFamily: t.f.display, fontWeight: 500, fontSize: 20, color: t.c.accentInk, letterSpacing: -0.3 }}>
            TeachFlow
          </div>
        </div>

        <div style={{ marginTop: 70 }}>
          <h1 style={{
            fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 38,
            color: t.c.accentInk, letterSpacing: -1, lineHeight: 1.05, margin: 0,
          }}>
            Uma sala <em style={{ fontStyle: 'italic' }}>acolhedora</em>, no seu bolso.
          </h1>
          <p style={{
            fontFamily: t.f.body, fontSize: 14, color: t.c.accentInk, opacity: 0.8,
            lineHeight: 1.55, marginTop: 14,
          }}>
            Suas aulas, quizzes e entregas — organizadas e calmas.
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          background: t.c.surface, borderRadius: 22, padding: 18,
          boxShadow: '0 10px 40px rgba(80,50,30,0.15)',
        }}>
          {[
            { l: 'E-mail', v: 'beatriz@teachflow.com' },
            { l: 'Senha', v: '••••••••' },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: t.f.body, fontSize: 11.5, fontWeight: 600, color: t.c.inkSoft, marginBottom: 5 }}>
                {f.l}
              </div>
              <div style={{
                height: 42, padding: '0 14px', display: 'flex', alignItems: 'center',
                background: t.c.surface2, border: `1px solid ${t.c.border}`,
                borderRadius: 12, fontFamily: t.f.body, fontSize: 14, color: t.c.ink,
              }}>{f.v}</div>
            </div>
          ))}
          <TButton variant="primary" size="lg" full icon={<Icon name="arrow" size={14} />} style={{ marginTop: 8 }}>
            Entrar
          </TButton>
          <div style={{
            textAlign: 'center', marginTop: 12,
            fontFamily: t.f.body, fontSize: 12.5, color: t.c.inkMuted,
          }}>
            Primeiro acesso? <span style={{ color: t.c.ink, fontWeight: 600 }}>Criar conta</span>
          </div>
        </div>
      </div>
    </MBody>
  );
}

Object.assign(window, {
  MobileFrame, MHome, MLesson, MTasks, MQuiz, MProfHome, MLogin,
});
