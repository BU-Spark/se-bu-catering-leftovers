import React, { useEffect, useState } from 'react';
import { LocalizationProvider, DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Grid } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { props } from '@/styles/styling';
import { Event } from '@/types/types';

interface DateTimeSelectionProps {
    formData: Event;
    setFormData: React.Dispatch<React.SetStateAction<Event>>;
}

export const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({ setFormData, formData }) => {
    const today = new Date();
    const minimumDate = new Date(today.getTime() - 3.5 * 60 * 60 * 1000); // Allow to create event up to 3 hours before current time
    const defaultDuration = 30;

    const [foodArrived, setFoodArrived] = useState<Date>(today);
    const [foodAvailable, setFoodAvailable] = useState<Date>(foodArrived);
    const [duration, setDuration] = useState<Date>(new Date(0, 0, 0, 0, defaultDuration, 0));

    const maxTime = 4; // Maximum time in hours for food to be consumed after arrival
    const [availabilityLimit, setLimit] = useState<Date>(new Date(foodArrived.getTime() + maxTime * 60 * 60 * 1000 - defaultDuration * 60 * 1000));

    useEffect(() => {
        const newLimit = new Date(foodArrived.getTime() + maxTime * 60 * 60 * 1000 - (duration.getMinutes() + 1) * 60 * 1000);
        setLimit(newLimit);

        if (foodAvailable < foodArrived) {
            setFoodAvailable(foodArrived);
        } else if (foodAvailable > newLimit) {
            console.log(formData.duration);
            setFoodAvailable(newLimit);
        }
    }, [foodArrived, foodAvailable, duration, formData.duration]);

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
        if (date) {
            setFoodAvailable(date);
            const formattedDate = Timestamp.fromDate(date);
            setFormData((prevData) => ({
                ...prevData,
                foodAvailable: formattedDate
            }));
        }
    };

    // Compute dynamic maxTime for the duration based on foodAvailable and foodArrived
    const dynamicMaxTime = new Date(0, 0, 0, maxTime - (foodAvailable.getTime() - foodArrived.getTime()) / (60 * 60 * 1000), 0, 0);

    // Save duration time change in minutes
    const handleTimeChange = (time: any) => {
        setDuration(time);
        setFormData((prevData) => ({
            ...prevData,
            duration: time.getHours() * 60 + time.getMinutes()
        }));
    };

    return (
        <Grid item xs={12}>
            <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                        label="Food First Arrived"
                        value={foodArrived}
                        minDateTime={minimumDate}
                        onChange={handleArrivalChange}
                        ampm={false}
                        slotProps={{ textField: { fullWidth: true } }}
                        sx={{ ...props }}
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
                        ampm={false}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                helperText: "For safety, food can't be given after 4 hours of arrival"
                            }
                        }}
                        sx={{ ...props }}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                        label="Availability duration"
                        onChange={handleTimeChange}
                        value={duration}
                        format="HH:mm"
                        maxTime={dynamicMaxTime}
                        ampm={false}
                        sx={{ ...props }}
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
