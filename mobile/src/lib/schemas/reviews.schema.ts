// src/lib/schemas/reviews.schema.ts
import { z } from 'zod';

// Review schema
export const ReviewSchema = z.object({
  id: z.string(),
  comment: z.string().min(1),
  date: z.any(), // TODO: Firestore Timestamp Validation
  images: z.array(z.string().url()),
  shareContact: z.boolean(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// Schema for creating reviews
export const CreateReviewSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
  images: z.array(z.string().url()).max(3).default([]),
  shareContact: z.boolean().default(false),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// Fetch reviews options schema
export const FetchReviewsOptsSchema = z.object({
  eventId: z.string().min(1),
  pageSize: z.number().int().positive().default(20),
});

// Helper validation functions
export function validateCreateReview(data: unknown) {
  return CreateReviewSchema.parse(data);
}

export function validateFetchReviewsOpts(data: unknown) {
  return FetchReviewsOptsSchema.parse(data);
}
