"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore as db } from '../../../firebaseConfig';
import { Button, Container, Grid, Typography } from '@mui/material';
import Navbar from '../../components/Navbar';
import EventCard from "../../components/EventCard";
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/components/styling";
import FilterComponent from '../../components/FilterComponent';
import { Event, User } from '@/components/types';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';

// Page to display all events for students
const StudentEventsPage = () => {
    const [user, setUser] = useState<User>();
    const [events, setEvents] = useState<Event[]>([]);
    const router = useRouter();
    const auth = getAuth();

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'Users', currentUser.uid));
                setUser(userDoc.data() as User);
            }
        };

        const fetchEvents = async () => {
            setEvents(await getEvents());
        };

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchUser();
            } else {
                setUser(undefined);
            }
        });

        const unsubscribeEvents = onSnapshot(collection(db, 'Events'), () => {
            fetchEvents();
        });

        return () => {
            unsubscribeAuth();
            unsubscribeEvents();
        };
    }, [auth]);

    const getEvents = async (): Promise<Event[]> => {
        const eventsCollection = collection(db, 'Events');
        const eventsQuery = query(eventsCollection, orderBy("foodAvailable", "desc"));
        const eventsSnapshot = await getDocs(eventsQuery);

        let newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Event[];

        newEvents = newEvents.filter((event) => event.status === "open");

        return newEvents;
    };

    const handleFilterSelect = async (filter: string) => {
        const newEvents = await getEvents();
        if (filter === "All") {
            setEvents(newEvents);
        } else {
            setEvents(newEvents.filter((event) => event.campusArea === filter));
        }
    };

    const routeToPickedUpFood = () => {
        alert("Food picked up");
    };

    return (
        <div style={{ background: "#FFF" }}>
            <ThemeProvider theme={theme}>
                <Navbar />
                <Container maxWidth="md" style={{ paddingTop: "7em", background: "#FFF" }}>
                    <Grid container alignItems="center" style={{ paddingLeft: "0.5em" }}>
                        <Grid item xs justifyContent={"center"} display="column">
                            <Grid container xs justifyContent="center">
                                {user && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={routeToPickedUpFood}
                                        style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none" }}
                                        sx={{ width: { xs: "50%", sm: "30%" } }}
                                        size="medium"
                                    >
                                        <Typography variant="button">I picked up food</Typography>
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

export default StudentEventsPage;

