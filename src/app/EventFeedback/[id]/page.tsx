"use client"

import React from 'react';
import ReviewsDisplay from '../../../components/ReviewDisplay';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../../components/styling";

// TODO:
// Only Admin can use this
// 

// Client questions:
// Show all feedbacks or by event?
// Average rating of event?
// Show user who gave feedback?

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