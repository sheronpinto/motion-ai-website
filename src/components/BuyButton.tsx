"use client";

import { useEffect, useRef } from "react";

/**
 * Embeds the existing Razorpay Payment Button exactly as provided —
 * pl_TSp0dDD3WZ4hn2 — via its official <form> + checkout script snippet.
 * This is the ONLY payment entry point on the site; nothing here talks to
 * Razorpay's API directly or handles card data.
 *
 * Razorpay's script renders its own iframe/button styling into the <form>,
 * so this component just needs to get the exact snippet into the DOM once.
 */
export default function BuyButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const buttonId = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID;

  useEffect(() => {
    const form = formRef.current;
    if (!form || !buttonId) return;

    // Avoid appending twice under React strict-mode double-invoke / fast refresh.
    if (form.querySelector("script[data-razorpay-button]")) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.async = true;
    script.setAttribute("data-payment_button_id", buttonId);
    script.setAttribute("data-razorpay-button", "true");
    form.appendChild(script);
  }, [buttonId]);

  if (!buttonId) {
    return (
      <p className="text-sm text-ember">
        Payment button is not configured. Set NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID.
      </p>
    );
  }

  return <form ref={formRef} id="razorpay-buy-form" />;
}
