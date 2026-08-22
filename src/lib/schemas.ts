import { z } from "zod";

// Fields Razorpay appends to the Payment Link callback_url on redirect.
// See: https://razorpay.com/docs/payments/payment-links/apis/
export const paymentLinkCallbackSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_payment_link_id: z.string().min(1),
  // The Payment Button used here was created once in the Dashboard without
  // a per-transaction reference_id, so Razorpay may send this as an empty
  // string. It still participates in the signature payload either way.
  razorpay_payment_link_reference_id: z.string().default(""),
  razorpay_payment_link_status: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type PaymentLinkCallback = z.infer<typeof paymentLinkCallbackSchema>;
