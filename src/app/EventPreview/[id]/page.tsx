"use client";

import React from 'react';
import EventPreview from '../../../components/EventPreview';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/components/styling";
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Arial, sans-serif;
  }
`;

const EventPreviewPage = ({ params }: { params: { id: string } }) => {
    const eventId = params.id;

    return (
        <div style={{background: "#FFF6EE"}}>
            <GlobalStyle />
            <Navbar />
            <ThemeProvider theme={theme}>
                <EventPreview eventId={eventId} />
            </ThemeProvider>
        </div>
    );
};

export default EventPreviewPage;
