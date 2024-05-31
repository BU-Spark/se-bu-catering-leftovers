import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Grid } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { props } from './styling';
import { FormData } from './EventForm';

interface DateTimeSelectionProps {
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({ setFormData }) => {
    const [foodArrived, setFoodArrived] = useState<Date>(new Date());
    const [foodAvailable, setFoodAvailable] = useState<Date>(foodArrived);
    
    const maxTime = 4; // Maximum time in hours for food to be consumed after arrival
    const availabilityLimit = new Date(foodArrived.getTime() + maxTime * 60 * 60 * 1000);

    useEffect(() => {
        availabilityLimit.setHours(foodArrived.getHours() + maxTime);
        if (foodAvailable < foodArrived){
            setFoodAvailable(foodArrived);
        }

      }, [foodArrived, foodAvailable]);

    // Save arrival date changes
    const handleArrivalChange = (date: Date | null) => {
        if (date) {
            setFoodArrived(date);
            const formattedDate = Timestamp.fromDate(date);
            setFormData((prevData) => ({
                ...prevData,
                foodArrived: formattedDate
            }));
        }
    };

    // Save delivery date changes
    const handleDeliveryChange = (date: Date | null) => {
        if (date){
            setFoodAvailable(date);
            const formattedDate = Timestamp.fromDate(date);
            setFormData((prevData) => ({
                ...prevData,
                foodAvailable: formattedDate
            }));
        }
    };

    // Save duration time change in minutes
    const handleTimeChange = (time: any) => {
        setFormData((prevData) => ({
            ...prevData,
            duration: time.getHours() * 60 + time.getMinutes()
        }));
    };

    return(
        <Grid item xs={12}>
            <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                        label="Food First Arrived"
                        value={foodArrived}
                        minDateTime={new Date()}
                        onChange={handleArrivalChange}
                        slotProps={{ textField: { fullWidth: true } }}
                        sx={{...props}}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                        label="Available for Pickup"
                        value={foodAvailable}
                        minDateTime={foodArrived}
                        maxDateTime={availabilityLimit}
                        onChange={handleDeliveryChange}
                        slotProps = {{textField: {
                            fullWidth: true, 
                            helperText: "For safety, food can't be given after 4 hours of arrival"}
                        }}
                        sx={{...props}}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                        label="Availability duration"
                        onChange={handleTimeChange}
                        format="HH:mm"
                        defaultValue= {new Date(0,0,0,0,30,0)}
                        maxTime={ new Date(0,0,0,4,0)}
                        ampm={false}
                        sx={{...props}}
                        slotProps={{
                            textField: {
                            helperText: `Select up to 4 hours after food arrived`,
                            fullWidth: true,
                            },
                        }}
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>

    );
};