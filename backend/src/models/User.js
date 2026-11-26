import crypto from "node:crypto";
import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import { ROLES } from "../config/constants.js";

/**
 * Refresh tokens are high-entropy random-ish JWTs, not user passwords, so a
 * fast digest is both sufficient and correct. bcrypt must NOT be used here:
 * it truncates input at 72 bytes and every token for one user shares that
 * prefix, which made all of a user's tokens compare equal.
 */
function digestToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address."],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: { type: String, trim: true, maxlength: 24, default: "" },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    defaultAddress: {
      line1: { type: String, trim: true, maxlength: 160, default: "" },
      city: { type: String, trim: true, maxlength: 80, default: "" },
      state: { type: String, trim: true, maxlength: 40, default: "" },
      zip: { type: String, trim: true, maxlength: 12, default: "" },
      instructions: { type: String, trim: true, maxlength: 240, default: "" },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        return ret;
      },
    },
  },
);

userSchema.virtual("id").get(function id() {
  return this._id.toString();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  return next();
});

userSchema.methods.verifyPassword = function verifyPassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashToken = function hashToken(token) {
  return digestToken(token);
};

/** Constant-time comparison; legacy bcrypt hashes simply never match. */
userSchema.statics.verifyToken = function verifyToken(token, hash) {
  if (!token || !hash) return false;
  const candidate = Buffer.from(digestToken(token), "hex");
  const stored = Buffer.from(String(hash), "hex");
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

export const User = mongoose.model("User", userSchema);
export default User;
