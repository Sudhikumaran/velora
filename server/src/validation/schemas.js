import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
  currency: z.string().trim().max(10).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const transactionCreateSchema = z.object({
  type: z.enum(["expense", "income", "transfer"]),
  amount: z.coerce.number().positive(),
  category: z.string().optional(),
  accountId: z.string().min(1),
  toAccountId: z.string().optional(),
  date: z.any().optional(),
  note: z.string().optional(),
  autoSuggestCategory: z.boolean().optional(),
  tags: z.array(z.string().max(48)).max(30).optional(),
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().max(200).optional(),
        url: z.string().max(2000),
      })
    )
    .max(10)
    .optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});
