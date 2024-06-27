"use client";

import React from 'react';
import EventPreview from '@/components/eventComponents/EventPreview';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";

const EventPreviewPage = ({ params }: { params: { id: string } }) => {
    const eventId = params.id;

    return (
        <div style={{background: "#FFF6EE"}}>
            <Navbar />
            <ThemeProvider theme={theme}>
                <EventPreview eventId={eventId} isNew={true}/>
            </ThemeProvider>
        </div>
    );
};

export default EventPreviewPage;