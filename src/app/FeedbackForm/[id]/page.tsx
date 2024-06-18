"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../../components/styling";
import { FeedbackForm } from '../../../components/FeedbackForm';
import { Timestamp } from 'firebase/firestore';
import { Review, Event } from '../../../components/types';
import { onSubmit } from '../../../components/feedbackUtils';
import { firestore as db } from '../../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// This page shows the complete view of an event
const FeedbackFormPage = ({ params }: { params: { id: string } })  => {
    const eventId = params.id;
    const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    const router = useRouter();
    const [event, setEvent] = useState<Event>();

    // Create empty review
    const [newReview, setReview] = useState<Review>({
        comment: '',
        date: Timestamp.fromDate(new Date()),
        images: [],
        shareContact: false,
        name: "",
        email: "",
        id: ""
    });

    // Fetch event to save its name
    useEffect(() => {
        const fetchEvent = async () => {
              const eventRef = doc(db, 'Events', eventId);
              const eventDoc = await getDoc(eventRef);
              const event = eventDoc.data() as Event;
                if (event.reviewedBy.includes(userid)) {
                    alert("You have already submitted feedback for this event.");
                    router.push("/EventPage")
              }
              setEvent(event);
        }
        fetchEvent();

    }, []);
  
return (
    <div style={{background: "#FFF6EE"}}>
      <Navbar/>
      <ThemeProvider theme={theme}>
        { event &&
          <FeedbackForm event={event} review={newReview} onSubmit={onSubmit}/>
        }
        </ThemeProvider>
    </div>
    );
};

export default FeedbackFormPage;