import React, { useState } from 'react';
import EventForm from '../../components/EventForm';
import Navbar from '../../components/Navbar';
import GlobalStyle from "../page";

// This page is the intake form where admins can create new events
const EventFormPage = () => {
  return (
    <div>
      <EventForm />
    </div>
  );
};

export default EventFormPage;