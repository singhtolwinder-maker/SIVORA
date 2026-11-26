import * as paymentService from "../services/paymentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const status = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: { enabled: paymentService.paymentsEnabled(), provider: "stripe", currency: "usd" },
  });
});

export const createIntent = asyncHandler(async (req, res) => {
  const intent = await paymentService.createPaymentIntent(req.user, req.valid.body.orderId);
  return sendSuccess(res, { data: intent });
});

export const verify = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(req.user, req.valid.body.orderId, {
    paymentIntentId: req.valid.body.paymentIntentId,
  });

  return sendSuccess(res, {
    message: result.paid ? "Payment confirmed." : "Payment has not completed yet.",
    data: {
      paid: result.paid,
      paymentStatus: result.paymentStatus,
      order: result.order,
    },
  });
});

export const webhook = asyncHandler(async (req, res) => {
  const signature = req.get("stripe-signature");
  if (!signature) return res.status(400).json({ received: false, error: "Missing signature" });

  const result = await paymentService.handleWebhook(req.body, signature);
  return res.status(200).json(result);
});
