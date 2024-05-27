// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqX3cAL300MisdfncJZlBz0qrsViWRhHQ",
  authDomain: "bu-catering-leftovers.firebaseapp.com",
  databaseURL: "https://bu-catering-leftovers-default-rtdb.firebaseio.com",
  projectId: "bu-catering-leftovers",
  storageBucket: "bu-catering-leftovers.appspot.com",
  messagingSenderId: "961794942343",
  appId: "1:961794942343:web:66de36f22b99dc1cac5f22",
  measurementId: "G-8S7P12LSQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const firestore = getFirestore(app);