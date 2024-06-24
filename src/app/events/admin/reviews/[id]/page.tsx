"use client"

import React from 'react';
import ReviewsDisplay from '@/components/feedbackComponents/ReviewDisplay';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";

// TODO:
// Only Admin can use this

// This page shows the reviews of an event
const ReviewsPage= ({ params }: { params: { id: string } }) => {
    const eventId = params.id;

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