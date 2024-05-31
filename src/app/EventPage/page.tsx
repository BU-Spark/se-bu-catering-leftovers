"use client";

import React, { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore as db } from '../../../firebaseConfig'
import { Container, Grid, Paper, Typography } from '@mui/material';
import {FormData} from '../../components/EventForm';
import Navbar from '../../components/Navbar';
import EventCard from "../../components/EventCard"
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../components/styling";

// Define the event interface
export interface Event extends FormData {
    id: string;
}

// TODO: Refresh events
// Edit button for admins?
// Filtering by location (grouping)
// Sorting events 
// ALL Design based on figma


// Page to display all events
const EventsPage = () => {
    // Retrieve available events from database
    const [events, setEvents] = React.useState<Event[]>([]);
    useEffect(() => {
        getEvents();
    }, []);

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
    
  return (
  <div style={{background: "#FFF"}}>
    <Navbar/>
    <ThemeProvider theme={theme}>
    <Container maxWidth="md" style={{padding: "1em", paddingTop: "7em", background: "#FFF"}}>
      <Typography variant="h4" >
        Current Events
      </Typography>
      <Grid container xs={12}>
        {events.map((event) => (
          <EventCard event={event}/>
        ))}
      </Grid>
    </Container>
    </ThemeProvider>
  </div>
  );
};

export default EventsPage;

