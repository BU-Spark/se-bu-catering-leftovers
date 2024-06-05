"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import styled, { createGlobalStyle } from 'styled-components';
import styles from '../styles/Home.module.css';
import FAQList from '../components/faq.js';
import { signInWithRedirect, getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp, provider } from '../../firebaseConfig';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
`;

const SectionContainer = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
`;

const HeroContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
`;

const FullWidthImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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

const handleSignUp = async (userRole: 'Student' | 'Administrator') => {
  try {
    console.log("Redirecting for sign-up:", userRole);
    localStorage.setItem('userRole', userRole);
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Failed to redirect for sign-up:", error);
  }
};

const Home = () => {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const storedUserRole = localStorage.getItem('userRole');
          console.log("User role from localStorage:", storedUserRole);

          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            console.log('User already exists, logging in');
            const userData = userDoc.data();
            setUserName(userData.name);
            setUserRole(userData.role);
          } else if (storedUserRole) {
            const displayName = user.displayName || 'Unknown';
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              role: storedUserRole,
              name: displayName
            });
            console.log('User signed up successfully');
            setUserName(displayName);
            setUserRole(storedUserRole);
            localStorage.removeItem('userRole');
          }
        }
      });

      return () => unsubscribe();
    }
  }, [mounted]);

  if (!mounted) return null;

  return (
      <div>
        <GlobalStyle />
        <Navbar />
        <div className={styles.container}>
          <Head>
            <title>Reduce Wasted Food</title>
          </Head>

          <main className={styles.main}>
            <section className={styles.hero}>
              <HeroContainer>
                <FullWidthImage
                    src="/landing-page.png"
                    alt="Students holding food"
                    layout="fill"
                    priority
                />
              </HeroContainer>
              <h1 className={styles.title}>Reduce Wasted Food</h1>
              <ButtonContainer>
                <button className={styles.loginButton} onClick={handleLogin}>
                  {userName ? `Welcome ${userName}` : 'Login'}
                </button>
              </ButtonContainer>
            </section>

            <SectionContainer>
              <section className={styles.howItWorks}>
                <h2>How it Works</h2>
                <section className={styles.steps}>
                  <button className={styles.step}>
                    <Image src="/signup-icon.svg" alt="Pencil Icon" width={45} height={45} />
                    Sign up
                  </button>
                  <button className={styles.step}>
                    <Image src="/terms-conditions.svg" alt="Paper and Pencil Icon" width={45} height={45} />
                    Agree on Terms
                  </button>
                </section>
                <section className={styles.steps}>
                  <button className={styles.step}>
                    <Image src="/notification.svg" alt="Bell icon" width={45} height={45} />
                    Get notified
                  </button>
                  <button className={styles.step}>
                    <Image src="/pickup-food.svg" alt="Hamburger Icon" width={45} height={45} />
                    Pickup food
                  </button>
                </section>
              </section>
            </SectionContainer>

            <ButtonContainer>
              <section className={styles.signup}>
                <button className={styles.signupButton} onClick={() => handleSignUp('Student')}>Student Sign Up</button>
                <button className={styles.signupButton} onClick={() => handleSignUp('Administrator')}>Administrator Sign Up</button>
              </section>
            </ButtonContainer>

            <section className={styles.faq}>
              <h2>FAQ</h2>
              <FAQList />
            </section>
          </main>
        </div>
      </div>
  );
};

export default Home;