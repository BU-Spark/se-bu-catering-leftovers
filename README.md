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
cd se-bu-catering-leftovers
npm install
npm run dev
```

## Framework

This project was done on React with Next.Js. MUI Materials is the main UI framework, and Google Cloud Firestore and Storage systems were utilized. Further, openStreetMaps for the mapping feature was empoyed.

## Known issues
* Google Auth issues on the deployed version.
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
