"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCaretDown } from 'react-icons/fa';

const FAQContainer = styled.div`
    margin: 20px;
    padding: 10px;
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
    gap: 20px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);;
`;

const Answer = styled.div`
    background: #fff;
    padding: 10px;
    border-top: 1px solid #ccc;
    color: #666;
    display: none;
`;

const Icon = styled(FaCaretDown)`
    transition: transform 0.3s ease-in-out;
`;

const FAQList = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const faqs = [
        {
            question: "Who can use BU Leftover to get free food?",
            answer: "All current BU students and staff"
        },
        {
            question: "How can I provide feedback regarding the food pick up process?",
            answer: "You can provide feedback to help us imporve the food pick up process"
        },
    ];

    const toggleFAQ = index => {
        setActiveIndex(activeIndex === index ? null : index);
    };
    return(
        <FAQContainer>
            {faqs.map((faq, index) => (
                <div key={index}>
                    <Question onClick={() => toggleFAQ(index)}>
                        {faq.question}
                        <Icon style={{ transform: activeIndex === index ? "rotate(180deg)" : "rotate(0deg)" }}/>
                    </Question>
                    <Answer style={{display: activeIndex === index ? 'block' : 'none'}}>
                        {faq.answer}
                    </Answer>
                </div>
            ))}
        </FAQContainer>
    );
};

export default FAQList;