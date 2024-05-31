"use client";

import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton, Box, Divider } from '@mui/material';
import {firestore} from '../../firebaseConfig';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';

import { styled } from "@mui/material/styles";

import { ThemeProvider } from '@mui/material/styles';
import { props, theme } from "../components/styling";
import { FoodItem, FoodSelection } from '../components/FoodSelection';
import { DateTimeSelection } from '../components/DateTimeSelection';

// Define the event interface
export interface FormData {
    host: string;
    name: string;
    googleLocation: string;
    location: string;
    campusArea: string;
    notes: string;
    duration: string;
    foodArrived: Timestamp;
    foodAvailable: Timestamp;
    foods: FoodItem[];
    status: string;
    images: string[];
}

// TODO: 
// Add image upload
// Time Limit for Duration
// Choose location Google API)
// Buttons: Preview create functionality, publish redirect
// Add dropdown to allow admin to select Campus Area
// Navigate Back
// Only Admin can use this


// This component is the intake form where admins can create new events
const EventForm: React.FC = () => {
    // Create empty event
    const [formData, setFormData] = useState<FormData>({
        host: '',
        name: '',
        googleLocation: '',
        location: '',
        campusArea: '',
        notes: '',
        duration: '',
        foodArrived: Timestamp.fromDate(new Date()),
        foodAvailable: Timestamp.fromDate(new Date()),
        foods: [],
        status: 'closed',
        images: []
    });

    const [foodItems, setFoodItems] = useState([{ id: uuidv4(), quantity: '', item: '' },{ id: uuidv4(), quantity: '', item: '' },{ id: uuidv4(), quantity: '', item: '' }]);

    const [images, setImages] = useState([]);

    // Save changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Save and publish event on website
    const publishEvent = async (status: string) => {
        const db = firestore;
        try {
            // add event to database
            await addDoc(collection(db, 'Events'), {
                ...formData,
                status: status,
                foods: foodItems.filter(({ quantity, item }) => quantity && item).map(({ quantity, item }) => ({ quantity, item })), // Filter empty food items and delete id
            });
            alert('Event published successfully');
        } catch (error) {
            console.error('Error publishing event: ', error);
            alert('Failed to publish event');
          }
        console.log(formData);
    };

    return (
        <div style={{background: "#FFF6EE"}}>
            <ThemeProvider theme={theme}>
            <Navbar/>
            <Container maxWidth="sm" style={{padding: "1em", paddingTop: "7em", background: "#FFF6EE"}}>
            <Paper elevation={3} style={{ padding: '1em' }}>
                <Grid container xs={12}>
                    <Grid item maxWidth={"40px"}>
                        <IconButton >
                            <ArrowBackIcon color="secondary"/>
                        </IconButton>
                    </Grid>
                    <Grid item textAlign={"center"} paddingRight={"40px" }xs>
                        <Typography variant="h4" color="secondary" gutterBottom>
                            Create Event
                        </Typography>
                    </Grid>
                </Grid>
                <Grid container rowSpacing={2}>
                    <Grid item xs={12}>
                        <StyledTextField
                            fullWidth
                            label="Host"
                            name="host"
                            value={formData.host}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <StyledTextField
                            fullWidth
                            label="Event Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} >
                        <StyledTextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}  marginBottom={2}>
                        <FoodSelection foodItems={foodItems} setFoodItems={setFoodItems}/>
                    </Grid>
                </Grid>
                <DateTimeSelection setFormData={setFormData}/>
                <Grid item xs={12} marginBottom={2}>
                    <StyledTextField
                        fullWidth
                        label="Notes/Comments"
                        name="notes"
                        multiline
                        rows={4}
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid container xs={12} justifyContent={"space-evenly"}>
                    <Grid item width="30%">
                        <Button variant="outlined" color="primary" style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none"}} fullWidth size="large" onClick={() => publishEvent('saved')}>
                        <Typography variant="button">Save</Typography>
                        </Button>
                    </Grid>
                    <Grid item width="30%">
                        <Button variant="outlined" style={{borderRadius: "20px", borderWidth:"3px", borderColor: "#ab0101", textTransform: "none"}} size="large" fullWidth color="primary">
                        <Typography variant="button">Preview</Typography>
                        </Button>
                    </Grid>
                    <Grid item width="30%">
                        <Button variant="contained" style={{borderRadius: "20px", textTransform: "none"}} size="large" fullWidth color="primary" onClick={() => publishEvent('open')}>
                            <Typography variant="button">Publish</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            </Container>
            </ThemeProvider>
        </div>
    );
};


export default EventForm;

// Customize the TextField component
export const StyledTextField = styled(TextField)({
    ...props
    });
