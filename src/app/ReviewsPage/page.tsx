"use client"

import React from 'react';
import ReviewsDisplay from '../../components/ReviewDisplay';
import Navbar from '../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../functions/styling";

const ReviewsPage: React.FC = () => {
    const eventId = 'XeyE3GplA5Lqoymjxgcg'; // Replace with the actual event ID
        
    return (
        <div>
            <ThemeProvider theme={theme}>
                <Navbar/>
                <ReviewsDisplay eventId={eventId} />
            </ThemeProvider>
        </div>
    );
    };

export default ReviewsPage;