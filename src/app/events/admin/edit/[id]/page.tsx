"use client";

import React, { useEffect, useState } from 'react';
import EventForm from '@/components/formComponents/EventForm';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";
import { doc, getDoc } from 'firebase/firestore';
import { Event } from '@/types/types';
import { firestore as db} from '@/../firebaseConfig';
import { notFound } from 'next/navigation';
import { onUpdate } from '@/utils/eventUtils';

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
          <Navbar />
          {event && <EventForm event={event} onPublish={onUpdate} />}
        </ThemeProvider>
      </div>
  );
};

export default EditEventFormPage;
