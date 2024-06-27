"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import styled, { createGlobalStyle } from 'styled-components';
import styles from '@/styles/Home.module.css';
import { signInWithRedirect, getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp, provider } from '@/../firebaseConfig';
import { useRouter } from 'next/navigation';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
    height: 100%;
  }
  #__next {
    height: 100%;
  }
`;

const HeroContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-image: url('/landing-page.png');
  background-size: cover;
  background-position: center;
`;

const StyledButton = styled.button`
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  cursor: pointer;
  margin: 0 10px;
  border-radius: 25px;
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: #b71c1c;
    transform: scale(1.05);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  z-index: 1;
`;

const StyledTitle = styled.h1`
  font-size: 2rem;
  color: white;
  margin-bottom: 50px;
  text-align: center;
  z-index: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const StyledMessage = styled.h2`
  background-color: rgba(211, 47, 47, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  margin-top: 100px;
  text-align: center;
  font-size: 1rem;
  z-index: 1;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
`;

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

const handleLogin = async () => {
  try {
    console.log("Redirecting for login");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Failed to redirect for login:", error);
  }
};

const handleSignUp = async () => {
  try {
    console.log("Redirecting for sign-up");
    localStorage.setItem('userRole', 'User');
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Failed to redirect for sign-up:", error);
  }
};

const Home = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const storedUserRole = localStorage.getItem('userRole');
        console.log("User role from localStorage:", storedUserRole);

        const userDocRef = doc(firestore, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log('User already exists, logging in');
          const userData = userDoc.data();
          setUserName(userData.name);
          setUserRole(userData.role);
          console.log("User role from Firestore:", userData.role);
          if (userData.role === 'Admin') {
            console.log('Redirecting admin to /events/explore');
            router.push('/events/explore');
          } else {
            console.log('User is not an admin, role:', userData.role);
          }
        } else if (storedUserRole) {
          const displayName = user.displayName || 'Unknown';
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            role: storedUserRole,
            name: displayName,
            timePref: "",
            locPref: "",
            foodPref: "",
            events: [],
            reviews: [],
            agreedToTerms: false,
          });

          console.log('User signed up successfully');
          setUserName(displayName);
          setUserRole(storedUserRole);
          if (storedUserRole === 'Admin') {
            console.log('Redirecting admin to /events/explore after sign-up');
            router.push('/events/explore');
          } else {
            console.log('User signed up as non-admin, role:', storedUserRole);
            router.push('/events/explore');
          }
          localStorage.removeItem('userRole');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Admin Token
  const handleAdminSignUp = async () => {
    const adminToken = prompt("Enter administrator token:");
    if (adminToken === "Terriers2024!") {
      localStorage.setItem('userRole', 'Admin');
    } else {
      alert("Invalid token. You will be signed up as a student.");
      localStorage.setItem('userRole', 'Student');
    }
    await handleSignUp();
  };

  return (
      <div>
        <GlobalStyle />
        <Navbar user={false} />
        <div className={styles.container}>
          <Head>
            <title>Reduce Wasted Food</title>
          </Head>

          <main className={styles.main}>
            <section className={styles.hero}>
              <HeroContainer>
                <StyledTitle>Reduce Wasted Food</StyledTitle>
                {!userName ? (
                    <ButtonContainer>
                      <StyledButton onClick={handleLogin}>Login</StyledButton>
                      <StyledButton onClick={handleAdminSignUp}>Sign Up</StyledButton>
                    </ButtonContainer>
                ) : (
                    <StyledMessage>Welcome, {userName}</StyledMessage>
                )}
              </HeroContainer>
            </section>
          </main>
        </div>
      </div>
  );
};

export default Home;
