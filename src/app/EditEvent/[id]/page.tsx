"use client";

import React, { useEffect, useState } from 'react';
import EventForm from '../../../components/EventForm';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/components/styling";
import { doc, getDoc } from 'firebase/firestore';
import { Event } from '@/components/types';
import { firestore as db } from '../../../../firebaseConfig';
import { notFound } from 'next/navigation';
import { onUpdate } from '@/components/eventUtils';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Arial, sans-serif;
  }
`;

const EditEventFormPage = ({ params }: { params: { id: string } }) => {
  const eventUID = params.id;
  const [event, setEvent] = useState<Event>();
  const userid = "xQXZfuSgOIfCshFKWAou";

  useEffect(() => {
    const fetchEvent = async (id: string) => {
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

  return (
      <div>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <Navbar />
          {event && <EventForm event={event} onPublish={onUpdate} />}
        </ThemeProvider>
      </div>
  );
};

export default EditEventFormPage;
