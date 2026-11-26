import mongoose from "mongoose";
import { MESSAGE_STATUSES } from "../config/constants.js";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 24, default: "" },
    subject: {
      type: String,
      required: true,
      enum: ["General enquiry", "Private dining", "Large party", "Feedback", "Careers", "Accessibility"],
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    status: { type: String, enum: MESSAGE_STATUSES, default: "new", index: true },
    ipHash: { type: String, select: false },
    userAgent: { type: String, maxlength: 300, default: "" },
    readAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    adminNote: { type: String, maxlength: 1000, default: "" },
  },
  { timestamps: true, versionKey: false },
);

contactMessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    return ret;
  },
});

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
export default ContactMessage;
