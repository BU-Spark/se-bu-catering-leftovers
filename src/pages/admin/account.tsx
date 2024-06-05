"use client";

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '../../../firebaseConfig';
import { UserData } from '@/types';
import Navbar from '../../components/Navbar';

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

const FeedbackLink = styled.a`
    color: #000;
    text-decoration: none;
    margin-top: 20px;
    &:hover {
        text-decoration: underline;
    }
`;

const Input = styled.input`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    width: 100%;
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

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const AdminAccountPage = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserData | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserData;
                    setUserData(data);
                    setFormData(data);
                }
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

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
                                <Label>Post Created:</Label> <Value>{userData.postsCreated || 'N/A'}</Value>
                            </InfoItem>
                        </InfoSection>
                    )
                ) : (
                    <div>No user data available</div>
                )}
                <FeedbackLink href="/feedback">View Feedback Section</FeedbackLink>
            </Container>
        </div>
    );
};

export default AdminAccountPage;
