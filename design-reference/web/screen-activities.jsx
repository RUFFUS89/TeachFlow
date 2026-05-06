// Screen 5: Activities / submissions review.

function ActivitiesScreen() {
  const t = useT();

  const submissions = [
    { n: 'Laura Mendes', avatar: 0, status: 'pending', when: 'Há 12 min', activity: 'Esboço de redação', grade: null, attempt: 1 },
    { n: 'Pedro Dias', avatar: 1, status: 'pending', when: 'Há 1h', activity: 'Esboço de redação', grade: null, attempt: 2 },
    { n: 'Sofia Lemos', avatar: 2, status: 'graded', when: 'Ontem', activity: 'Reescrita semanal', grade: 8.5, attempt: 1 },
    { n: 'Matheus Sá', avatar: 3, status: 'graded', when: 'Ontem', activity: 'Esboço de redação', grade: 7.0, attempt: 1 },
    { n: 'Ana Ribeiro', avatar: 4, status: 'late', when: 'Há 3 dias', activity: 'Reescrita semanal', grade: null, attempt: 1 },
    { n: 'Tomás Alves', avatar: 5, status: 'graded', when: 'Há 4 dias', activity: 'Esboço de redação', grade: 9.2, attempt: 1 },
  ];

  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      <TopBar title="Atividades" subtitle="Entregas e correção">
        <TButton variant="ghost" size="sm" icon={<Icon name="filter" size={13} />}>Filtrar</TButton>
        <TButton variant="primary" size="sm" icon={<Icon name="plus" size={13} />}>Nova atividade</TButton>
      </TopBar>

      {/* Summary row */}
      <div style={{ padding: '22px 32px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Aguardando correção', v: '7', sub: '3 prioritárias', tone: 'accent' },
          { l: 'Corrigidas esta semana', v: '24', sub: 'média 7.8', tone: 'sage' },
          { l: 'Entregas atrasadas', v: '3', sub: 'alunos notificados', tone: 'blush' },
          { l: 'Prazo próximo', v: '24/04', sub: 'Esboço de redação', tone: 'butter' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: 18, borderRadius: t.r.card,
            background: t.c[s.tone],
            color: t.c[s.tone + 'Ink'],
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontFamily: t.f.body, fontSize: 12, opacity: 0.8, fontWeight: 500 }}>{s.l}</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 32,
              letterSpacing: -0.8, lineHeight: 1.1, margin: '4px 0',
            }}>{s.v}</div>
            <div style={{ fontFamily: t.f.mono, fontSize: 11, opacity: 0.75, letterSpacing: 0.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 32px 40px', display: 'flex', gap: 24 }}>
        {/* Left: table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: t.c.surface, border: `1px solid ${t.c.borderSoft}`,
            borderRadius: t.r.pill, width: 'fit-content', marginBottom: 14,
          }}>
            {[
              { l: 'Pendentes', n: 7, on: true },
              { l: 'Corrigidas', n: 24 },
              { l: 'Atrasadas', n: 3 },
              { l: 'Todas', n: 58 },
            ].map((tab, i) => (
              <div key={tab.l} style={{
                padding: '6px 14px',
                background: tab.on ? t.c.ink : 'transparent',
                color: tab.on ? t.c.bg : t.c.inkSoft,
                borderRadius: t.r.pill,
                fontFamily: t.f.body, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {tab.l}
                <span style={{
                  fontFamily: t.f.mono, fontSize: 10.5, fontWeight: 700,
                  background: tab.on ? 'rgba(255,255,255,0.2)' : t.c.surface2,
                  color: tab.on ? t.c.bg : t.c.inkMuted,
                  padding: '1px 6px', borderRadius: 999,
                }}>{tab.n}</span>
              </div>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.3fr 1fr 0.9fr 0.8fr 80px',
            gap: 14, padding: '10px 18px',
            fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
            color: t.c.inkMuted, fontWeight: 600,
          }}>
            <div>Aluno</div><div>Atividade</div><div>Enviada</div><div>Status</div><div>Nota</div><div />
          </div>

          <div style={{
            background: t.c.surface, border: `1px solid ${t.c.border}`,
            borderRadius: t.r.card, overflow: 'hidden',
          }}>
            {submissions.map((s, i) => {
              const statusMap = {
                pending: { tone: 'butter', label: 'Aguardando' },
                graded: { tone: 'sage', label: 'Corrigida' },
                late: { tone: 'blush', label: 'Atrasada' },
              };
              const st = statusMap[s.status];
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.3fr 1fr 0.9fr 0.8fr 80px',
                  gap: 14, padding: '14px 18px',
                  alignItems: 'center',
                  borderTop: i > 0 ? `1px solid ${t.c.borderSoft}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.n} size={32} tone={s.avatar} />
                    <div>
                      <div style={{ fontFamily: t.f.body, fontSize: 13.5, fontWeight: 600, color: t.c.ink }}>{s.n}</div>
                      <div style={{ fontFamily: t.f.mono, fontSize: 10.5, color: t.c.inkMuted, letterSpacing: 0.4 }}>
                        tentativa {s.attempt}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.inkSoft }}>{s.activity}</div>
                  <div style={{ fontFamily: t.f.body, fontSize: 12.5, color: t.c.inkMuted }}>{s.when}</div>
                  <div><Chip tone={st.tone} size="sm">{st.label}</Chip></div>
                  <div style={{
                    fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                    fontSize: 17, color: s.grade ? t.c.ink : t.c.inkMuted,
                    letterSpacing: -0.3,
                  }}>
                    {s.grade ? s.grade.toFixed(1) : '—'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {s.status === 'pending' ? (
                      <TButton variant="soft" size="sm">Corrigir</TButton>
                    ) : (
                      <div style={{
                        width: 30, height: 30, borderRadius: t.r.chip,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="eye" size={14} color={t.c.inkMuted} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: focus card — current correction */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <Card padding={0} tone="surface" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 18, background: t.c.caramel, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, bottom: -40, opacity: 0.5 }}>
                <Blob color={t.c.blush} size={140} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                  color: t.c.caramelInk, fontWeight: 600, opacity: 0.8,
                }}>Em correção</div>
                <div style={{
                  fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 18,
                  color: t.c.caramelInk, letterSpacing: -0.3, marginTop: 4,
                }}>Esboço de redação — Laura Mendes</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{
                fontFamily: t.f.body, fontSize: 13, color: t.c.inkSoft,
                lineHeight: 1.55, padding: '12px 14px',
                background: t.c.surface2, borderRadius: t.r.chip,
                borderLeft: `3px solid ${t.c.accentInk}`, marginBottom: 14,
              }}>
                "O analfabetismo funcional no Brasil é um problema estrutural que atravessa gerações e…"
              </div>

              <div style={{
                fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                color: t.c.inkMuted, fontWeight: 600, marginBottom: 8,
              }}>Competências (0 a 200)</div>

              {[
                { l: 'Norma culta', v: 160 },
                { l: 'Compreensão do tema', v: 180 },
                { l: 'Argumentação', v: 140 },
                { l: 'Coesão', v: 120 },
                { l: 'Proposta de intervenção', v: 100 },
              ].map(c => (
                <div key={c.l} style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: t.f.body, fontSize: 12, color: t.c.ink, marginBottom: 4,
                  }}>
                    <span>{c.l}</span>
                    <span style={{ fontFamily: t.f.mono, color: t.c.inkSoft }}>{c.v}/200</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: t.c.surfaceSunken }}>
                    <div style={{
                      width: `${c.v / 2}%`, height: '100%', borderRadius: 999,
                      background: c.v >= 140 ? t.c.sageInk : t.c.accentInk,
                    }} />
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: 14, padding: 12, borderRadius: t.r.chip,
                background: t.c.sage, color: t.c.sageInk,
                fontFamily: t.f.body, fontSize: 12.5, lineHeight: 1.5,
              }}>
                Nota parcial: <strong>700 / 1000</strong> · salve e libere o feedback para a aluna.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <TButton variant="ghost" size="sm" full>Comentários</TButton>
                <TButton variant="primary" size="sm" full>Liberar nota</TButton>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ActivitiesScreen });
