"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaCaretDown } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/../firebaseConfig";
import { set } from "date-fns";
import { Box, Typography } from "@mui/material";

const PageContainer = styled.div`
  margin: 20px;
  padding: 20px;
  padding-top: 100px;
`;

const Title = styled.h1`
  font-size: 2.5em;
  color: #000;
  margin-bottom: 10px;
  font-family: "Arial", sans-serif;
`;

const Subtitle = styled.p`
  font-size: 1.2em;
  color: #666;
  margin-bottom: 20px;
  font-family: "Arial", sans-serif;
`;

const FAQContainer = styled.div`
  margin-bottom: 40px;
  max-width: 800px;
  color: black;
`;

const SectionHeader = styled.h2`
  font-size: 2em;
  color: #000;
  margin-bottom: 20px;
`;

const Question = styled.div`
  background: #fff0f0;
  color: #bc261a;
  padding: 10px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 5px;
  gap: 20px;
  margin-bottom: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: "Arial", sans-serif;
`;

const Answer = styled.div<{ show: boolean }>`
  background: rgba(255, 240, 240, 0.5);
  padding: 10px;
  border: 1px solid #fff0f0;
  border-radius: 10px;
  color: rgba(0, 0, 0, 0.87);
  display: ${(props) => (props.show ? "block" : "none")};
  font-family: "Arial", sans-serif;
  margin-top: 5px;
  margin-bottom: 15px;
`;

const Icon = styled(FaCaretDown)<{ rotate: boolean }>`
  transition: transform 0.3s ease-in-out;
  transform: ${(props) => (props.rotate ? "rotate(180deg)" : "rotate(0deg)")};
`;

interface CollapsibleFAQItemProps {
  question: string;
  answer: string;
  isActive: boolean;
  onClick: () => void;
}

const CollapsibleFAQItem: React.FC<CollapsibleFAQItemProps> = ({
  question,
  answer,
  isActive,
  onClick,
}) => (
  <div>
    <Question onClick={onClick}>
      {question}
      <Icon rotate={isActive} />
    </Question>
    <Answer show={isActive}>{answer}</Answer>
  </div>
);

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
  font-family: "Arial", sans-serif;
`;

const Checkbox = styled.input`
  margin-right: 10px;
`;

const Button = styled.button`
  background-color: #bc261a;
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  margin-top: 20px;
  font-family: "Arial", sans-serif;
  &:hover {
    background-color: #a21d18;
  }
`;

const Popup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  text-align: center;
  font-family: "Arial", sans-serif;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const TermsConditionsPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        const userDocRef = doc(firestore, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setAgreedToTerms(userDoc.data().agreedToTerms);
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const faqs = [
    {
      category: "General Information",
      items: [
        {
          question: "Food Pickup Policy",
          answer: "You will need to arrive within the time remaining and bring your own containers in order to pick up food",
        },
        {
          question: "BU Legal Policy",
          answer: "Please Read Through Terms and Conditions before agreeing",
        },
        {
          question: "Allergen Policy",
          answer:
            "If you have food allergies or dietary restrictions, it is recommended that you do not participate in this program. There will not be personnel available to address questions related to dietary restrictions, ingredients, or food allergies.",
        },
      ],
    },
  ];

  const toggleFAQ = (index: string) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleAgree = async () => {
    if (agreed) {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(firestore, "Users", user.uid);
          await updateDoc(userDocRef, {
            agreedToTerms: true,
          });
          setAgreedToTerms(true);
          router.push("/events/explore"); // Redirect to home page after agreement
        } catch (error) {
          console.error("Error updating user agreement:", error);
        }
      }
    } else {
      setShowPopup(true);
    }
  };

  const handleUnagree = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(firestore, "Users", user.uid);
        await updateDoc(userDocRef, {
          agreedToTerms: false,
        });
        setAgreedToTerms(false);
      } catch (error) {
        console.error("Error updating user agreement:", error);
      }
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div style={{
      color: "black",
    }}>
      <Navbar user={isAuthenticated} agreedToTerms={agreedToTerms} />
      <PageContainer>
        <Title>Terms and Conditions</Title>
        <Subtitle>
          You must agree to all conditions in order to get notifications.
        </Subtitle>
        {/* {faqs.map((category, catIndex) => (
                    <FAQContainer key={catIndex}>
                        {category.items.map((faq, index) => (
                            <CollapsibleFAQItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isActive={activeIndex === `${catIndex}-${index}`}
                                onClick={() => toggleFAQ(`${catIndex}-${index}`)}
                            />
                        ))}
                    </FAQContainer>
                ))} */}
        <FAQContainer>
            <b>
              1. By signing up for the program, you agree to the following
              terms:
            </b>
            <br />
            You will receive email notifications when leftover food is available
            from catering events.
            <br />
            <br />
            <b>2. Program Rules:</b>
            <br />
            <b>Notifications:</b> The email notification will provide the
            location, quantity, and type of food available.
            <br />
            <b>Pickup Window:</b>
            <br />
            Students will have a specified window of time to pick up leftover
            food, starting from the time the notification is sent. The duration
            of the pickup window will be included in the notification, along
            with a live countdown on the online event posting.
            <br />
            <b>Availability:</b>
            <br />
            Food is available on a first-come, first-served basis. BU Dining
            cannot guarantee availability of food for the entire duration of the
            pickup window.
            <br />
            <b>Food Allergies and Dietary Restrictions:</b>
            <br />
            If you have food allergies or dietary restrictions, it is
            recommended that you do not participate in this program. There will
            not be personnel available to address questions related to dietary
            restrictions, ingredients, or food allergies.
            <br />
            <b>Containers:</b>
            <br />
            Catering on the Charles will provide containers for students to use.
            <br />
            <b>Food Safety:</b>
            <br />
            To avoid illness, food should be consumed or refrigerated
            immediately.
            <br />
          <div style={{ height: 100 }} />
        </FAQContainer>
        {isAuthenticated ? (
          <>
            {agreedToTerms ? (
              <>
                <Subtitle>
                  You have already agreed to the terms and conditions.
                </Subtitle>
                <Button onClick={handleUnagree}>
                  Unaccept Terms and Conditions
                </Button>
              </>
            ) : (
              <>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                  />
                  <label>I agree to all conditions</label>
                </CheckboxContainer>
                <Button onClick={handleAgree}>Proceed</Button>
              </>
            )}
          </>
        ) : (
          <Subtitle>
            Please sign in to agree to the terms and conditions.
          </Subtitle>
        )}
      </PageContainer>
      {showPopup && (
        <>
          <Overlay onClick={closePopup} />
          <Popup>
            <p>You must agree to all conditions before continuing.</p>
            <Button onClick={closePopup}>Close</Button>
          </Popup>
        </>
      )}
    </div>
  );
};

export default TermsConditionsPage;
