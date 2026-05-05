import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="font-mono text-xs tracking-widest uppercase text-inkMuted mb-4">
          TeachFlow
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-ink leading-tight tracking-tight mb-6">
          Uma sala de aula <em className="italic">acolhedora</em> — do outro lado da tela.
        </h1>
        <p className="text-inkSoft text-lg mb-10 leading-relaxed">
          Organize aulas, quizzes e entregas num espaço calmo e claro. Para professores que
          querem ensinar, não brigar com software.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-ink text-bg px-6 py-3 rounded-pill font-medium hover:opacity-90 transition"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
