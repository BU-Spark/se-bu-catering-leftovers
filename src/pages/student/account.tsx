"use client";

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const StudentAccountPage = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data() as UserData);
                }
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (isLoading) {
        return <Container>Loading...</Container>;
    }

    return (
        <div>
            <Navbar />
            <Container>
                <Header>
                    My Account <EditIcon src="/edit-icon.svg" alt="Edit" />
                </Header>
                {userData ? (
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
                ) : (
                    <div>No user data available</div>
                )}
                <FeedbackLink href="/feedback">View Feedback Section</FeedbackLink>
            </Container>
        </div>
    );
};

export default StudentAccountPage;