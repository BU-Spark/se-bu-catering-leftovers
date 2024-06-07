"use client";

import React, { useState } from 'react';
import EventForm from '../../components/EventForm';
import Navbar from '../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../functions/styling";
import { addDoc, updateDoc, arrayUnion, collection, doc, Timestamp } from 'firebase/firestore';
import { Event } from '../functions/types';
import { firestore as db} from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

// This page is the intake form where admins can create new events
const EventFormPage = () => {
  const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication

  // Create empty event
  const [newEvent, setNewEvent] = useState<Event>({
      host: '',
      name: '',
      googleLocation: '',
      location: '',
      campusArea: '',
      notes: '',
      duration: '30',
      foodArrived: Timestamp.fromDate(new Date()),
      foodAvailable: Timestamp.fromDate(new Date()),
      foods: [{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' }],
      status: 'closed',
      images: [],
      id: ""
  });

  const onPublish = async (event: Event) => {
        try {
            // add event to database
            const eventRef = await addDoc(collection(db, 'Events'), event);
            // add id to event
            await updateDoc(eventRef, { id: eventRef.id });

            // add event id to user
            const userRef = doc(db, 'Users', userid);
            await updateDoc(userRef, { events: arrayUnion(eventRef.id) });

            alert('Event published successfully');
        } catch (error) {
            console.error('Error publishing event: ', error);
            alert('Failed to publish event');
          }
  }

  return (
    <div>
      <Navbar/>
      <ThemeProvider theme={theme}>
        <EventForm event={newEvent} onPublish={onPublish}/>
      </ThemeProvider>
    </div>
  );
};

export default EventFormPage;