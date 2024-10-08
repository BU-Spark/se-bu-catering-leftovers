"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import styled, { createGlobalStyle } from 'styled-components';
import styles from '@/styles/Home.module.css';
import { signInWithPopup, getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp, provider } from '@/../firebaseConfig';
import { useRouter } from 'next/navigation';
import { Typography } from '@mui/material';

interface UserData {
  userName: string | null;
  userRole: string | null;
}

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
  font-size: 2em;
  color: white;
  margin-bottom: 50px;
  padding-bottom: 100px;
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

const handleLogin = () => {
  console.log("Redirecting for login");
  signInWithPopup(auth, provider)
      .then((result) => {
        // Handle the signed-in user info.
      })
      .catch((error) => {
        console.error("Failed to redirect for login:", error);
      });
};

const handleSignUp = () => {
  console.log("Redirecting for sign-up");
  localStorage.setItem('userRole', 'User');
  signInWithPopup(auth, provider)
      .then((result) => {
        // Handle the signed-in user info.
      })
      .catch((error) => {
        console.error("Failed to redirect for sign-up:", error);
      });
};


const Home = (): JSX.Element => {
  const [user, setUser] = useState<UserData>({ userName: null, userRole: null });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const storedUserRole = localStorage.getItem('userRole');
        console.log("User role from localStorage:", storedUserRole);

        const userDocRef = doc(firestore, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as any;
          setUser({ userName: userData.name, userRole: userData.role });

          // Check if the user has agreed to terms
          if (userData.agreedToTerms) {
            router.push('/events/explore');
          } else {
            router.push('/terms'); // Redirect to terms and conditions if they haven't agreed
          }
        } else if (storedUserRole) {
          const displayName = user.displayName || 'Unknown';
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            role: storedUserRole || "User",
            name: displayName,
            timePref: "",
            locPref: "",
            foodPref: "",
            events: [],
            reviews: [],
            agreedToTerms: false,
          });

          setUser({ userName: displayName, userRole: storedUserRole || 'User' });
          router.push('/terms');
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]); // Add 'router' to the dependency array

  // Admin Token
  const handleAdminSignUp = () => {
    const adminToken = prompt("Enter administrator token or press 'cancel' to register as a student:");

    // Immediately attempt to sign up to see if it circumvents the popup blocker.
    if (adminToken === "Terriers2024!") {
      console.log("Admin token correct, attempting to sign up as admin...");
      localStorage.setItem('userRole', 'Admin');
      signInWithPopup(auth, provider)
          .then((result) => {
            // Success, handle the result
            console.log("Admin signed in successfully.");
          })
          .catch((error) => {
            console.error("Failed to sign up as admin:", error);
          });
    } else {
      // Handle other cases similarly directly
      console.log("Handling non-admin sign up or cancellation...");
      handleSignUp();
    }
  };


  return (
      <div>
        <GlobalStyle />
        <Navbar user={!!user.userName} />
        <div className={styles.container}>
          <Head>
            <title>Reduce Wasted Food</title>
          </Head>

          <main className={styles.main}>
            <section className={styles.hero}>
              <HeroContainer>
                <Typography fontSize="1.8rem" fontFamily="Arial, sans-serif" fontWeight="600" color="#FFF">Reduce Wasted Food</Typography>
                {!user.userName ? (
                    <ButtonContainer>
                      <StyledButton onClick={handleLogin}>Login</StyledButton>
                      <StyledButton onClick={handleAdminSignUp}>Sign Up</StyledButton>
                    </ButtonContainer>
                ) : (
                    <StyledMessage>Welcome, {user.userName}</StyledMessage>
                )}
              </HeroContainer>
            </section>
          </main>
        </div>
      </div>
  );
};

export default Home;
