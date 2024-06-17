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
  address: string;
  abbreviatedAddress: string;
  lat: string;
  lon: string;
}

// Define the event interface
export interface Event {
    host: string;
    name: string;
    Location: Location;
    location: string;
    campusArea: string;
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
  type: string;
  uid: string;
  reviews: string[];
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
