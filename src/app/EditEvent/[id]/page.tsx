"use client";

import React, { useEffect, useState } from 'react';
import EventForm from '../../../components/EventForm';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../functions/styling";
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { Event } from '../../functions/types';
import { firestore as db} from '../../../../firebaseConfig';
import { notFound } from 'next/navigation';

// This page is the intake form where admins can create new events
const EditEventFormPage = ({ params }: { params: { id: string } }) => {
  const eventUID = params.id;
  const [event, setEvent] = useState<Event>();
  const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication

  useEffect(() => {
    const fetchEvent = async (id: string) =>  {
      const docRef = doc(db, 'Events', id);
      const docSnap = await getDoc(docRef);
      
      console.log("id: ", id);
      if (!docSnap.exists()) {
        notFound();
      }
      const loadedEvent = docSnap.data() as Event;

      setEvent(loadedEvent);
    }
    fetchEvent(eventUID);

  }, []);
  
  const onPublish = async (event: Event) => {
    try {
        const eventRef = doc(db, 'Events', event.id);
        // add event to database
        const updatePayload: { [key: string]: any } = { ...event };

        await updateDoc(eventRef, updatePayload);

        alert('Event updated successfully');
        return event.id;
    } catch (error) {
        console.error('Error updating event: ', error);
        alert('Failed to update event');
        return "";
      }
    }

  return (
    <div>
      <ThemeProvider theme={theme}>
      <Navbar/>
        {event &&
          <EventForm event={event} onPublish={onPublish}/>
        }
      </ThemeProvider>
    </div>
  );
};

export default EditEventFormPage;