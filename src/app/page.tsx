import BuyButton from "@/components/BuyButton";
import MotionSignature from "@/components/MotionSignature";

const CAPABILITIES = [
  { title: "AI Animation Generation", body: "Describe the motion you want; Motion-AI drafts the Remotion composition." },
  { title: "2D Motion Graphics", body: "Titles, lower-thirds, callouts, and vector scenes, generated and editable." },
  { title: "3D + Camera Animation", body: "Geometric scenes with camera movement, built on ThreeCanvas." },
  { title: "Preview & Render", body: "Scrub a live preview, then render to a finished export." },
  { title: "Project-based Workflow", body: "Every animation lives in its own project — nothing gets overwritten." },
  { title: "Desktop Application", body: "Runs natively on Windows. No browser tab, no upload queue." },
];

const STEPS = [
  { title: "Buy Motion-AI", body: "One payment, ₹500. No account required to purchase." },
  { title: "Download the Windows application", body: "A single installer — the packaged runtime is included." },
  { title: "Add your own supported AI API keys", body: "Connect a supported provider from the app's settings." },
  { title: "Generate your animation", body: "Describe the scene; Motion-AI drafts the composition." },
  { title: "Preview and render", body: "Scrub the timeline, adjust, then export the final file." },
];

const MODELS = ["Gemini 2.5 Flash", "Muse Glimmer 30B", "Nemotron 3 Ultra 550B A55B", "Inkling"];

const FAQS = [
  { q: "Is this a subscription?", a: "No — Motion-AI is a one-time purchase. You pay ₹500 once and keep the application." },
  { q: "Is there a per-render fee?", a: "No. Rendering and exporting inside the application carries no additional charge." },
  { q: "Do I need Node.js, npm, or Remotion installed?", a: "No. The packaged Windows application includes the runtime it needs." },
  { q: "What operating system does it run on?", a: "Windows." },
  { q: "Do I need API keys?", a: "For AI generation, yes — you'll connect your own credentials for a supported provider (see Model Support above)." },
  { q: "Are AI provider costs included in the ₹500?", a: "No. The ₹500 covers the Motion-AI application itself. Usage of your chosen AI provider is billed separately by that provider." },
];

export default function Home() {
  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-6 pt-10 pb-20 md:pt-16 md:pb-28">
          <div className="flex items-center justify-between mb-16 md:mb-24">
            <span className="font-mono text-sm tracking-[0.2em] text-fade">MOTION-AI</span>
            <a
              href="#pricing"
              className="font-mono text-xs tracking-wide text-fade hover:text-bone transition-colors"
            >
              ₹500 · ONE-TIME
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h1 className="font-display italic text-5xl md:text-6xl leading-[1.05] text-bone">
                Create motion graphics with AI.
              </h1>
              <p className="mt-6 text-lg text-fade max-w-md leading-relaxed">
                Generate polished 2D and 3D motion graphics directly on your computer, using
                AI-powered Remotion generation.
              </p>

              <div className="mt-9 flex flex-col gap-3 items-start">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 bg-amber text-ink font-medium px-6 py-3.5 rounded-sm hover:bg-bone transition-colors"
                >
                  Buy Motion-AI — ₹500
                </a>
                <span className="font-mono text-xs tracking-wide text-fade">
                  ONE-TIME PURCHASE &nbsp;·&nbsp; WINDOWS DESKTOP APP
                </span>
              </div>
            </div>

            <MotionSignature />
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-12">What you get</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="bg-ink p-7">
                <h3 className="font-medium text-bone mb-2">{c.title}</h3>
                <p className="text-sm text-fade leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-12">How it works</h2>
          <ol className="space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-6">
                <span className="font-mono text-sm text-amber pt-1 shrink-0 w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-medium text-bone">{s.title}</h3>
                  <p className="text-sm text-fade mt-1 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── MODEL SUPPORT ────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-4">Model support</h2>
          <p className="text-fade max-w-xl mb-10 leading-relaxed">
            Motion-AI works with your own credentials for any of the following supported
            providers. Availability and uptime are set by each provider, not by Motion-AI.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODELS.map((m) => (
              <div key={m} className="border border-line px-5 py-4 font-mono text-sm text-bone">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D MOTION ────────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-6">
              Beyond flat motion graphics
            </h2>
            <p className="text-fade leading-relaxed mb-4">
              Motion-AI generates geometric 3D scenes with real camera movement — dolly,
              orbit, push-in — rendered through ThreeCanvas-based scenes alongside its 2D
              and vector motion-graphics work.
            </p>
            <p className="text-fade leading-relaxed">
              The same project can mix cinematic 3D moments with vector-based motion
              graphics, generated from a single description.
            </p>
          </div>
          <div className="border border-line p-8 font-mono text-xs text-fade leading-loose">
            <div className="text-amber">scene.camera</div>
            <div className="pl-4">position: orbit(radius: 6, speed: 0.4)</div>
            <div className="pl-4">lookAt: origin</div>
            <div className="mt-3 text-ember">scene.motion</div>
            <div className="pl-4">easing: cubic-bezier(.22,.9,.34,1)</div>
            <div className="pl-4">duration: 2.0s</div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b border-line">
        <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
          <div className="border border-line p-10 md:p-14 text-center">
            <h2 className="font-display italic text-2xl text-bone">Motion-AI</h2>
            <div className="mt-4 font-display text-6xl text-bone">₹500</div>
            <div className="mt-2 font-mono text-xs tracking-widest text-fade">ONE-TIME PURCHASE</div>

            <ul className="mt-10 space-y-3 text-left max-w-xs mx-auto text-sm text-fade">
              {[
                "Windows desktop application",
                "2D + 3D animation generation",
                "Preview",
                "Render / Export",
                "No subscription",
                "No per-render payment",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-3">
              <BuyButton />
              <span className="font-mono text-xs tracking-wide text-fade">
                Secure checkout via Razorpay
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h2 className="font-display italic text-3xl md:text-4xl text-bone mb-12">
            Frequently asked
          </h2>
          <div className="divide-y divide-line border-t border-b border-line">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-bone font-medium">
                  {f.q}
                  <span className="text-fade group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-fade mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32 text-center">
          <h2 className="font-display italic text-4xl md:text-5xl text-bone mb-4">
            Ready to create?
          </h2>
          <p className="font-mono text-sm text-fade mb-8">₹500 · ONE-TIME</p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-amber text-ink font-medium px-8 py-4 rounded-sm hover:bg-bone transition-colors"
          >
            Buy Motion-AI
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-6 text-sm text-fade">
          <div>
            <div className="font-mono tracking-widest text-bone mb-1">MOTION-AI</div>
            <p>Windows desktop application.</p>
          </div>
          <div className="flex gap-6 font-mono text-xs">
            <a href="/terms" className="hover:text-bone transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-bone transition-colors">Privacy</a>
            <a href="/refund" className="hover:text-bone transition-colors">Refund Policy</a>
            <a href="/contact" className="hover:text-bone transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
