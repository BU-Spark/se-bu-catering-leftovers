"use client";

import React, { useEffect } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { firestore as db } from '../../../firebaseConfig'
import { Container, Grid, Paper, Typography } from '@mui/material';
import {FormData} from '../../../components/EventForm';

// Define the event interface
interface Event extends FormData {
    id: string;
    remainingTime?: string;
}

// TODO: Refresh events
// Display saved images
// Edit button for admins?
// Filtering events
// Sorting events
// What info to remove?
// ALL Design based on figma


// Page to display all events
const EventsPage = () => {
    // Retrieve available events from database
    const [events, setEvents] = React.useState<Event[]>([]);
    useEffect(() => {
        getEvents();
    }, []);

    // Set up interval to update remaining time of events
    useEffect(() => {
        const interval = setInterval(() => {
            setEvents((prevEvents) => prevEvents.map((event) => ({
                ...event,
                remainingTime: calculateRemainingTime(event),
             })));
        }, 1000); // Update every second
        return () => clearInterval(interval);
      }, [events]);

    // Retrieve all events from database
    const getEvents = async () => {
        const eventsCollection = collection(db, 'Events');
        const eventsSnapshot = await getDocs(eventsCollection);
        const newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()})) as Event[];
        
        // Filter out events that are not open
        setEvents(newEvents.filter((event) => event.status === "open"));
        console.log(newEvents);
    };

    // Calculate the remaining time of an event
    const calculateRemainingTime = (event: Event): string => {
        if (!event.duration || !event.foodAvailable) return "N/A";
    
        const foodAvailable = event.foodAvailable.toDate();
        const durationInMillis = parseInt(event.duration) * 60 * 1000;
        const endTime = foodAvailable.getTime() + durationInMillis;
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;
    
        if (timeLeft <= 0) return "00:00:00";
    
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Events List
      </Typography>
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} key={event.id}>
            <Paper style={{ padding: '1em' }}>
                <Typography variant="h6">{event.name}</Typography>
                <Typography variant="subtitle1">Host: {event.host}</Typography>
                <Typography variant="body1">Location: {event.location}</Typography>
                <Typography variant="body2">Notes: {event.notes}</Typography>
                <Typography variant="body2">
                    Food Arrival: {event.foodArrived? event.foodArrived.toDate().toLocaleDateString() + ", " + event.foodArrived.toDate().toLocaleTimeString()  : "Not available"}
                </Typography>
                <Typography variant="body2">
                    Food Available: {event.foodAvailable? event.foodAvailable.toDate().toLocaleDateString() + ", " + event.foodAvailable.toDate().toLocaleTimeString()  : "Not available"}
                </Typography>
                <Typography variant="body2">
                    Duration: {`${Math.floor(parseInt(event.duration) / 60).toString().padStart(2, '0')}:${(parseInt(event.duration) % 60).toString().padStart(2, '0')}`}
                </Typography>
                <Typography variant="body2">Remaining Time: {event.remainingTime}</Typography>
                <Typography variant="body2">Status: {event.status}</Typography>
                <Typography variant="body2">Food Items:</Typography>
                <ul>
                    {event.foods.map((item, index) => (
                        <li key={index}>
                            {item.quantity} - {item.item}
                        </li>
                    ))}
              </ul>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default EventsPage;