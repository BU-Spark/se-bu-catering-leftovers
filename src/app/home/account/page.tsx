"use client";

import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { doc,  updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { Event, User }from '@/types/types';
import { firestore, auth } from '@/../firebaseConfig';
import { useUser } from '@/context/UserContext';
import EventCard from '@/components/eventComponents/EventCard';
import { Grid, Typography, IconButton, TextField, Button, Container, Paper, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";

// const Container = styled.div`
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     padding: 20px;
//     padding-top: 17%;
// `;

// const InfoSection = styled.div`
//     width: 100%;
//     max-width: 600px;
//     padding: 20px;
//     border: 1px solid #ab0101;
//     border-radius: 10px;
//     margin-bottom: 20px;
//     box-sizing: border-box;
// `;

// const InfoItem = styled.div`
//     margin-bottom: 10px;
// `;

// const Label = styled.span`
//     font-weight: bold;
//     color: #000;
// `;

// const Value = styled.span`
//     color: #ab0101;
// `;

// const Input = styled.input`
//     padding: 10px;
//     border-radius: 5px;
//     border: 1px solid #ccc;
//     width: calc(100% - 22px);
//     max-width: 100%;
//     box-sizing: border-box;
//     margin-bottom: 10px;
// `;

// const Button = styled.button`
//     padding: 10px 20px;
//     border-radius: 5px;
//     border: none;
//     background-color: #ab0101;
//     color: #fff;
//     cursor: pointer;
//     &:hover {
//         background-color: #a21d18;
//     }
// `;

// const PreferenceSection = styled.div`
//     width: 100%;
//     max-width: 600px;
//     margin-bottom: 20px;
//     box-sizing: border-box;
// `;

// const PreferenceContainer = styled.div`
//     display: flex;
//     justify-content: space-around;
//     margin-top: 10px;
//     flex-wrap: wrap;
// `;

// const PreferenceButton = styled.button<{ selected: boolean }>`
//     background-color: ${props => (props.selected ? '#ab0101' : 'transparent')};
//     color: ${props => (props.selected ? '#fff' : '#ab0101')};
//     border: 1px solid #ab0101;
//     border-radius: 20px;
//     padding: 10px 20px;
//     margin: 5px;
//     cursor: pointer;
//     &:hover {
//         background-color: ${props => (props.selected ? '#a21d18' : '#f1b0b7')};
//     }
//     &:active {
//         background-color: #ab0101;
//         color: #fff;
//     }
// `;

const AccountPage = () => {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState<User | null>(user);
    const [formData, setFormData] = useState<User | null>(user);
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [campusPreferences, setCampusPreferences] = useState<string[]>(user ? user.locPref : []);

    useEffect(() => {
        const fetchEvents = async () => {
            const eventsData = await fetchUserEvents();
            setUserEvents(eventsData);
            setIsLoading(false);
        };

        fetchEvents();
    }, []);
                    
    const fetchUserEvents = async () => {
        setUserEvents([]);
        const eventsCollection = collection(firestore, 'Events');
        
        const eventsQuery = query(
            eventsCollection, 
            orderBy("foodAvailable", "desc"),
            where("id", "in", user? user.events : [])
        )
        const eventsSnapshot = await getDocs(eventsQuery);

        let newEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()})) as Event[];

        return newEvents;
    };

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
        setCampusPreferences(prevPreferences =>
            prevPreferences.includes(preference)
                ? prevPreferences.filter(p => p !== preference)
                : [...prevPreferences, preference]
        );
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (auth.currentUser && formData) {
            const userDocRef = doc(firestore, 'Users', auth.currentUser.uid);
            await updateDoc(userDocRef, { ...formData,
                locPref: campusPreferences,
             } as any);
            setUserData({ ...formData, locPref: campusPreferences});
            setIsEditing(false);
        }
    };

    if (isLoading) {
        return <Container>Loading...</Container>;
    }
    return (
        <ThemeProvider theme={theme}>
            <Navbar user={!!user} />
            <Container sx={{ paddingTop: '8rem', paddingBottom: '2rem' }}>
                <Paper elevation={3} sx={{ padding: '2rem' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Typography variant="h4">My Account</Typography>
                        </Grid>
                        <Grid item>
                            <IconButton onClick={handleEditClick}>
                                <EditIcon color="primary" />
                            </IconButton>
                        </Grid>
                    </Grid>
                    {isEditing ? (
                        <form onSubmit={handleFormSubmit}>
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    label="Name"
                                    name="name"
                                    value={formData?.name || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData?.email || ''}
                                    onChange={handleInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <Typography variant="h6">Role</Typography>
                                <Typography variant="body1">{userData?.role}</Typography>

                                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                                    Save Changes
                                </Button>
                            </Box>
                        </form>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" marginTop="2em">Name</Typography>
                            <Typography variant="body1" >{userData?.name}</Typography>
                            <Typography variant="h6"  marginTop="2em">Email</Typography>
                            <Typography variant="body1" >{userData?.email}</Typography>
                            <Typography variant="h6"  marginTop="2em">Role</Typography>
                            <Typography variant="body1" >{userData?.role}</Typography>
                        </Box>
                    )}
                    <Typography variant="h6" marginTop="1rem">Notify me with events in:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 2 }}>
                        {['East', 'Central', 'West', 'South', 'All'].map((preference) => (
                            <Chip
                                key={preference}
                                label={preference}
                                color={campusPreferences.includes(preference) ? 'primary' : 'default'}
                                onClick={() => handleCampusPreferenceToggle(preference)}
                                sx={{ margin: 0.5 }}
                            />
                        ))}
                    </Box>
                    {userData && userData.role === "Admin" && (
                        <>
                        <Typography variant="h5">Events Created:</Typography>
                        {userEvents.length > 0 ? (
                            userEvents.map((event) => 
                                <Grid maxWidth="400px">
                                    <EventCard key={event.id} event={event} />
                                </Grid>
                        )
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
    );}

// };
//     return (
//         <div>
//             <ThemeProvider theme={theme}>
//             <Navbar />
//             <Container>
//                 <Grid container marginTop="2rem" marginBottom="1rem" alignItems="center">
//                     <Typography variant="h4">My Account</Typography>
//                     <IconButton onClick={handleEditClick} >
//                         <EditIcon color="primary" fontSize="small" />
//                     </IconButton>
//                 </Grid>
//                 {isEditing ? (
//                     <form onSubmit={handleFormSubmit}>
//                         <InfoSection>
//                             <InfoItem>
//                                 <Label>Name:</Label>
//                                 <Input type="text" name="name" 
//                                     value={formData?.name || ''} 
//                                     onChange={handleInputChange}
//                                 />
//                             </InfoItem>
//                             <InfoItem>
//                                 <Label>Email:</Label>
//                                 <Input type="email" name="email"
//                                     value={formData?.email || ''}
//                                     onChange={handleInputChange}
//                                 />
//                             </InfoItem>
//                             <InfoItem>
//                                 <Label>Role:</Label> <Value>{userData?.role}</Value>
//                             </InfoItem>
//                             <Button type="submit">Save Changes</Button>
//                         </InfoSection>
//                     </form>
//                 ) : (
//                     <InfoSection>
//                         <InfoItem>
//                             <Label>Name:</Label> <Value>{userData?.name}</Value>
//                         </InfoItem>
//                         <InfoItem>
//                             <Label>Email:</Label> <Value>{userData?.email}</Value>
//                         </InfoItem>
//                         <InfoItem>
//                             <Label>Role:</Label> <Value>{userData?.role}</Value>
//                         </InfoItem>
//                     </InfoSection>
//                 )}
//                 <div>
//                     <PreferenceSection>
//                         <Typography variant="h6" >Notify me with events in</Typography>
//                         <PreferenceContainer>
//                             {['East', 'Central', 'West', "South", 'All'].map(preference => (
//                                 <PreferenceButton
//                                     key={preference}
//                                     selected={campusPreferences.includes(preference)}
//                                     onClick={() => handleCampusPreferenceToggle(preference)}
//                                 >
//                                     {preference}
//                                 </PreferenceButton>
//                             ))}
//                         </PreferenceContainer>
//                     </PreferenceSection>
//                     <Typography variant="h5" style={{ marginTop: 20 }}>Events Created:</Typography>
//                     {userEvents.length > 0 ? (
//                         userEvents.map((event) => (
//                             <EventCard key={event.id} event={event} />
//                         ))
//                     ) : (
//                         <Typography variant="body1" style={{ marginTop: 20, textAlign: "center", fontStyle: "italic" }}>
//                             No events created by you.
//                         </Typography>
//                     )}
//                 </div>
//             </Container>
//             </ThemeProvider>
//         </div>
//     );
// };

export default AccountPage;
