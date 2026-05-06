// Screen 6: Filiais / alunos

function BranchesScreen() {
  const t = useT();

  const branches = [
    { name: 'Vila Madalena', city: 'São Paulo', students: 64, tutors: 3, active: 58, tone: 'peach' },
    { name: 'Tijuca', city: 'Rio de Janeiro', students: 48, tutors: 2, active: 41, tone: 'sage' },
    { name: 'Savassi', city: 'Belo Horizonte', students: 36, tutors: 2, active: 32, tone: 'caramel' },
    { name: 'Pelourinho', city: 'Salvador', students: 22, tutors: 1, active: 19, tone: 'lilac' },
  ];

  const students = [
    { n: 'Laura Mendes', branch: 'Vila Madalena', progress: 82, grade: 8.4, streak: 14 },
    { n: 'Pedro Dias', branch: 'Vila Madalena', progress: 64, grade: 7.1, streak: 6 },
    { n: 'Sofia Lemos', branch: 'Tijuca', progress: 91, grade: 9.2, streak: 22 },
    { n: 'Matheus Sá', branch: 'Savassi', progress: 55, grade: 7.0, streak: 3 },
    { n: 'Ana Ribeiro', branch: 'Tijuca', progress: 38, grade: 6.2, streak: 0 },
    { n: 'Tomás Alves', branch: 'Pelourinho', progress: 88, grade: 9.0, streak: 18 },
  ];

  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      <TopBar title="Filiais & alunos" subtitle="Gestão de turmas">
        <TButton variant="ghost" size="sm" icon={<Icon name="download" size={13} />}>Exportar</TButton>
        <TButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Nova filial</TButton>
      </TopBar>

      {/* Branches grid */}
      <div style={{ padding: '22px 32px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {branches.map((b, i) => (
          <div key={i} style={{
            background: t.c.surface, border: `1px solid ${t.c.border}`,
            borderRadius: t.r.card, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              height: 80, background: t.c[b.tone], position: 'relative', overflow: 'hidden',
              padding: 14, display: 'flex', alignItems: 'flex-end',
            }}>
              <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.6 }}>
                <Blob color={t.c.surface} size={120} />
              </div>
              <div style={{
                position: 'relative', zIndex: 1,
                fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                color: t.c[b.tone + 'Ink'], fontWeight: 600,
              }}>{b.city}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                fontSize: 17, color: t.c.ink, letterSpacing: -0.2, marginBottom: 12,
              }}>{b.name}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: t.f.body, fontSize: 11, color: t.c.inkMuted }}>Alunos</div>
                  <div style={{
                    fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 22,
                    color: t.c.ink, letterSpacing: -0.3,
                  }}>{b.students}</div>
                </div>
                <div>
                  <div style={{ fontFamily: t.f.body, fontSize: 11, color: t.c.inkMuted }}>Ativos</div>
                  <div style={{
                    fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 22,
                    color: t.c.ink, letterSpacing: -0.3,
                  }}>{b.active}</div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Chip tone="neutral" size="sm">{b.tutors} tutores</Chip>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Students list */}
      <div style={{ padding: '22px 32px 40px', display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', marginBottom: 14,
          }}>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
              color: t.c.ink, letterSpacing: -0.3,
            }}>Alunos em destaque</div>
            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex', gap: 4, padding: 3,
              background: t.c.surface, border: `1px solid ${t.c.borderSoft}`,
              borderRadius: t.r.pill,
            }}>
              {['Progresso', 'Nota', 'Streak'].map((k, i) => (
                <div key={k} style={{
                  padding: '5px 12px',
                  background: i === 0 ? t.c.ink : 'transparent',
                  color: i === 0 ? t.c.bg : t.c.inkSoft,
                  borderRadius: t.r.pill,
                  fontFamily: t.f.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{k}</div>
              ))}
            </div>
          </div>

          <div style={{
            background: t.c.surface, border: `1px solid ${t.c.border}`,
            borderRadius: t.r.card, overflow: 'hidden',
          }}>
            {students.map((s, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.3fr 2fr 0.8fr 0.8fr',
                gap: 14, padding: '14px 18px', alignItems: 'center',
                borderTop: i > 0 ? `1px solid ${t.c.borderSoft}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={s.n} size={34} tone={i % 6} />
                  <div>
                    <div style={{ fontFamily: t.f.body, fontSize: 13.5, fontWeight: 600, color: t.c.ink }}>{s.n}</div>
                    <div style={{ fontFamily: t.f.mono, fontSize: 10.5, color: t.c.inkMuted, letterSpacing: 0.4 }}>
                      matrícula #{2024000 + i}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: t.f.body, fontSize: 12.5, color: t.c.inkSoft }}>{s.branch}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: t.c.surfaceSunken }}>
                    <div style={{
                      width: `${s.progress}%`, height: '100%', borderRadius: 999,
                      background: s.progress > 70 ? t.c.sageInk : s.progress > 40 ? t.c.accentInk : t.c.blushInk,
                    }} />
                  </div>
                  <span style={{ fontFamily: t.f.mono, fontSize: 11, color: t.c.inkSoft, fontWeight: 600, minWidth: 30 }}>
                    {s.progress}%
                  </span>
                </div>
                <div style={{
                  fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 16,
                  color: t.c.ink, letterSpacing: -0.3,
                }}>{s.grade.toFixed(1)}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: t.f.body, fontSize: 12.5,
                  color: s.streak > 10 ? t.c.sageInk : s.streak > 0 ? t.c.caramelInk : t.c.inkMuted,
                  fontWeight: 600,
                }}>
                  <Icon name="leaf" size={12} color={s.streak > 10 ? t.c.sageInk : s.streak > 0 ? t.c.caramelInk : t.c.inkMuted} />
                  {s.streak} dias
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini relatório */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <Card padding={18} tone="surface" style={{ background: t.c.butter, border: 'none' }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
              color: t.c.butterInk, fontWeight: 600, marginBottom: 6, opacity: 0.8,
            }}>Insight da semana</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
              color: t.c.butterInk, letterSpacing: -0.3, lineHeight: 1.2, marginBottom: 10,
            }}>
              Os alunos da Tijuca melhoraram 12% a média após as oficinas de reescrita.
            </div>
            <div style={{
              fontFamily: t.f.body, fontSize: 13, color: t.c.butterInk, opacity: 0.9, lineHeight: 1.5,
            }}>
              Considere replicar o formato de ateliê semanal nas filiais com menor engajamento.
            </div>
            <TButton variant="primary" size="sm" style={{ marginTop: 14 }} icon={<Icon name="arrow" size={13} />}>
              Ver relatório completo
            </TButton>
          </Card>

          <div style={{ height: 14 }} />

          <Card padding={18}>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 16,
              color: t.c.ink, letterSpacing: -0.2, marginBottom: 14,
            }}>Faixas de engajamento</div>
            {[
              { l: 'Muito engajados', v: 54, c: 'sageInk' },
              { l: 'Engajados', v: 88, c: 'accentInk' },
              { l: 'Em risco', v: 22, c: 'blushInk' },
              { l: 'Inativos', v: 6, c: 'inkMuted' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderTop: i > 0 ? `1px solid ${t.c.borderSoft}` : 'none',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.c[r.c] }} />
                <div style={{ flex: 1, fontFamily: t.f.body, fontSize: 13, color: t.c.ink }}>{r.l}</div>
                <div style={{ fontFamily: t.f.mono, fontSize: 13, color: t.c.inkSoft, fontWeight: 600 }}>{r.v}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BranchesScreen });
