// src/lib/schemas/users.schema.ts
import { z } from 'zod';

// Role schema
const RoleSchema = z.enum(['User', 'Admin']);

// User document schema
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  role: RoleSchema,
  events: z.array(z.string()),
  reviews: z.array(z.string()),
  locPref: z.array(z.string()),
  timePref: z.array(z.string()),
  foodPref: z.array(z.string()),
  agreedToTerms: z.boolean(),
});

// Schema for creating/ensuring users
export const EnsureUserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: RoleSchema.optional(),
});

// Schema for updating user preferences
export const UpdatePreferencesSchema = z.object({
  locPref: z.array(z.string()).optional(),
  timePref: z.array(z.string()).optional(),
  foodPref: z.array(z.string()).optional(),
}).partial();

// Schema for event/review operations
export const UserEventOpSchema = z.object({
  uid: z.string().min(1),
  eventId: z.string().min(1),
});

// Helper validation functions
export function validateEnsureUser(uid: string, seed: unknown) {
  return EnsureUserSchema.parse({ uid, ...((seed as any) ?? {}) });
}

export function validateUpdatePreferences(data: unknown) {
  return UpdatePreferencesSchema.parse(data);
}

export function validateUserEventOp(uid: string, eventId: string) {
  return UserEventOpSchema.parse({ uid, eventId });
}