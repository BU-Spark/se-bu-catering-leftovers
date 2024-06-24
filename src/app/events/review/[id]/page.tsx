"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@/styles/styling";
import { FeedbackForm } from '@/components/feedbackComponents/FeedbackForm';
import { Timestamp } from 'firebase/firestore';
import { Review, Event } from '@/types/types';
import { onSubmit } from '@/utils/feedbackUtils';
import { firestore as db } from '@/../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useUser } from "@/context/UserContext";

// This page shows the complete view of an event
const FeedbackFormPage = ({ params }: { params: { id: string } })  => {
    const eventId = params.id;
    const { user } = useUser();
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
              if (user) {
                if (event.reviewedBy.includes(user.uid)) {
                  alert("You have already submitted feedback for this event.");
                  router.push("/events/explore")
                }
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