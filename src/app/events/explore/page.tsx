"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '@/../firebaseConfig'
import { Button, Container, Grid, Typography } from '@mui/material';
import Navbar from '@/components/Navbar';
import EventCard from "@/components/eventComponents/EventCard"
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";
import FilterComponent from '@/components/eventComponents/FilterComponent';
import { Event } from "@/types/types";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

// TODO:
// Remaining time only after event starts

// Page to display all events
const EventsPage = () => {
    const { user } = useUser();
    const router = useRouter();

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
        const eventsQuery = query(eventsCollection, orderBy("foodAvailable", "desc"));
        const eventsSnapshot = await getDocs(eventsQuery);

        let newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Event[];

        // Filter out events that are not open
        newEvents = newEvents.filter((event) => event.status === "open");

        return newEvents;
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
    router.push("/events/admin/create");
  };

  return (
  <div style={{background: "#FFF"}}>
    <ThemeProvider theme={theme}>
    <Navbar/>
    <Container maxWidth="md" style={{paddingTop: "7em", background: "#FFF"}}>
      <Grid container alignItems="center" style={{paddingLeft: "0.5em"}}>
        <Grid item xs justifyContent={"center"} display= "column">
          <Grid container xs justifyContent="center">
          {user && user.role === "Admin" && (
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
              <Grid item xs={12} sm={6}>
                <EventCard key={event.id} event={event} />
              </Grid>
            ))
        )}
      </Grid>
    </Container>
    </ThemeProvider>
  </div>
  );
};

export default EventsPage;


