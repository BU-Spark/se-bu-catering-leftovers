"use client";

import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers';
import {firestore} from '../firebaseConfig';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { redirect } from 'next/dist/server/api-utils';
import { set } from 'date-fns';

// Interface for each of the foods available
interface FoodItem {
    quantity: string;
    item: string;
}

// Define the event interface
export interface FormData {
    host: string;
    name: string;
    location: string;
    notes: string;
    duration: string;
    foodArrived: Timestamp;
    foodAvailable: Timestamp;
    foods: FoodItem[];
    status: string;
}

// TODO: Add image upload
// How to choose location? (free text, dropdown, Google API)
// Validate input (are there any inputs we don't want to allow? Character limits, only letters, etc.)
// Buttons: Preview create functionality, publish redirect
// Add dropdown to allow admin to select Campus Area
// ALL Design: Make it look like figma


// This component is the intake form where admins can create new events
const EventForm: React.FC = () => {
    // Create empty event
    const [formData, setFormData] = useState<FormData>({
        host: '',
        name: '',
        location: '',
        notes: '',
        duration: '',
        foodArrived: Timestamp.fromDate(new Date()),
        foodAvailable: Timestamp.fromDate(new Date()),
        foods: [],
        status: 'closed'
    });

    const [foodItems, setFoodItems] = useState([
        { id: uuidv4(), quantity: '', item: '' },
        { id: uuidv4(), quantity: '', item: '' },
        { id: uuidv4(), quantity: '', item: '' }
    ]);

    const [foodArrived, setFoodArrived] = useState<Date>(new Date());
    const [foodAvailable, setFoodAvailable] = useState<Date>(new Date());
    const maxTime = new Date(0,0,0,4,0); // max duration to select is 4 hours
    
    const [images, setImages] = useState([]);

    // Save changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Save arrival time change in minutes
    const handleTimeChange = (time: any) => {
        setFormData({
            ...formData,
            duration: time.getHours()*60 + time.getMinutes()
        });
    };

    // Save food item changes
    const handleFoodItemChange = (id:string, field:string, value:string) => {
        setFoodItems((prevItems) =>
            prevItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    // Add a food item
    const addFoodItem = () => {
        setFoodItems([...foodItems, { id: uuidv4(), quantity: '', item: '' }]);
    };
    
    // Remove a food item
    const removeFoodItem = (id:string) => {
        setFoodItems(foodItems.filter((item) => item.id !== id));
    };

    // Save arrival date changes
    const handleArrivalChange = (date: Date | null) => {
        if (date) {
            setFoodArrived(date);
            const formattedDate = Timestamp.fromDate(date);
            setFormData({
                ...formData,
                foodArrived: formattedDate
            });
        }
    };

    // Save delivery date changes
    const handleDeliveryChange = (date: Date | null) => {
        if (date){
            setFoodAvailable(date);
            const formattedDate = Timestamp.fromDate(date);
            setFormData({
                ...formData,
                foodAvailable: formattedDate
            });
        }
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
        <Container maxWidth="sm">
        <Paper elevation={3} style={{ padding: '2em' }}>
            <Typography variant="h4" gutterBottom>
            Create Event
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Host"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    InputProps={{sx: {borderRadius: 2, colorScheme: 'red'}}}
                    color="primary"
                />
                </Grid>
                <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Event Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                />
                </Grid>
                <Grid item xs={12}>
              <Typography variant="h6" marginBottom={2}>Food Items</Typography>
              {foodItems.map((item) => (
                <Grid container spacing={2} marginBottom={2} key={item.id} alignItems="center">
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleFoodItemChange(item.id, 'quantity', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Type"
                      value={item.item}
                      onChange={(e) => handleFoodItemChange(item.id, 'item', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton onClick={() => removeFoodItem(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button variant="contained" color="primary" onClick={addFoodItem} startIcon={<AddIcon />}>
                Add Food Item
              </Button>
            </Grid>
                <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                />
                </Grid>
                <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                    label="Food First Arrived"
                    value={foodArrived}
                    onChange={handleArrivalChange}
                    // renderInput={(params) => <TextField fullWidth {...params} />}
                    />
                </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                    label="Available for Pickup"
                    value={foodAvailable}
                    onChange={handleDeliveryChange}
                    // renderInput={(params) => <TextField fullWidth {...params} />}
                    />
                </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Availability duration"
                  onChange={handleTimeChange}
                  format="HH:mm"
                  maxTime={maxTime}
                  ampm={false}
                  slotProps={{
                    textField: {
                      helperText: `Select up to ${maxTime.getHours()} hours`,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
                <Grid item xs={12} marginBottom={2}>
                <TextField
                    fullWidth
                    label="Notes/Comments"
                    name="notes"
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                />
                </Grid>
                <Grid container justifyContent={"space-evenly"}>
                    <Grid item >
                        <Button variant="contained" color="primary" onClick={() => publishEvent('saved')}>
                            Save
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="primary">
                            Preview
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="primary" onClick={() => publishEvent('open')}>
                            Publish
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
        </Container>
    );
};

export default EventForm;