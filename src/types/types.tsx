import { Timestamp } from '@firebase/firestore-types';

// Interface for each of the foods available
export interface FoodItem {
    id: string;
    quantity: string;
    unit: string;
    item: string;
}

// Interface for the location of the event
export interface Location {
  name: string;
  address: string;
  abbreviation: string;
  lat: string;
  lon: string;
  campus_section: string;
}

// Define the event interface
export interface Event {
    host: string;
    name: string;
    Location: Location;
    locationDetails: string;
    notes: string;
    duration: string;
    foodArrived: Timestamp;
    foodAvailable: Timestamp;
    foods: FoodItem[];
    status: string;
    images: string[];
    id: string;
    reviewedBy: string[];
}

// Define the user interface
export interface User {
  email: string;
  events: string[];
  foodPref: string[];
  locPref: string[];
  name: string;
  timePref: string[];
  role: string;
  uid: string;
  reviews: string[];
  agreedToTerms: boolean;
}

// Define the review interface
export interface Review {
  comment: string;
  date: Timestamp;
  images: string[];
  shareContact: boolean;
  name: string;
  email: string;
  id: string;
}