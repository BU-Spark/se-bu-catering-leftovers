import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from "@mui/material/styles";
import { props } from "@/styles/styling";
import { FoodSelection } from './FoodSelection';
import { DateTimeSelection } from './DateTimeSelection';
import { ImageUpload } from '@/components/ImageUpload';
import { Event } from '@/types/types';
import { useRouter } from 'next/navigation';
import GeocodeSearch from './GeoCodeSearch';
import Map from '../Map';
import { Location } from '@/types/types';
import LocationDropdown from './LocationDropdown';
import { useUser } from "@/context/UserContext";
import { onDelete } from '@/utils/eventUtils';

interface EventFormProps {
    event: Event;
    onPublish: (event: Event, userId: string) => Promise<string>;
}

const defaultAddress: Location = {
    name: "BU Campus",
    address: 'Boston University, 899 Commonwealth Avenue, Boston, MA',
    abbreviation: 'Boston University',
    lat: '42.350499',
    lon: '-71.105399',
    campus_section: 'Central'
};

const defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/bu-catering-leftovers.appspot.com/o/BUCL%20Default.jpeg?alt=media&token=e3b16eef-c37e-4407-85eb-f48cd1b501c2";

const EventForm: React.FC<EventFormProps> = ({ event, onPublish }) => {
    const { user } = useUser();
    const [formData, setFormData] = useState<Event>(event);
    const [foodItems, setFoodItems] = useState(event.foods);
    const [images, setImages] = useState<string[]>(event.images);
    const [location, setLocation] = useState<Location>(event.Location ? event.Location : defaultAddress);
    const router = useRouter();
    const [hasChanges, setHasChanges] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            Location: location,
            [e.target.name]: e.target.value
        });
        setHasChanges(true);
    };

    const isValid = () => {
        const requiredFields: (keyof Event)[] = ['host', 'name', 'locationDetails', 'Location']; // Add other required fields if necessary
        const missingFields = requiredFields.filter(field => formData[field] === '');

        if (missingFields.length > 0) {
            alert(`Please fill out all required fields before publishing: ${missingFields.join(', ')}`);
            return false;
        } else {
            return true;
        }
    }

    const publishEvent = async (status: string) => {
        if (user) {
            if (isValid()) {
                const updatedEvent = updateEvent(status);
                const eventUID = await onPublish(updatedEvent, user.uid);

                if (status === 'open') {
                    alert('Event published successfully');
                    router.push('/events/explore');
                }
                return eventUID;
            } else {
                // alert('Please fill out all required fields before publishing the event');
                return "";
            }
        }
    };

    const updateEvent = (status: string) => {
        const validFood = foodItems.filter(({ quantity, unit, item }) => quantity && unit && item) // Filter empty food items
        const updatedImages = images.length === 0 ? [defaultImageUrl] : images;

        const updatedEvent = { ...formData, status: status, images: updatedImages, foods: validFood };
        return updatedEvent;
    };

    const setImageUrl = (url: string) => {
        setImages([...images, url]);
        setHasChanges(true);
    };

    const removeImage = (url: string) => {
        setImages(images.filter((image) => image !== url));
        setHasChanges(true);
    };

    const previewEvent = async () => {
        const eventID = await publishEvent(event.status);
        if (eventID !== "") {
            router.push(`/events/admin/preview/${eventID}`);
        }
    };

    const handleBackClick = () => {
        if (hasChanges) {
            setOpenDialog(true);
        } else {
            router.push("/events/explore");
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSaveAndLeave = async () => {
        const eventId = await publishEvent('saved');
        setOpenDialog(false);
        setHasChanges(false);
        if (eventId !== "") {
            router.push("/events/explore");
        }
    };

    const handleDiscardAndLeave = async () => {
        if (event.status === 'drafted' || event.id === "") {
            if (user) {
                await onDelete(event, user.uid);
            }
        }
        setOpenDialog(false);
        setHasChanges(false);
        router.push("/events/explore");
    };

    return (
        <div style={{background: "#FFF6EE"}}>
            <Container maxWidth="sm" style={{padding: "1em", paddingTop: "7em", background: "#FFF6EE"}}>
                <Paper elevation={3} style={{ padding: '1em' }}>
                    <Grid container xs={12}>
                        <Grid item maxWidth={"40px"}>
                            <IconButton onClick={handleBackClick}>
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
                        <Grid item xs={12} marginBottom={2}>
                            <StyledTextField
                                fullWidth
                                label="Event Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid container xs={12} justifyContent="center">
                            <LocationDropdown onLocationSelect={setLocation} />
                            <Grid item sx={{width:{xs: "70%", sm: "60%"}}} marginTop={2}>
                                {location && <Map location={location} />}
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <StyledTextField
                                fullWidth
                                label="Location Details"
                                name="locationDetails"
                                value={formData.locationDetails}
                                onChange={handleChange}
                            />
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
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Unsaved Changes"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        You have unsaved changes. Would you like to save them before leaving?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDiscardAndLeave} color="secondary">
                        Discard
                    </Button>
                    <Button onClick={handleSaveAndLeave} color="primary" autoFocus>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default EventForm;

export const StyledTextField = styled(TextField)({
    ...props
});
