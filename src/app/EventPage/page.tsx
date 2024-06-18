"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '../../../firebaseConfig'
import { Button, Container, Grid, Typography } from '@mui/material';
import Navbar from '../../components/Navbar';
import EventCard from "../../components/EventCard"
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/components/styling";
import FilterComponent from '../../components/FilterComponent';
import { Event, User } from "@/components/types";
import { useRouter } from 'next/navigation';

// TODO:
// Remove get user function
// Bigger location on eventCard
// Only Admin can use this
// Remaining time only after event starts

// Page to display all events
const EventsPage = () => {
    const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    const [user, setUser] = useState<User>();
    const router = useRouter();

    // Retrieve available events from database
    const [events, setEvents] = useState<Event[]>([]);
    useEffect(() => {
        const fetchUser = async () => {
            setUser(await getUser(userid));
        }
        
        fetchUser();

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
      const newEvents = await getEvents();
      if (filter === "All") {
        setEvents(newEvents);
        return;
      } else {
        
      setEvents(newEvents.filter((event) => event.campusArea === filter));
      }
  };

  // Route to event form
  const routeToEventForm = () => {
    router.push("/EventForm");
  };

  return (
  <div style={{background: "#FFF"}}>
    <ThemeProvider theme={theme}>
    <Navbar/>
    <Container maxWidth="md" style={{paddingTop: "7em", background: "#FFF"}}>
      <Grid container alignItems="center" style={{paddingLeft: "0.5em"}}>
        <Grid item xs justifyContent={"center"} display= "column">
          <Grid container xs justifyContent="center">
          {user && user.type === "Admin" && (
            <Button
              variant="outlined"
              color="primary"
              onClick={routeToEventForm}
              style={{borderRadius: "20px", borderWidth:"3px", borderColor: "#ab0101", textTransform: "none"}}
              sx={{width: {xs:"50%", sm: "30%"}}} 
              size="medium"
            >
                  <Typography variant="button">New Leftovers</Typography>
            </Button>
          )}
          </Grid>
          <Grid container xs justifyContent="space-between" alignItems="center">
            <Typography variant="h4">
              Current Events
            </Typography>
            <FilterComponent onSelectFilter={handleFilterSelect} />
          </Grid>
        </Grid>
      </Grid>
      <Grid container xs={12} justifyContent={"center"}>
        {events.length === 0 ? (
            <Typography variant="body1" style={{ marginTop: 20, textAlign: "center", fontStyle: "italic" }}>
                No events currently available. Stay tuned for updates!
            </Typography>
        ) : (
            events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))
        )}
      </Grid>
    </Container>
    </ThemeProvider>
  </div>
  );
};

export default EventsPage;

