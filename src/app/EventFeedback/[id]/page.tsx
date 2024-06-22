"use client";

import React from 'react';
import ReviewsDisplay from '../../../components/ReviewDisplay';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/components/styling";
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Arial, sans-serif;
  }
`;

const ReviewsPage = ({ params }: { params: { id: string } }) => {
    const eventId = params.id;

    return (
        <div>
            <GlobalStyle />
            <ThemeProvider theme={theme}>
                <Navbar />
                <ReviewsDisplay eventId={eventId} />
            </ThemeProvider>
        </div>
    );
};

export default ReviewsPage;
