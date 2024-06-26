"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '@/../firebaseConfig';
import styled from 'styled-components';
import Navbar from '@/components/Navbar';

const LogoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
    padding-top: 100px;
`;

const Message = styled.p`
    font-size: 1.5em;
    color: #BC261A;
    margin-bottom: 20px;
    font-family: 'Arial', sans-serif;
    font-weight: bold;
`;

const Button = styled.button`
    background-color: #BC261A;
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 10px 20px;
    font-size: 1em;
    cursor: pointer;
    margin: 10px;
    &:hover {
        background-color: #a21d18;
    }
`;

const Logout: React.FC = () => {
    const router = useRouter();
    const auth = getAuth(firebaseApp);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/'); // Redirect to home page after logout
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const handleReturn = () => {
        router.back(); // Redirect back
    };

    return (
        <div>
            <Navbar />
            <LogoutContainer>
                <Message>Are you sure you want to logout?</Message>
                <Button onClick={handleLogout}>Logout</Button>
                <Button onClick={handleReturn}>Return to Home Page</Button>
            </LogoutContainer>
        </div>
    );
};

export default Logout;
