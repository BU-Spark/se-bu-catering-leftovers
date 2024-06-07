import { Timestamp } from '@firebase/firestore-types';

// Interface for each of the foods available
export interface FoodItem {
    id: string;
    quantity: string;
    unit: string;
    item: string;
}

// Define the event interface
export interface Event {
    host: string;
    name: string;
    googleLocation: string;
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
}