"use client";

import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../../../firebaseConfig';
<<<<<<< HEAD
import { UserData, PostData } from '@/types';
import Navbar from '../../components/Navbar';
import { Typography } from '@mui/material';

const GlobalStyle = createGlobalStyle`
    body {
        font-family: 'Arial', sans-serif;
    }
`;
=======
import Navbar from '../../components/Navbar';
import { User } from '@/types/types';
>>>>>>> admin_permissions

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

const PreferenceSection = styled.div`
    width: 100%;
    max-width: 600px;
    padding: 20px;
    margin-bottom: 20px;
    box-sizing: border-box;
`;

const PreferenceContainer = styled.div`
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
    flex-wrap: wrap;
`;

const PreferenceButton = styled.button<{ selected: boolean }>`
    background-color: ${props => (props.selected ? '#ab0101' : 'transparent')};
    color: ${props => (props.selected ? '#fff' : '#ab0101')};
    border: 1px solid #ab0101;
    border-radius: 20px;
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    &:hover {
        background-color: ${props => (props.selected ? '#a21d18' : '#f1b0b7')};
    }
    &:active {
        background-color: #ab0101;
        color: #fff;
    }
`;

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const StudentAccountPage = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserData | null>(null);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [campusPreferences, setCampusPreferences] = useState<string[]>([]);
    const [foodPreferences, setFoodPreferences] = useState<string[]>([]);

    useEffect(() => {
        const fetchUserData = async (user: any) => {
            if (user) {
                console.log('Current user:', user); // Debugging log
                const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
                if (userDoc.exists()) {
<<<<<<< HEAD
                    const data = userDoc.data() as UserData;
                    console.log('User data from Firestore:', data); // Debugging log
                    setUserData(data);
                    setFormData(data);
                    setCampusPreferences(data.campusPreferences || []);
                    setFoodPreferences(data.foodPreferences || []);
                    await fetchUserPosts(user.uid);
                } else {
                    console.log('No user document found in Firestore.'); // Debugging log
=======
                    setUserData(userDoc.data() as User);
>>>>>>> admin_permissions
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
            await updateDoc(userDocRef, {
                ...formData,
                campusPreferences,
                foodPreferences
            });
            setUserData({ ...formData, campusPreferences, foodPreferences });
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
<<<<<<< HEAD
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
                                <PreferenceSection>
                                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>Notify me with events in</Typography>
                                    <PreferenceContainer>
                                        {['East', 'Central', 'West', 'All'].map(preference => (
                                            <PreferenceButton
                                                key={preference}
                                                selected={campusPreferences.includes(preference)}
                                                onClick={() => handleCampusPreferenceToggle(preference)}
                                            >
                                                {preference}
                                            </PreferenceButton>
                                        ))}
                                    </PreferenceContainer>
                                </PreferenceSection>
                                <PreferenceSection>
                                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>Preference of Food</Typography>
                                    <PreferenceContainer>
                                        {['A', 'B', 'C', 'All'].map(preference => (
                                            <PreferenceButton
                                                key={preference}
                                                selected={foodPreferences.includes(preference)}
                                                onClick={() => handleFoodPreferenceToggle(preference)}
                                            >
                                                {preference}
                                            </PreferenceButton>
                                        ))}
                                    </PreferenceContainer>
                                </PreferenceSection>
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
                            <PreferenceSection>
                                <Typography variant="h6" style={{ fontWeight: 'bold' }}>Notify me with events in</Typography>
                                <PreferenceContainer>
                                    {['East', 'Central', 'West', 'All'].map(preference => (
                                        <PreferenceButton
                                            key={preference}
                                            selected={campusPreferences.includes(preference)}
                                            onClick={() => handleCampusPreferenceToggle(preference)}
                                        >
                                            {preference}
                                        </PreferenceButton>
                                    ))}
                                </PreferenceContainer>
                            </PreferenceSection>
                            <PreferenceSection>
                                <Typography variant="h6" style={{ fontWeight: 'bold' }}>Preference of Food</Typography>
                                <PreferenceContainer>
                                    {['A', 'B', 'C', 'All'].map(preference => (
                                        <PreferenceButton
                                            key={preference}
                                            selected={foodPreferences.includes(preference)}
                                            onClick={() => handleFoodPreferenceToggle(preference)}
                                        >
                                            {preference}
                                        </PreferenceButton>
                                    ))}
                                </PreferenceContainer>
                            </PreferenceSection>
                        </InfoSection>
                    )
=======
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
                    </InfoSection>
>>>>>>> admin_permissions
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
            </Container>
        </div>
    );
};

export default StudentAccountPage;
