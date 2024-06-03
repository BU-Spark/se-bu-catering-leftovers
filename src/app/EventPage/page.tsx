"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '../../../firebaseConfig'
import { Container, Grid, Typography } from '@mui/material';
import {FormData} from '../../components/EventForm';
import Navbar from '../../components/Navbar';
import EventCard from "../../components/EventCard"
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../components/styling";
import FilterComponent from '../../components/FilterComponent';

// Define the event interface
export interface Event extends FormData {
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

// Page to display all events
const EventsPage = () => {
    const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    
    // Retrieve available events from database
    const [events, setEvents] = useState<Event[]>([]);
    useEffect(() => {
        const fetchEvents = async () => {
            setEvents(await getEvents());
        };

        const unsubscribe = onSnapshot(collection(db, 'Events'), (snapshot) => {
            fetchEvents();
        });
    
        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    // Retrieve all events from database
    const getEvents = async (): Promise<Event[]> => {
        setEvents([]);
        const eventsCollection = collection(db, 'Events');
        const eventsQuery = query(eventsCollection, orderBy("foodAvailable", "desc"))
        const eventsSnapshot = await getDocs(eventsQuery);
        
        let newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()})) as Event[];
        
        // Filter out events that are not open
        newEvents = newEvents.filter((event) => event.status === "open");
        
        return newEvents;
    };

    // Retrieve user from database
    const getUser = async (userid: string) => {
        // Placeholder for user authentication
        const user = await getDoc(doc(db, 'Users', userid));
        return user.data() as User;
    };
    
    // Filter events based on user preferences
    const handleFilterSelect = async (filter: string) => {
      if (filter === "All") {
        setEvents(await getEvents());
        return;
      } 
      const newEvents = await getEvents();
      const user = await getUser(userid);
      setEvents(newEvents.filter((event) => event.campusArea === filter));

  };

  return (
  <div style={{background: "#FFF"}}>
    <Navbar/>
    <ThemeProvider theme={theme}>
    <Container maxWidth="md" style={{paddingTop: "7em", background: "#FFF"}}>
      <Grid container alignItems="center" style={{paddingLeft: "0.5em"}}>
        <Grid item xs>
          <Typography variant="h4" fontSize="1em" fontWeight="600">
            Current Events
          </Typography>
        </Grid> 
        <Grid item>
          <FilterComponent onSelectFilter={handleFilterSelect} />
        </Grid>
      </Grid>
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

