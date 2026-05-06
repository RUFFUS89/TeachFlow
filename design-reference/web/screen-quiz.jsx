// Screen 4: Quiz builder.

function QuizBuilderScreen() {
  const t = useT();

  const questions = [
    {
      n: 1,
      q: 'Qual elemento NÃO faz parte da estrutura canônica de uma dissertação argumentativa?',
      opts: [
        { t: 'Introdução com tese', correct: false },
        { t: 'Desenvolvimento com argumentos', correct: false },
        { t: 'Epígrafe em verso', correct: true },
        { t: 'Conclusão com proposta de intervenção', correct: false },
      ],
    },
    {
      n: 2,
      q: 'A tese, em um texto dissertativo, é:',
      opts: [
        { t: 'O assunto geral do texto', correct: false },
        { t: 'A opinião do autor sobre o tema, a ser defendida', correct: true },
        { t: 'Uma frase decorativa de abertura', correct: false },
        { t: 'A citação de um pensador consagrado', correct: false },
      ],
    },
  ];

  return (
    <div style={{ background: t.c.bg, minHeight: '100%', position: 'relative' }}>
      {t.texture && <PaperBg opacity={0.35} />}

      <TopBar title="Editando quiz" subtitle="Redação para o ENEM · Módulo 1">
        <TButton variant="ghost" size="sm">Descartar</TButton>
        <TButton variant="soft" size="sm">Salvar rascunho</TButton>
        <TButton variant="primary" size="sm" icon={<Icon name="check" size={13} />}>Publicar</TButton>
      </TopBar>

      <div style={{ padding: '24px 32px 40px', display: 'flex', gap: 24 }}>
        {/* Left: build area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Quiz meta card */}
          <div style={{
            background: t.c.sage,
            borderRadius: t.r.card * 1.2, padding: 24,
            position: 'relative', overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{ position: 'absolute', right: -40, bottom: -60, opacity: 0.6 }}>
              <Blob color={t.c.butter} size={200} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{
                width: 48, height: 48, borderRadius: t.r.chip,
                background: t.c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="quiz" size={22} color={t.c.sageInk} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                  color: t.c.sageInk, opacity: 0.75, marginBottom: 4,
                }}>Quiz · Módulo 1</div>
                <div style={{
                  fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                  fontSize: 24, color: t.c.sageInk, letterSpacing: -0.4, marginBottom: 6,
                }}>Estrutura do texto dissertativo</div>
                <div style={{
                  fontFamily: t.f.body, fontSize: 13.5, color: t.c.sageInk, opacity: 0.85,
                }}>Quiz de verificação após a aula 3 · 8 perguntas · pontuação mínima 70%</div>
              </div>
              <TButton variant="ghost" size="sm"
                style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'transparent', color: t.c.sageInk }}
                icon={<Icon name="edit" size={13} />}>
                Editar metadados
              </TButton>
            </div>

            <div style={{
              marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap',
              position: 'relative', zIndex: 1,
            }}>
              {[
                { l: 'Tempo limite', v: '15 minutos' },
                { l: 'Tentativas', v: 'Ilimitadas' },
                { l: 'Feedback', v: 'Imediato por questão' },
                { l: 'Embaralhar', v: 'Sim' },
              ].map(m => (
                <div key={m.l} style={{
                  background: 'rgba(255,255,255,0.6)',
                  padding: '8px 12px', borderRadius: t.r.pill,
                  display: 'flex', gap: 6,
                }}>
                  <span style={{ fontFamily: t.f.body, fontSize: 12, color: t.c.sageInk, opacity: 0.7 }}>{m.l}</span>
                  <span style={{ fontFamily: t.f.body, fontSize: 12, color: t.c.sageInk, fontWeight: 600 }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          {questions.map((q) => (
            <Card key={q.n} padding={22} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: t.c.ink, color: t.c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.f.mono, fontSize: 12, fontWeight: 700,
                }}>{q.n}</div>
                <span style={{
                  fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
                  color: t.c.inkMuted, fontWeight: 600,
                }}>Múltipla escolha · 1 correta</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 4, color: t.c.inkMuted }}>
                  <div style={{ width: 30, height: 30, borderRadius: t.r.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="grip" size={14} color={t.c.inkMuted} />
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: t.r.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="trash" size={14} color={t.c.inkMuted} />
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: t.f.display, fontWeight: t.f.displayWeight,
                fontSize: 18, color: t.c.ink, letterSpacing: -0.2, lineHeight: 1.35,
                marginBottom: 16,
              }}>{q.q}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.opts.map((o, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: o.correct ? t.c.sage : t.c.surface2,
                    border: `1.5px solid ${o.correct ? t.c.sageInk : 'transparent'}`,
                    borderRadius: t.r.chip,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: o.correct ? t.c.sageInk : t.c.surface,
                      color: o.correct ? t.c.sage : t.c.inkMuted,
                      border: `1.5px solid ${o.correct ? t.c.sageInk : t.c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {o.correct && <Icon name="check" size={12} color={t.c.sage} strokeWidth={3} />}
                    </div>
                    <div style={{
                      flex: 1,
                      fontFamily: t.f.body, fontSize: 14,
                      color: o.correct ? t.c.sageInk : t.c.ink,
                      fontWeight: o.correct ? 600 : 500,
                    }}>{o.t}</div>
                    {o.correct && (
                      <span style={{
                        fontFamily: t.f.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
                        color: t.c.sageInk, fontWeight: 700,
                      }}>Correta</span>
                    )}
                    <div style={{ color: t.c.inkMuted, padding: 4, cursor: 'pointer' }}>
                      <Icon name="dots" size={14} color={t.c.inkMuted} />
                    </div>
                  </div>
                ))}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  border: `1.5px dashed ${t.c.border}`, borderRadius: t.r.chip,
                  color: t.c.inkMuted, cursor: 'pointer',
                }}>
                  <Icon name="plus" size={14} color={t.c.inkMuted} />
                  <span style={{ fontFamily: t.f.body, fontSize: 13, fontWeight: 500 }}>
                    Adicionar alternativa
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {/* Add question */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 6,
            padding: 18,
            border: `1.5px dashed ${t.c.border}`,
            borderRadius: t.r.card,
            background: t.c.bgAlt,
          }}>
            <Icon name="sparkle" size={16} color={t.c.inkSoft} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: t.f.body, fontSize: 13.5, fontWeight: 600, color: t.c.ink,
              }}>Adicionar 3ª questão</div>
              <div style={{
                fontFamily: t.f.body, fontSize: 12, color: t.c.inkMuted, marginTop: 2,
              }}>Múltipla escolha, verdadeiro/falso, resposta curta ou redação.</div>
            </div>
            <TButton variant="soft" size="sm">Múltipla escolha</TButton>
            <TButton variant="ghost" size="sm">V/F</TButton>
            <TButton variant="ghost" size="sm">Resposta curta</TButton>
          </div>
        </div>

        {/* Right: outline */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <Card padding={16}>
            <div style={{
              fontFamily: t.f.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase',
              color: t.c.inkMuted, marginBottom: 12, fontWeight: 600,
            }}>Estrutura</div>
            {[
              { n: '01', t: 'Elementos da dissertação', on: false },
              { n: '02', t: 'Conceito de tese', on: true },
              { n: '03', t: 'Repertório sociocultural', on: false },
              { n: '04', t: 'Identificar conectivos', on: false },
            ].map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: t.r.chip,
                background: o.on ? t.c.accent : 'transparent',
                marginBottom: 2,
              }}>
                <span style={{
                  fontFamily: t.f.mono, fontSize: 11, fontWeight: 700,
                  color: o.on ? t.c.accentInk : t.c.inkMuted,
                }}>{o.n}</span>
                <span style={{
                  fontFamily: t.f.body, fontSize: 12.5,
                  color: o.on ? t.c.accentInk : t.c.ink,
                  fontWeight: o.on ? 600 : 500, flex: 1,
                }}>{o.t}</span>
              </div>
            ))}
            <div style={{
              marginTop: 14, padding: 12, borderRadius: t.r.chip,
              background: t.c.butter, color: t.c.butterInk,
              display: 'flex', gap: 8,
            }}>
              <Icon name="sparkle" size={14} color={t.c.butterInk} />
              <div>
                <div style={{ fontFamily: t.f.body, fontSize: 12, fontWeight: 600 }}>
                  Sugestão da IA
                </div>
                <div style={{ fontFamily: t.f.body, fontSize: 11.5, opacity: 0.9, marginTop: 3, lineHeight: 1.4 }}>
                  Adicione uma pergunta de aplicação real — textos autênticos aumentam a retenção.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { QuizBuilderScreen });
