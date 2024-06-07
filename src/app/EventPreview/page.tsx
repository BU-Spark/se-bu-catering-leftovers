"use client";

import React from 'react';
import EventPreview from '../../components/EventPreview';
import Navbar from '../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../functions/styling";

// This page shows the complete view of an event
const EventPreviewPage = () => {

  return (
    <div style={{background: "#FFF6EE"}}>
      <Navbar/>
      <ThemeProvider theme={theme}>
        <EventPreview />
      </ThemeProvider>
    </div>
  );
};

export default EventPreviewPage;