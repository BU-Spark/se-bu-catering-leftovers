"use client";

import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton, FormControl, InputLabel, Select, SelectChangeEvent, MenuItem } from '@mui/material';
import {firestore} from '../../firebaseConfig';
import { addDoc, updateDoc, arrayUnion, collection, doc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';

import { styled } from "@mui/material/styles";

import { ThemeProvider } from '@mui/material/styles';
import { props, theme } from "../components/styling";
import { FoodItem, FoodSelection } from '../components/FoodSelection';
import { DateTimeSelection } from '../components/DateTimeSelection';
import { ImageUpload } from '../components/ImageUpload';

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
// Navigate Back
// Only Admin can use this
// Buttons: Preview, publish redirect
// How to navigate into the form
// Choose location Google API
// Verify which units to add
// Default Image?
// Max number of images?
// Another way to display images?
// 

// Reviews only for admin or everyone can see them
// Anonymous reviews?

// Modulate Eventcard: time and image functions


// This component is the intake form where admins can create new events
const EventForm: React.FC = () => {
    const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication

    // Create empty event
    const [formData, setFormData] = useState<FormData>({
        host: '',
        name: '',
        googleLocation: '',
        location: '',
        campusArea: '',
        notes: '',
        duration: '30',
        foodArrived: Timestamp.fromDate(new Date()),
        foodAvailable: Timestamp.fromDate(new Date()),
        foods: [],
        status: 'closed',
        images: []
    });
    const [campusArea, setCampusArea] = useState<string>("");

    // Create 3 empty food items
    const [foodItems, setFoodItems] = useState([{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' },{ id: uuidv4(), quantity: '', item: '', unit: '' }]);

    const [images, setImages] = useState<string[]>([]);

    // Save changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            campusArea: campusArea,
            [e.target.name]: e.target.value
        });
    };

    const handleDropdownChange = (event: SelectChangeEvent<string>) => {
        setFormData({
            ...formData,
            campusArea: event.target.value
        });
    };

    // Save and publish event on website
    const publishEvent = async (status: string) => {
        const requiredFields = ['host', 'name', 'location', 'campusArea']; // Add other required fields if necessary

        // Check if all required fields are filled out
        const isFormValid = requiredFields.every(field => formData[field] !== '');

        if (!isFormValid) {
            alert('Please fill out all required fields before publishing the event');
            return;
        }

        const db = firestore;
        try {
            // add event to database
            const eventRef = await addDoc(collection(db, 'Events'), {
                ...formData,
                status: status,
                images: images,
                foods: foodItems.filter(({ quantity, unit, item }) => quantity && unit && item).map(({ quantity, unit, item }) => ({ quantity, unit, item })), // Filter empty food items and delete id 
            });
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
        console.log(formData);
    };

    const setImageUrl = (url: string) => {
        setImages([...images, url]);
    };

    const removeImage = (url: string) => {
        setImages(images.filter((image) => image !== url));
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
                        <ImageUpload setImageUrl={setImageUrl} removeImage={removeImage}/>
                    </Grid>
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
                    <Grid item xs={12} marginBottom={2}>
                        <FormControl fullWidth sx={{...props}}>
                            <InputLabel id="campus-area-label">Campus Area</InputLabel>
                            <Select
                                labelId="campus-area-label"
                                label="Campus Area"
                                value={formData.campusArea}
                                onChange={handleDropdownChange}
                            >
                                <MenuItem value="Central">Central</MenuItem>
                                <MenuItem value="East">East</MenuItem>
                                <MenuItem value="West">West</MenuItem>
                                <MenuItem value="South">South</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}  marginBottom={2}>
                        <FoodSelection foodItems={foodItems} setFoodItems={setFoodItems}/>
                    </Grid>
                </Grid>
                <DateTimeSelection setFormData={setFormData} formData={formData}/>
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
