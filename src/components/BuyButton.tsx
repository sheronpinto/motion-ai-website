"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function BuyButton() {
  const [customer, setCustomer] = useState({ name: "", email: "", contact: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function beginCheckout() {
    setBusy(true);
    setError("");
    try {
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Unable to start checkout");

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
          document.body.appendChild(script);
        });
      }

      const checkout = new window.Razorpay!({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Motion-AI",
        description: "Motion-AI Windows Desktop Application",
        order_id: order.order_id,
        prefill: customer,
        handler: async (payment: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const response = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          if (!response.ok) throw new Error("Payment verification failed");
          window.location.assign("/download");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="space-y-2 mb-4">
        <input aria-label="Name" placeholder="Name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} className="w-full border border-line bg-transparent px-3 py-2 text-sm text-bone" />
        <input aria-label="Email" required type="email" placeholder="Email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className="w-full border border-line bg-transparent px-3 py-2 text-sm text-bone" />
        <input aria-label="Phone" placeholder="Phone" value={customer.contact} onChange={(event) => setCustomer({ ...customer, contact: event.target.value })} className="w-full border border-line bg-transparent px-3 py-2 text-sm text-bone" />
      </div>
      <button type="button" disabled={busy} onClick={beginCheckout} className="w-full bg-amber text-ink font-medium px-6 py-3.5 rounded-sm hover:bg-bone transition-colors disabled:opacity-60">
        {busy ? "Opening checkout..." : "BUY MOTION-AI — ₹500"}
      </button>
      {error && <p className="text-sm text-ember mt-3">{error}</p>}
    </div>
  );
}
