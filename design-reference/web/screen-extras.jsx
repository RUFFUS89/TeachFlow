// Screen 7: Auth (login) + Aluno feed (bonus small screens)

function LoginScreen() {
  const t = useT();
  return (
    <div style={{
      background: t.c.bg, minHeight: '100%', position: 'relative',
      display: 'flex', overflow: 'hidden',
    }}>
      {t.texture && <PaperBg opacity={0.45} />}

      {/* Left brand */}
      <div style={{
        flex: 1, padding: '48px 56px', position: 'relative',
        background: t.c.accent, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ position: 'absolute', right: -120, top: -140, opacity: 0.9 }}>
          <Blob color={t.c.butter} size={480} />
        </div>
        <div style={{ position: 'absolute', left: -80, bottom: -120, opacity: 0.6 }}>
          <Blob color={t.c.sage} size={340} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: t.c.accentInk, color: t.c.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.f.display, fontWeight: 700, fontSize: 18, letterSpacing: -0.5,
          }}>T</div>
          <div style={{ fontFamily: t.f.display, fontWeight: 500, fontSize: 22, color: t.c.accentInk, letterSpacing: -0.3 }}>
            TeachFlow
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 52,
              color: t.c.accentInk, letterSpacing: -1.2, lineHeight: 1.02,
              margin: 0, maxWidth: 480,
            }}>
              Uma sala de aula <em style={{ fontStyle: 'italic' }}>acolhedora</em> —
              do outro lado da tela.
            </h1>
            <p style={{
              fontFamily: t.f.body, fontSize: 15, color: t.c.accentInk,
              opacity: 0.8, lineHeight: 1.55, margin: '18px 0 0', maxWidth: 440,
            }}>
              Organize aulas, quizzes e entregas num espaço calmo e claro. Para professores
              que querem ensinar, não brigar com software.
            </p>
          </div>
        </div>

        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', gap: 20,
          fontFamily: t.f.body, fontSize: 12, color: t.c.accentInk, opacity: 0.65,
        }}>
          <span>© 2026 TeachFlow</span>
          <span>Termos</span>
          <span>Privacidade</span>
        </div>
      </div>

      {/* Right form */}
      <div style={{
        width: 460, background: t.c.surface,
        padding: '48px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: t.f.mono, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
          color: t.c.inkMuted, fontWeight: 600, marginBottom: 8,
        }}>Entrar no painel</div>
        <h2 style={{
          fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 32,
          color: t.c.ink, letterSpacing: -0.6, lineHeight: 1.1, margin: 0, marginBottom: 6,
        }}>Que bom ver você de novo.</h2>
        <div style={{ fontFamily: t.f.body, fontSize: 14, color: t.c.inkMuted, marginBottom: 28 }}>
          Entre com seu e-mail institucional.
        </div>

        {[
          { l: 'E-mail', v: 'beatriz@teachflow.com.br', type: 'email' },
          { l: 'Senha', v: '••••••••••', type: 'password' },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: t.f.body, fontSize: 12, fontWeight: 600, color: t.c.inkSoft,
              marginBottom: 6,
            }}>{f.l}</div>
            <div style={{
              height: 44, display: 'flex', alignItems: 'center', padding: '0 14px',
              background: t.c.surface2, border: `1px solid ${t.c.border}`,
              borderRadius: t.r.field,
              fontFamily: t.f.body, fontSize: 14, color: t.c.ink,
            }}>{f.v}</div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: 5,
              background: t.c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={11} color={t.c.bg} strokeWidth={3} />
            </div>
            <span style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.inkSoft }}>Manter conectado</span>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{
            fontFamily: t.f.body, fontSize: 13, color: t.c.accentInk, fontWeight: 600, cursor: 'pointer',
          }}>Esqueci a senha</span>
        </div>

        <TButton variant="primary" size="lg" full icon={<Icon name="arrow" size={15} />}>
          Entrar
        </TButton>

        <div style={{
          margin: '24px 0', display: 'flex', alignItems: 'center', gap: 10,
          color: t.c.inkMuted,
        }}>
          <div style={{ flex: 1, height: 1, background: t.c.borderSoft }} />
          <span style={{ fontFamily: t.f.body, fontSize: 11.5 }}>ou continue com</span>
          <div style={{ flex: 1, height: 1, background: t.c.borderSoft }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1, height: 44, borderRadius: t.r.field,
            border: `1px solid ${t.c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: t.f.body, fontSize: 13, fontWeight: 600, color: t.c.inkSoft,
          }}>Google</div>
          <div style={{
            flex: 1, height: 44, borderRadius: t.r.field,
            border: `1px solid ${t.c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: t.f.body, fontSize: 13, fontWeight: 600, color: t.c.inkSoft,
          }}>Microsoft</div>
        </div>

        <div style={{
          marginTop: 28, textAlign: 'center',
          fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted,
        }}>
          Primeiro acesso? <span style={{ color: t.c.ink, fontWeight: 600, cursor: 'pointer' }}>Criar conta</span>
        </div>
      </div>
    </div>
  );
}

function StudentFeedScreen() {
  const t = useT();
  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      <TopBar title="Olá, Laura 🌿" subtitle="Seu próximo passo" />

      <div style={{ padding: '24px 32px 40px', display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          {/* Continue watching */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: t.c.sage, borderRadius: t.r.card * 1.3,
            padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{ position: 'absolute', right: -40, top: -60, opacity: 0.7 }}>
              <Blob color={t.c.butter} size={220} />
            </div>
            <div style={{
              position: 'relative', zIndex: 1, width: 110, height: 110, flexShrink: 0,
              borderRadius: t.r.card, background: t.c.ink, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="play" size={28} color={t.c.bg} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <div style={{
                fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                color: t.c.sageInk, fontWeight: 600, opacity: 0.8, marginBottom: 6,
              }}>Continue de onde parou</div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 24,
                color: t.c.sageInk, letterSpacing: -0.4, marginBottom: 4,
              }}>Tese: como defender uma posição</div>
              <div style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.sageInk, opacity: 0.8 }}>
                Redação para o ENEM · aula 3 de 24 · restam 12 min
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <TButton variant="primary" size="sm" icon={<Icon name="play" size={13} />}>Retomar</TButton>
                <TButton variant="ghost" size="sm"
                  style={{ background: 'rgba(255,255,255,0.55)', borderColor: 'transparent', color: t.c.sageInk }}>
                  Ver programa do curso
                </TButton>
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
            color: t.c.ink, letterSpacing: -0.3, marginBottom: 14,
          }}>Meus cursos</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { t: 'Redação para o ENEM', p: 42, tone: 'peach' },
              { t: 'Literatura — Modernismo', p: 18, tone: 'lilac' },
              { t: 'Gramática viva', p: 78, tone: 'caramel' },
              { t: 'Interpretação de textos', p: 55, tone: 'butter' },
            ].map((c, i) => (
              <div key={i} style={{
                background: t.c.surface, border: `1px solid ${t.c.border}`,
                borderRadius: t.r.card, padding: 16, display: 'flex', gap: 14,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: t.r.chip, background: t.c[c.tone],
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="book" size={22} color={t.c[c.tone + 'Ink']} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 15,
                    color: t.c.ink, letterSpacing: -0.2, marginBottom: 8,
                  }}>{c.t}</div>
                  <div style={{ height: 5, borderRadius: 999, background: t.c.surfaceSunken, marginBottom: 4 }}>
                    <div style={{ width: `${c.p}%`, height: '100%', borderRadius: 999, background: t.c.ink }} />
                  </div>
                  <div style={{ fontFamily: t.f.mono, fontSize: 11, color: t.c.inkMuted }}>{c.p}% concluído</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 300, flexShrink: 0 }}>
          <Card padding={18} style={{ background: t.c.blush, border: 'none' }}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
              color: t.c.blushInk, fontWeight: 600, opacity: 0.8, marginBottom: 6,
            }}>Prazo amanhã</div>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 20,
              color: t.c.blushInk, letterSpacing: -0.3, lineHeight: 1.2, marginBottom: 8,
            }}>Esboço de redação</div>
            <div style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.blushInk, opacity: 0.85 }}>
              Rascunho inicial com tese e 3 argumentos. Prof. Beatriz.
            </div>
            <TButton variant="primary" size="sm" style={{ marginTop: 14 }} icon={<Icon name="upload" size={13} />}>
              Entregar
            </TButton>
          </Card>

          <div style={{ height: 14 }} />

          <Card padding={18}>
            <div style={{
              fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 16,
              color: t.c.ink, letterSpacing: -0.2, marginBottom: 12,
            }}>Streak</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight, fontSize: 42,
                color: t.c.ink, letterSpacing: -1, lineHeight: 1,
              }}>14</div>
              <div style={{ fontFamily: t.f.body, fontSize: 13, color: t.c.inkMuted, marginBottom: 6 }}>
                dias seguidos
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 22, borderRadius: 6,
                  background: i < 12 ? t.c.sageInk : t.c.sage,
                  opacity: i >= 12 ? 0.5 : 1,
                }} />
              ))}
            </div>
            <div style={{
              marginTop: 8, fontFamily: t.f.body, fontSize: 11.5, color: t.c.inkMuted,
            }}>Últimas 2 semanas</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, StudentFeedScreen });
