// src/types/index.ts
// Core data types matching Firestore schema

export type UserRole = 'User' | 'Admin';

export type EventStatus = 'drafted' | 'saved' | 'open' | 'closed';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  events: string[];
  reviews: string[];
  locPref: string[];
  timePref: string[];
  foodPref: string[];
  agreedToTerms: boolean;
}

export interface Location {
  name: string;
  address: string;
  abbreviation: string;
  lat: string;
  lon: string;
  campus_section: string;
  abbreviatedAddress?: string;
}

export interface FoodItem {
  id: string;
  item: string;
  quantity: string;
  unit: string;
}

export interface Event {
  id: string;
  host: string;
  name: string;
  Location: Location;
  locationDetails: string;
  notes: string;
  duration: number;
  foodArrived: any; // Firestore Timestamp
  foodAvailable: any; // Firestore Timestamp
  foods: FoodItem[];
  status: EventStatus;
  images: string[];
  reviewedBy: string[];
}

export interface Review {
  id: string;
  comment: string;
  date: any; // Firestore Timestamp
  images: string[];
  shareContact: boolean;
  name?: string;
  email?: string;
}
