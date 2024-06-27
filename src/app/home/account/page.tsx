"use client";

import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { Event, User } from '@/types/types';
import { firestore, auth } from '@/../firebaseConfig';
import { useUser } from '@/context/UserContext';
import EventCard from '@/components/eventComponents/EventCard';
import { Grid, Typography, IconButton, TextField, Button, Container, Paper, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { ThemeProvider } from '@mui/material/styles';
import { theme, props } from "@/styles/styling";

const AccountPage = () => {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState<User | null>(user);
    const [formData, setFormData] = useState<User | null>(user);
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [campusPreferences, setCampusPreferences] = useState<string[]>(user ? user.locPref : []);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchUserEvents = useCallback(async () => {
        setUserEvents([]);
        const eventsCollection = collection(firestore, 'Events');

        const eventsQuery = query(
            eventsCollection,
            orderBy("foodAvailable", "desc"),
            where("id", "in", user ? user.events : [])
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        let newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Event[];

        return newEvents;
    }, [user]);

    useEffect(() => {
        const fetchEvents = async () => {
            const eventsData = await fetchUserEvents();
            setUserEvents(eventsData);
            setIsLoading(false);
        };

        fetchEvents();
    }, [fetchUserEvents]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }) as User);
    };

    const handleCampusPreferenceToggle = (preference: string) => {
        setCampusPreferences(prevPreferences => {
            const newPreferences = prevPreferences.includes(preference)
                ? prevPreferences.filter(p => p !== preference)
                : [...prevPreferences, preference]
            setHasChanges(true);
            return newPreferences;
            });
        
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (auth.currentUser && formData) {
            const userDocRef = doc(firestore, 'Users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                ...formData,
                locPref: campusPreferences,
            } as any);
            setUserData({ ...formData, locPref: campusPreferences });
            setIsEditing(false);
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return <Container>Loading...</Container>;
    }
    return (
        <ThemeProvider theme={theme}>
            <Navbar user={!!user} />
            <Container maxWidth="sm" sx={{ padding: '1em', paddingTop: '7em' }}>
                <Paper elevation={3} sx={{ padding: '2rem' }}>
                    <Grid container marginBottom="2em" alignItems="center">
                        <Typography variant="h4" style={{ display: 'inline-block', marginTop: "3px", paddingRight:"0px" }}>
                            My Account
                        </Typography>
                        <IconButton onClick={handleEditClick}>
                            <EditIcon color="primary" fontSize="small" />
                        </IconButton>
                    </Grid>
                    {isEditing ? (
                        <form onSubmit={handleFormSubmit}>
                            <Box sx={{ mt: 2 }}>
                                <StyledTextField
                                    label="Name"
                                    name="name"
                                    value={formData?.name || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ marginBottom: 3 }}
                                />
                                <StyledTextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData?.email || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ marginBottom: 3 }}
                                />
                                <Typography variant="h6">Role</Typography>
                                <Typography variant="body1">{userData?.role}</Typography>
                                <Grid container justifyContent={"center"}>
                                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, borderRadius: "20px" }} size="large">
                                        <Typography variant="button">Save Changes</Typography>
                                    </Button>
                                </Grid>
                            </Box>
                        </form>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" marginTop="2em">Name</Typography>
                            <Typography variant="body1" color="primary">{userData?.name}</Typography>
                            <Typography variant="h6" marginTop="2em">Email</Typography>
                            <Typography variant="body1" color="primary">{userData?.email}</Typography>
                            <Typography variant="h6" marginTop="2em">Role</Typography>
                            <Typography variant="body1" color="primary">{userData?.role}</Typography>
                        </Box>
                    )}
                    <Typography variant="h6" marginTop="2em">Notify me with events in:</Typography>
                    <Box justifyContent="center" sx={{ display: 'flex', flexWrap: 'wrap', mt: "1em", mb: "2em" }}>
                        {['East', 'Central', 'West', 'South', 'All'].map((preference) => (
                            <Chip
                                key={preference}
                                label={preference}
                                color={campusPreferences.includes(preference) ? 'primary' : 'default'}
                                onClick={() => handleCampusPreferenceToggle(preference)}
                                sx={{
                                    margin: 0.5,
                                    marginBottom: 1,
                                    flexBasis: 'calc(33% - 1em)',
                                    borderColor: '#ab0101',
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                    backgroundColor: campusPreferences.includes(preference) ? '#ab0101' : 'transparent',
                                    color: campusPreferences.includes(preference) ? '#fff' : '#ab0101',
                                    '&:hover': {
                                        backgroundColor: campusPreferences.includes(preference) ? '#a21d18' : 'rgba(171, 1, 1, 0.1)',
                                    },
                                }}
                            />
                        ))}
                    </Box>
                    {hasChanges && (
                        <Grid container justifyContent="center" alignItems="center" >
                            <Button type="submit" variant="contained" color="primary" sx={{  borderRadius: "20px" }} size="large" onClick={handleFormSubmit}>
                                <Typography variant="button">Save Changes</Typography>
                            </Button>
                        </Grid>
                    )}
                    {userData && userData.role === "Admin" && (
                        <>
                            <Typography variant="h4" marginBottom="1em">Events Created</Typography>
                            {userEvents.length > 0 ? (
                                <>
                                    <Grid container justifyContent="center">
                                        {userEvents.map((event) =>
                                            <Grid container sx={{width:{xs:"100%", sm: "80%"}, maxWidth:"400px"}} justifySelf="center" key={event.id}>
                                                <EventCard key={event.id} event={event} imageHeight="120px" adminView={true} />
                                            </Grid>
                                        )}
                                    </Grid>
                                </>
                            ) : (
                                <Typography variant="body1" sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
                                    No events created by you.
                                </Typography>
                            )}
                        </>
                    )}
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default AccountPage;

// Customize the TextField component
const StyledTextField = styled(TextField)({
    ...props
});
