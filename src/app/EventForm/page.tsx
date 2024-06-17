"use client";

import React, { useState } from 'react';
import EventForm from '../../components/EventForm';
import Navbar from '../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../functions/styling";
import { Timestamp } from 'firebase/firestore';
import { Event } from '../../functions/types';
import { v4 as uuidv4 } from 'uuid';
import { onPublish } from '../../functions/eventUtils';
import { Location } from '@/functions/types';

// TODO:
// Bigger location on eventCard
// Only Admin can use this
// Bug: When go back from preview, event dissapears
// Delete old images
// Delete images on user when deleted on form
// Delete old events
// Ask if would like to save before leaving?
// Bug: campus area not updating on first time
// Save logic: If open, stays open?

// Client questions:
// Save redirects?
// Keep alerts?
// Default view if there are no events or reviews?

// This page is the intake form where admins can create new events
const EventFormPage = () => {
  const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication

  // Create empty event
  const [newEvent, setNewEvent] = useState<Event>({
      host: '',
      name: '',
      Location: {} as Location,
      location: '',
      campusArea: '',
      notes: '',
      duration: '30',
      foodArrived: Timestamp.fromDate(new Date()),
      foodAvailable: Timestamp.fromDate(new Date()),
      foods: [{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' }],
      status: 'closed',
      images: [],
      id: "",
      reviewedBy: []
  });

  return (
    <div>
      <ThemeProvider theme={theme}>
      <Navbar/>
        <EventForm event={newEvent} onPublish={onPublish}/>
      </ThemeProvider>
    </div>
  );
};

export default EventFormPage;