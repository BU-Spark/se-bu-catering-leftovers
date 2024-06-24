"use client";

import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { Typography } from '@mui/material';
import { Event, User }from '@/types/types';
import { firestore, auth } from '@/../firebaseConfig';

const GlobalStyle = createGlobalStyle`
    body {
        font-family: 'YourFontFamily', sans-serif;
    }
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    padding-top: 17%;
`;

const Header = styled.h1`
    color: #ab0101;
    margin-bottom: 20px;
`;

const InfoSection = styled.div`
    width: 100%;
    max-width: 600px;
    padding: 20px;
    border: 1px solid #ab0101;
    border-radius: 10px;
    margin-bottom: 20px;
    box-sizing: border-box;
`;

const InfoItem = styled.div`
    margin-bottom: 10px;
`;

const Label = styled.span`
    font-weight: bold;
    color: #000;
`;

const Value = styled.span`
    color: #ab0101;
`;

const EditIcon = styled.img`
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin-left: 10px;
`;

const Input = styled.input`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    width: calc(100% - 22px);
    max-width: 100%;
    box-sizing: border-box;
    margin-bottom: 10px;
`;

const Button = styled.button`
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    background-color: #ab0101;
    color: #fff;
    cursor: pointer;
    &:hover {
        background-color: #a21d18;
    }
`;

const PostContainer = styled.div`
    width: 100%;
    max-width: 600px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
    margin-bottom: 20px;
`;

const PostTitle = styled.h2`
    color: #ab0101;
`;

const PostContent = styled.p`
    color: #000;
`;

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const AdminAccountPage = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User | null>(null);
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [campusPreferences, setCampusPreferences] = useState<string[]>([]);
    const [foodPreferences, setFoodPreferences] = useState<string[]>([]);


    useEffect(() => {
        const fetchUserData = async (user: any) => {
            const userdata = await getUser(user.id);
            setUserData(userdata);
            setFormData(userdata);
            setCampusPreferences(userdata.locPref || []);
            setFoodPreferences(userdata.foodPref|| []);
        };

        if (auth.currentUser !== null) {
            fetchUserData(auth.currentUser);
        }
        else {
            return;
        }

        const fetchEvents = async () => {
            const eventsData = await fetchUserEvents();
            setUserEvents(eventsData);
            setIsLoading(false);
        };

        fetchEvents();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            fetchUserData(user);
        });

        return () => unsubscribe();
    }, []);
                    

    // Retrieve user from database
    const getUser = async (userid: string) => {
        // Placeholder for user authentication
        const user = await getDoc(doc(firestore, 'Users', userid));
        return user.data() as User;
    };

    const fetchUserEvents = async () => {
        setUserEvents([]);
        const eventsCollection = collection(firestore, 'Events');
        const eventsQuery = query(eventsCollection, orderBy("foodAvailable", "desc"))
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

    const handleFoodPreferenceToggle = (preference: string) => {
        setFoodPreferences(prevPreferences =>
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
                foodPref: foodPreferences
             } as any);
            setUserData({ ...formData, locPref: campusPreferences, foodPref: foodPreferences });
            setIsEditing(false);
        }
    };

    if (isLoading) {
        return <Container>Loading...</Container>;
    }

    return (
        <div>
            <GlobalStyle />
            <Navbar />
            <Container>
                <Header>
                    My Account <EditIcon src="/edit-icon.svg" alt="Edit" onClick={handleEditClick} />
                </Header>
                {userData ? (
                    isEditing ? (
                        <form onSubmit={handleFormSubmit}>
                            <InfoSection>
                                <InfoItem>
                                    <Label>Name:</Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData?.name || ''}
                                        onChange={handleInputChange}
                                    />
                                </InfoItem>
                                <InfoItem>
                                    <Label>Email:</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData?.email || ''}
                                        onChange={handleInputChange}
                                    />
                                </InfoItem>
                                
                                <Button type="submit">Save Changes</Button>
                            </InfoSection>
                        </form>
                    ) : (
                        <InfoSection>
                            <InfoItem>
                                <Label>Name:</Label> <Value>{userData.name}</Value>
                            </InfoItem>
                            <InfoItem>
                                <Label>Email:</Label> <Value>{userData.email}</Value>
                            </InfoItem>
                            {/* <InfoItem>
                                <Label>Role:</Label> <Value>{capitalizeFirstLetter(userData.role)}</Value>
                            </InfoItem> */}
                        </InfoSection>
                    )
                ) : (
                    <div>No user data available</div>
                )}
                <div>
                    <Typography variant="h5" style={{ marginTop: 20 }}>Events Created:</Typography>
                    {userEvents.length > 0 ? (
                        userEvents.map((event) => (
                            <PostContainer key={event.id}>
                                <PostTitle>{event.name}</PostTitle>
                                <PostContent>{event.notes}</PostContent>
                            </PostContainer>
                        ))
                    ) : (
                        <Typography variant="body1" style={{ marginTop: 20, textAlign: "center", fontStyle: "italic" }}>
                            No events created by you.
                        </Typography>
                    )}
                </div>
            </Container>
        </div>
    );
};

export default AdminAccountPage;