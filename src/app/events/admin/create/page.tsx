"use client";

import React, { useState } from 'react';
import EventForm from '@/components/formComponents/EventForm';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";
import { Timestamp } from 'firebase/firestore';
import { Event } from '@/types/types';
import { v4 as uuidv4 } from 'uuid';
import { onPublish } from '@/utils/eventUtils';
import { Location } from '@/types/types';

// TODO:
// Only Admin can use this
// Bug: When go back from preview, event dissapears
// Delete old images
// Delete images on user when deleted on form
// Delete old events
// Ask if would like to save before leaving?

// This page is the intake form where admins can create new events
const EventFormPage = () => {    
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
        status: 'drafted',
        images: [],
        id: "",
        reviewedBy: []
    });


    return (
        <div>
            <ThemeProvider theme={theme}>
                <Navbar />
                <EventForm event={newEvent} onPublish={onPublish} />
            </ThemeProvider>
        </div>
    );
};

export default EventFormPage;