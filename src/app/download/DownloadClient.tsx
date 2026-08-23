"use client";

import { useEffect, useRef, useState } from "react";

type VerifyState =
  | { phase: "checking" }
  | { phase: "pending"; attempt: number }
  | { phase: "paid"; downloadToken: string }
  | { phase: "unauthorized" }
  | { phase: "error"; message: string };

const MAX_POLL_ATTEMPTS = 15; // ~45s of polling at 3s intervals
const POLL_INTERVAL_MS = 3000;

export default function DownloadClient() {
  const [state, setState] = useState<VerifyState>({ phase: "checking" });
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/purchase/status", { cache: "no-store" });

        if (cancelled) return;

        if (res.status === 401) {
          setState({ phase: "unauthorized" });
          return;
        }

        const data = await res.json();

        if (data.status === "paid") {
          setState({ phase: "paid", downloadToken: data.downloadToken });
          return;
        }

        // status === "pending" — webhook not confirmed yet, keep polling.
        attemptRef.current += 1;
        if (attemptRef.current >= MAX_POLL_ATTEMPTS) {
          setState({
            phase: "error",
            message:
              "We're still confirming your payment with Razorpay. This can take a minute — refresh this page shortly, or contact support with your payment ID.",
          });
          return;
        }

        setState({ phase: "pending", attempt: attemptRef.current });
        setTimeout(verify, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setState({ phase: "error", message: "Something went wrong while verifying your payment. Please refresh." });
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-line p-10 text-center">
        <div className="font-mono text-xs tracking-widest text-fade mb-8">MOTION-AI</div>

        {state.phase === "checking" && (
          <>
            <h1 className="font-display italic text-2xl text-bone mb-3">Payment processing…</h1>
            <p className="text-sm text-fade">Confirming your payment with Razorpay.</p>
          </>
        )}

        {state.phase === "pending" && (
          <>
            <h1 className="font-display italic text-2xl text-bone mb-3">Payment processing…</h1>
            <p className="text-sm text-fade">
              Your payment was received. We're finalizing confirmation — this page will update
              automatically.
            </p>
          </>
        )}

        {state.phase === "paid" && (
          <>
            <h1 className="font-display italic text-2xl text-bone mb-2">Payment successful</h1>
            <p className="text-sm text-fade mb-1">Motion-AI is ready to download.</p>
            <div className="mt-6 mb-8 text-left inline-block">
              <div className="text-xs font-mono text-fade">Product</div>
              <div className="text-bone mb-3">Motion-AI</div>
              <div className="text-xs font-mono text-fade">Version</div>
              <div className="text-bone">{process.env.NEXT_PUBLIC_PRODUCT_VERSION ?? "v1.0.0"}</div>
            </div>
            <a
              href={`/api/download?token=${encodeURIComponent(state.downloadToken)}`}
              className="block w-full bg-amber text-ink font-medium px-6 py-3.5 rounded-sm hover:bg-bone transition-colors"
            >
              Download Motion-AI for Windows
            </a>
            <p className="text-xs text-fade mt-4">
              This link is single-use and expires shortly. If it stops working, refresh this page
              for a new one.
            </p>
          </>
        )}

        {state.phase === "unauthorized" && (
          <>
            <h1 className="font-display italic text-2xl text-bone mb-3">
              Payment verification required
            </h1>
            <p className="text-sm text-fade">
              This page only unlocks after a completed Motion-AI purchase. If you just paid,
              return to the confirmation email or checkout screen and use the link provided
              there.
            </p>
          </>
        )}

        {state.phase === "error" && (
          <>
            <h1 className="font-display italic text-2xl text-bone mb-3">Still confirming</h1>
            <p className="text-sm text-fade">{state.message}</p>
          </>
        )}
      </div>
    </main>
  );
}
