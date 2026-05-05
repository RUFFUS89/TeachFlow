import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Lado esquerdo — brand */}
      <div className="hidden md:flex flex-1 bg-accent relative overflow-hidden p-12 flex-col">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-accentInk text-accent flex items-center justify-center font-display font-bold">
            T
          </div>
          <span className="font-display text-xl text-accentInk">TeachFlow</span>
        </div>

        <div className="flex-1 flex items-center relative z-10">
          <div>
            <h1 className="font-display text-5xl text-accentInk leading-tight tracking-tight max-w-lg">
              Uma sala de aula <em className="italic">acolhedora</em> — do outro lado da tela.
            </h1>
            <p className="font-sans text-accentInk opacity-80 text-base mt-5 max-w-md leading-relaxed">
              Organize aulas, quizzes e entregas num espaço calmo e claro.
            </p>
          </div>
        </div>

        <div className="text-accentInk opacity-60 text-xs relative z-10">
          © 2026 TeachFlow
        </div>
      </div>

      {/* Lado direito — form */}
      <div className="flex-1 md:w-[460px] md:flex-none bg-surface p-12 flex flex-col justify-center">
        <p className="font-mono text-xs tracking-widest uppercase text-inkMuted font-semibold mb-2">
          Entrar no painel
        </p>
        <h2 className="font-display text-3xl text-ink mb-2">Que bom ver você de novo.</h2>
        <p className="text-inkMuted text-sm mb-8">Entre com seu e-mail e senha.</p>

        <LoginForm />
      </div>
    </main>
  );
}
