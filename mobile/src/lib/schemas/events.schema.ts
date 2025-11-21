// src/lib/schemas/events.schema.ts
import { z } from 'zod';

// Location schema
const LocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  abbreviation: z.string().optional(),
  lat: z.string(),
  lon: z.string(),
  campus_section: z.string(),
  abbreviatedAddress: z.string().optional(),
});

// FoodItem schema
const FoodItemSchema = z.object({
  id: z.string(),
  item: z.string().min(1),
  quantity: z.string(),
  unit: z.string(),
});

// EventStatus schema
const EventStatusSchema = z.enum(['drafted', 'saved', 'open', 'closed']);

// Base Event schema
export const EventSchema = z.object({
  id: z.string(),
  host: z.string().min(1),
  name: z.string().min(1),
  status: EventStatusSchema,
  Location: LocationSchema,
  locationDetails: z.string(),
  notes: z.string(),
  duration: z.number().int().positive(),
  foodArrived: z.any(), // TODO: Timestamp Validation
  foodAvailable: z.any(), // TODO: Timestamp Validation
  foods: z.array(FoodItemSchema),
  images: z.array(z.string().url()),
  reviewedBy: z.array(z.string()),
});

// Schema for creating events
export const CreateEventSchema = z
  .object({
    host: z.string().min(1).default('Unknown'),
    name: z.string().min(1).default('Untitled'),
    status: EventStatusSchema.default('drafted'),
    Location: LocationSchema.optional(),
    locationDetails: z.string().default(''),
    notes: z.string().default(''),
    duration: z.number().int().positive().default(30),
    foodArrived: z.any().optional(),
    foodAvailable: z.any().optional(),
    foods: z.array(FoodItemSchema).default([]),
    images: z.array(z.string().url()).default([]),
    creatorUid: z.string().optional(),
  })
  .partial();

// Schema for updating events
export const UpdateEventSchema = z
  .object({
    host: z.string().min(1),
    name: z.string().min(1),
    status: EventStatusSchema,
    Location: LocationSchema,
    locationDetails: z.string(),
    notes: z.string(),
    duration: z.number().int().positive(),
    foodArrived: z.any(),
    foodAvailable: z.any(),
    foods: z.array(FoodItemSchema),
    images: z.array(z.string().url()),
  })
  .partial();

// Pagination options schema
export const PaginationOptsSchema = z
  .object({
    pageSize: z.number().int().positive().default(20),
    after: z.any().optional().nullable(),
    order: z
      .enum(['foodAvailable', 'foodArrived', 'duration'])
      .default('foodAvailable'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .partial();

// Open events pagination schema
export const OpenEventsPaginationSchema = z
  .object({
    pageSize: z.number().int().positive().default(20),
    after: z.any().optional().nullable(),
  })
  .partial();

// Event IDs array schema
export const EventIdsSchema = z.array(z.string().min(1));

// Delete options schema
export const DeleteOptsSchema = z
  .object({
    ownerUid: z.string().optional(),
  })
  .optional();

// Helper to validate and parse with defaults
export function validateCreateEvent(data: unknown) {
  return CreateEventSchema.parse(data);
}

export function validateUpdateEvent(data: unknown) {
  return UpdateEventSchema.parse(data);
}

export function validateEventIds(data: unknown) {
  return EventIdsSchema.parse(data);
}
