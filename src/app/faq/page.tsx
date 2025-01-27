"use client";

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCaretDown } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const FAQContainer = styled.div`
    margin: 20px;
    padding: 10px;
    padding-top: 100px;
`;

const FAQCategory = styled.div`
    margin-bottom: 40px;
`;

const SectionHeader = styled.h2`
    font-size: 2em;
    color: #000;
    margin-top: 40px;
    margin-bottom: 20px;
    font-family: 'Arial', sans-serif;
`;

const Question = styled.div`
    background: #FFF0F0;
    color: #BC261A;
    padding: 10px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 5px;
    gap: 10px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: 'Arial', sans-serif;
`;

const Answer = styled.div<{ show: boolean }>`
    background: rgba(255, 240, 240, 0.5);
    padding: 10px;
    border: 1px solid #FFF0F0;
    border-radius: 10px;
    color: rgba(0, 0, 0, 0.87);
    display: ${props => (props.show ? 'block' : 'none')};
    font-family: 'Arial', sans-serif;
    margin-top: 5px;
    margin-bottom: 15px;
`;

const Icon = styled(FaCaretDown)<{ rotate: boolean }>`
    transition: transform 0.3s ease-in-out;
    transform: ${props => (props.rotate ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

interface FAQItemProps {
    question: string;
    answer: string;
    isActive: boolean;
    onClick: () => void;
}

const CollapsibleFAQItem: React.FC<FAQItemProps> = ({ question, answer, isActive, onClick }) => (
    <div>
        <Question onClick={onClick}>
            {question}
            <Icon rotate={isActive} />
        </Question>
        <Answer show={isActive}>
            {answer}
        </Answer>
    </div>
);

interface FAQ {
    question: string;
    answer: string;
}

interface FAQCategory {
    category: string;
    items: FAQ[];
}

const FAQPage: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<string | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setIsAuthenticated(!!user);
            if (user) {
                const userDocRef = doc(firestore, 'Users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setAgreedToTerms(userDoc.data().agreedToTerms);
                }
            }
        });

        return () => unsubscribe();
    }, [auth]);



    const faqs: FAQCategory[] = [
        {
            category: "General Information",
            items: [
                {
                    question: "Who can use BU Leftover to get free food?",
                    answer: "All students from Boston University."
                },
                {
                    question: "How can I provide feedback?",
                    answer: "You can provide feedback on food pick up process under events section."
                },
                {
                    question: "What if I have a food allergy or dietary restriction?",
                    answer: "If you have food allergies or dietary restrictions, it is recommended that you do not participate in this program. There will not be personnel available to address questions related to dietary restrictions, ingredients, or food allergies."
                },
            ]
        },
        {
            category: "Students",
            items: [
                {
                    question: "How do I sign up for an account?",
                    answer: "You can sign up by clicking the 'Sign Up' button on the home page and selecting your role as a Student."
                },
                {
                    question: "Can I receive notifications for specific campuses?",
                    answer: "Yes, you can customize your notification preferences in the settings."
                },
                {
                    question: "Is there a specific time limit to pick up food?",
                    answer: "Yes, you must pick up food within 30 minutes of receiving a notification."
                },
            ]
        },
        {
            category: "Administration",
            items: [
                {
                    question: "How do I sign up for an account?",
                    answer: "You can sign up by clicking the 'Sign Up' button on the home page and selecting your role as an Administrator."
                },
                {
                    question: "Can I edit the posts that are published?",
                    answer: "Yes, you can edit posts by first click on your event, then click on the red pen located on the top left of the page."
                },
                {
                    question: "Where can I view students' feedback?",
                    answer: "You can view students' feeback at the end of the event details."
                },
                {
                    question: "Where can I find past events?",
                    answer: "You can view past events under your account tab."
                },
            ]
        }
    ];

    const toggleFAQ = (index: string) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div>
            <Navbar user={isAuthenticated} agreedToTerms={agreedToTerms}/>
            <FAQContainer>
                {faqs.map((category, catIndex) => (
                    <FAQCategory key={catIndex}>
                        <SectionHeader>{category.category}</SectionHeader>
                        {category.items.map((faq, index) => (
                            <CollapsibleFAQItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isActive={activeIndex === `${catIndex}-${index}`}
                                onClick={() => toggleFAQ(`${catIndex}-${index}`)}
                            />
                        ))}
                    </FAQCategory>
                ))}
            </FAQContainer>
        </div>
    );
};

export default FAQPage;
