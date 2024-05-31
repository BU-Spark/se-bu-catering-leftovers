"use client";

import Head from 'next/head';
import Image from "next/image";
import Navbar from '../components/Navbar';
import styled, { createGlobalStyle } from 'styled-components';
import styles from '../styles/Home.module.css';
import FAQList from '../components/faq.js';

export const GlobalStyle = createGlobalStyle`
  body{
    margin: 0;
    padding: 0;
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
  height: 80vh;  
  overflow: hidden; 
`;


export default function Home() {
  return (
      <div>
        <GlobalStyle/>
        <Navbar/>
        <div className={styles.container}>
          <Head>
            <title>Reduce Wasted Food</title>
          </Head>

          <main className={styles.main}>
            <section className={styles.hero}>
              <HeroContainer>
                <Image
                    src="/landing-page.png"
                    alt="Students holding food"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                />
              </HeroContainer>
              <h1 className={styles.title}>Reduce Wasted Food</h1>
              <button className={styles.loginButton}>Login</button>
            </section>

            <SectionContainer>
            <section className={styles.howItWorks}>
              <h2>How it Works</h2>
              <section className={styles.steps}>
                <button className={styles.step}>
                  <Image src="/signup-icon.svg" alt="Pencil Icon" width={45} height={45}/>
                  Sign up
                </button>
                <button className={styles.step}>
                  <Image src="terms-conditions.svg" alt="Paper and Pencil Icon" width={45} height={45}/>
                  Agree on Terms
                </button>
              </section>
              <section className={styles.steps}>
                <button className={styles.step}>
                  <Image src="notification.svg" alt="Bell icon" width={45} height={45}/>
                  Get notified
                </button>
                <button className={styles.step}>
                  <Image src="pickup-food.svg" alt="Hamburger Icon" width={45} height={45}/>
                  Pickup food
                </button>
              </section>
            </section>
            </SectionContainer>

            <ButtonContainer>
            <section className={styles.signup}>
              <button className={styles.signupButton}>Student Sign Up</button>
              <button className={styles.signupButton}>Administration Sign Up</button>
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
}
