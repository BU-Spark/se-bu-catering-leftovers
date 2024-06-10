import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton, FormControl, InputLabel, Select, SelectChangeEvent, MenuItem } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from "@mui/material/styles";
import { props } from "../functions/styling";
import { FoodSelection } from '../components/FoodSelection';
import { DateTimeSelection } from '../components/DateTimeSelection';
import { ImageUpload } from '../components/ImageUpload';
import { Event } from '../functions/types';
import { useRouter } from 'next/navigation';

// TODO: 
// Only Admin can use this
// Choose location API

interface EventFormProps {
    event: Event;
    onPublish: (event: Event, userId: string) => Promise<string>;
}

// This component is the intake form where admins can create and modify new events
const EventForm: React.FC<EventFormProps> = ({ event, onPublish }) => {
    const userId = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    const [formData, setFormData] = useState<Event>(event);
    const [campusArea, setCampusArea] = useState<string>(event.campusArea);
    const [foodItems, setFoodItems] = useState(event.foods);
    const [images, setImages] = useState<string[]>(event.images);
    const router = useRouter();

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

    const isValid = () => {
        const requiredFields: (keyof Event)[] = ['host', 'name', 'location', 'campusArea']; // Add other required fields if necessary
        const missingFields = requiredFields.filter(field => formData[field] === '');

        if (missingFields.length > 0) {
            alert(`The following fields are missing: ${missingFields.join(', ')}`);
            return false;
        } else {
            return true;
        }
    }

    // Save and publish event on website
    const publishEvent = async (status: string) => {
        // Check if all required fields are filled out
        if (isValid()) {
            const updatedEvent = updateEvent(status);

            const eventUID = await onPublish(updatedEvent, userId);

            if (status === 'open') {
                router.push('/EventPage');
            }
            return eventUID;
        } else {
            alert('Please fill out all required fields before publishing the event');
            return "";
        }

    };

    const updateEvent = (status: string) => {
        const validFood = foodItems.filter(({ quantity, unit, item }) => quantity && unit && item) // Filter empty food items
        const updatedEvent = { ...formData, status: status, images: images, foods: validFood};
        return updatedEvent;
    };

    const setImageUrl = (url: string) => {
        setImages([...images, url]);
    };

    const removeImage = (url: string) => {
        setImages(images.filter((image) => image !== url));
    };

    const previewEvent = async () => {
        const eventID = await publishEvent('saved');
        if (eventID !== "") {
            router.push(`/EventPreview/${eventID}`);
        }
    };

    return (
        <div style={{background: "#FFF6EE"}}>
            <Container maxWidth="sm" style={{padding: "1em", paddingTop: "7em", background: "#FFF6EE"}}>
            <Paper elevation={3} style={{ padding: '1em' }}>
                <Grid container xs={12}>
                    <Grid item maxWidth={"40px"}>
                        <IconButton onClick={() => router.back()}>
                            <ArrowBackIcon color="secondary"/>
                        </IconButton>
                    </Grid>
                    <Grid item textAlign={"center"} paddingRight={"40px" }xs>
                        <Typography fontSize="1.8rem" color="secondary" gutterBottom>
                            Create Event
                        </Typography>
                    </Grid>
                </Grid>
                <Grid container rowSpacing={2}>
                    <Grid item xs={12}>
                        <ImageUpload setImageUrl={setImageUrl} removeImage={removeImage} event={formData}/>
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
                        <Button variant="outlined" style={{borderRadius: "20px", borderWidth:"3px", borderColor: "#ab0101", textTransform: "none"}} size="large" fullWidth color="primary" onClick={() => previewEvent()}>
                        <Typography variant="button">Preview</Typography>
                        </Button>
                    </Grid>
                    <Grid item width="30%">
                        <Button variant="outlined" style={{borderRadius: "20px", borderWidth:"3px", borderColor: "#ab0101", textTransform: "none"}} size="large" fullWidth color="primary" onClick={() => publishEvent('open')}>
                            <Typography variant="button">Publish</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            </Container>
        </div>
    );
};


export default EventForm;

// Customize the TextField component
export const StyledTextField = styled(TextField)({
    ...props
    });
