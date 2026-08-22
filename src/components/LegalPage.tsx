export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      <a href="/" className="font-mono text-xs tracking-widest text-fade hover:text-bone transition-colors">
        ← MOTION-AI
      </a>
      <h1 className="font-display italic text-3xl text-bone mt-8 mb-6">{title}</h1>
      <div className="prose-invert text-sm text-fade leading-relaxed space-y-4">{children}</div>
    </main>
  );
}
