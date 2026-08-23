import { z } from "zod";

export const createOrderSchema = z.object({
  name: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().email().optional().default(""),
  contact: z.string().trim().max(30).optional().default(""),
});

export const standardCheckoutVerifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
