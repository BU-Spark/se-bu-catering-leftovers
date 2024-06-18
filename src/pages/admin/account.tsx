"use client";

import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../../../firebaseConfig';
import { UserData, PostData, Event } from '@/types';
import Navbar from '../../components/Navbar';
import { Typography } from '@mui/material';

const GlobalStyle = createGlobalStyle`
    body {
        font-family: 'YourFontFamily', sans-serif;
    }
`;

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

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
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserData | null>(null);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [userEvents, setUserEvents] = useState<Event[]>([]);

    useEffect(() => {
        const fetchUserData = async (user: any) => {
            if (user) {
                console.log('Current user:', user); // Debugging log
                const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserData;
                    console.log('User data from Firestore:', data); // Debugging log
                    setUserData(data);
                    setFormData(data);
                    await fetchUserPosts(user.uid);
                    const events = await fetchUserEvents(user.email);
                    console.log('Events created by user:', events); // Debugging log
                    setUserEvents(events);
                } else {
                    console.log('No user document found in Firestore.'); // Debugging log
                }
                setIsLoading(false);
            } else {
                console.log('No authenticated user found.'); // Debugging log
                setIsLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            fetchUserData(user);
        });

        return () => unsubscribe();
    }, []);

    const fetchUserPosts = async (userId: string) => {
        const postsQuery = query(collection(firestore, 'Posts'), where('userId', '==', userId));
        const querySnapshot = await getDocs(postsQuery);
        const postsData: PostData[] = [];
        querySnapshot.forEach((doc) => {
            postsData.push({ id: doc.id, ...doc.data() } as PostData);
        });
        setPosts(postsData);
    };

    const fetchUserEvents = async (userEmail: string) => {
        try {
            const eventsQuery = query(collection(firestore, 'Events'), where('createdByEmail', '==', userEmail));
            const querySnapshot = await getDocs(eventsQuery);
            const eventsData: Event[] = [];
            querySnapshot.forEach((doc) => {
                console.log('Event document data:', doc.data()); // Debugging log
                eventsData.push({ id: doc.id, ...doc.data() } as Event);
            });
            console.log('Fetched events data:', eventsData); // Debugging log
            return eventsData;
        } catch (error) {
            console.error('Error fetching user events:', error); // Error log
            return [];
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }) as UserData);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (auth.currentUser && formData) {
            const userDocRef = doc(firestore, 'Users', auth.currentUser.uid);
            await updateDoc(userDocRef, { ...formData } as any);
            setUserData(formData);
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
                            <InfoItem>
                                <Label>Role:</Label> <Value>{capitalizeFirstLetter(userData.role)}</Value>
                            </InfoItem>
                            <InfoItem>
                                <Label>Posts Created:</Label> <Value>{posts.length}</Value>
                            </InfoItem>
                        </InfoSection>
                    )
                ) : (
                    <div>No user data available</div>
                )}
                <div>
                    {posts.map((post) => (
                        <PostContainer key={post.id}>
                            <PostTitle>{post.title}</PostTitle>
                            <PostContent>{post.content}</PostContent>
                        </PostContainer>
                    ))}
                </div>
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