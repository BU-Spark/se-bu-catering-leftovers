"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";
import { Timestamp } from 'firebase/firestore';
import { Event } from '@/types/types';
import { v4 as uuidv4 } from 'uuid';
import { onPublish } from '@/utils/eventUtils';
import { Location } from '@/types/types';

// Dynamically import EventForm to avoid SSR issues
const EventForm = dynamic(() => import('@/components/formComponents/EventForm'), { ssr: false });

const defaultAddress: Location = {
    name: "BU Campus",
    address: 'Boston University, 899 Commonwealth Avenue, Boston, MA',
    abbreviation: 'Boston University',
    lat: '42.350499',
    lon: '-71.105399',
    campus_section: 'Central'
};

const EventFormPage = () => {
    const [newEvent, setNewEvent] = useState<Event>({
        host: '',
        name: '',
        Location: defaultAddress,
        locationDetails: '',
        notes: '',
        duration: '30',
        foodArrived: Timestamp.fromDate(new Date()),
        foodAvailable: Timestamp.fromDate(new Date()),
        foods: [{ id: uuidv4(), quantity: '', item: '', unit: '' }, { id: uuidv4(), quantity: '', item: '', unit: '' }, { id: uuidv4(), quantity: '', item: '', unit: '' }],
        status: 'drafted',
        images: [],
        id: "",
        reviewedBy: [],
    });

    return (
        <div>
            <ThemeProvider theme={theme}>
                <Navbar user={true} agreedToTerms={true}/>
                <EventForm event={newEvent} onPublish={onPublish} />
            </ThemeProvider>
        </div>
    );
};

export default EventFormPage;
