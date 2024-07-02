[![Netlify Status](https://api.netlify.com/api/v1/badges/589b5f54-8e95-4ceb-950f-262659a1bc4c/deploy-status)](https://app.netlify.com/sites/bu-sustainability-leftovers/deploys)
# BU Sustainability Catering Leftovers

## Overview
The BU Leftover Catering application is a solution aimed at reducing food waste on campus by facilitating the redistribution of leftover food from catering events within the specified time constraints.

## Core Features

1. Notification System: Allows food hosts to notify interested parties about available food following catering events
2. Food Safety Compliance: Incorporates a timer-based function to ensure food is not distributed more than four hours after being first served.
3. Geographic Mapping: Maps the location of events for easy recipient navigation.
4. Tracking and Analytics: Tracks metrics such as reduced waste volume, types of food claimed, number of people engaged, speed of food pick-ups, and remaining food.

## Getting Started
```bash
git clone https://github.com/yourgithubusername/se-bu-catering-leftovers.git
cd se-bu-catering-leftovers
npm install
npm run dev
```

## Keys and Tokens

Sensitive keys and tokens are not stored wihtin the repository for security reasons. 

## Framework

This project was done on React with Next.js. MUI Materials is the main UI framework, and Google Cloud Firestore and Storage systems were utilized. Further, openStreetMaps for the mapping feature was empoyed.

### Tech Stack
The frontend of this project is built using React alongside Next.js. The primary UI framework utilized is MUI Materials. For additional styling, Styled-components and MUI Material Styles are implemented.

On the backend, Firebase Firestore serves as the database and Firebase Storage is used for storage. User authentication is managed through Firebase Auth, which includes integration with Google OAuth for user login processes. Custom API routes are handled within the Next.js framework and are detailed in the `src/pages/api/` directory.

For third-party services and APIs Google Cloud's Firestore and Storage are used for backend data management and file storage, and OpenStreetMaps is utilized for geographic mapping for locating events on campus.

## Known issues
* Google Auth issues on the deployed version if popups are blocked on browser.
* A more secure way of registering admins is suggested, particularly a changing, potentially one-time use, token, or any other better-suited alternative.
* Google Cloud Storage rules should be modified accordingly to only allow authenticated members its use.
* Swipeable images component on the event preview is optimized for phone use and is hard to maneuver on PC.
  
## Future Improvements
* Managing storage: A function that automatically deletes events/images after a certain amount of time could be implemented to save storage.
* Events can't currently be deleted within the app, only closed. 
* A notifications page to view new feedback could be implemented for a better user experience on the admin side.
* Email notifications: The component was created but it couldn't be tested as an official email wasn't provided and the security of sendGrid didn't allow the use of any email for testing purposes.
  

## Deployment
To view our project deployed checkout: [https://bu-sustainability-leftovers.netlify.app/](https://testing--bu-sustainability-leftovers.netlify.app/)
