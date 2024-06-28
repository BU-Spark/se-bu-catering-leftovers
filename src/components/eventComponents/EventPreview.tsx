import React, { useEffect, useState } from 'react';
import { Typography, Container, Button, Paper, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/../firebaseConfig';
import { getImageUrls } from '@/utils/imageUtils';
import { Event } from '@/types/types';
import { calculateRemainingTime, formatEventDateTime, formatEndTime } from '@/utils/timeUtil';
import { ImageSlider } from './ImageSlider';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';
import { onOpen, onEnd, onCopy } from '@/utils/eventUtils';
import Map from '../Map';
import { useUser } from '@/context/UserContext';

interface EventPreviewProps {
    eventId: string;
    isNew?: boolean; // Optional parameter to control navigation behavior
}

// This component where users can see all the information on an event
const EventPreview: React.FC<EventPreviewProps> = ({ eventId, isNew = false }) => {
    const { user } = useUser();
    const [event, setEvent] = useState<Event | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    // Fetch event data from database
    useEffect(() => {
        const eventRef = doc(firestore, 'Events', eventId as string);

        const unsubscribe = onSnapshot(eventRef, (doc) => {
            if (doc.exists()) {
                const eventData = doc.data() as Event;
                setEvent(eventData);
                fetchImages(eventData.images);
            }
        });

        const fetchImages = async (imagePaths: string[]) => {
            const urls = await getImageUrls(imagePaths);
            setImageUrls(urls);
        };

        return () => unsubscribe();
    }, [eventId]); // Added eventId to the dependency array

    // Set up interval to update remaining time of events
    useEffect(() => {
        if (event) {
            const interval = setInterval(() => {
                setRemainingTime(calculateRemainingTime(event));
            }, 1000); // Update every second
            return () => clearInterval(interval);
        }
    }, [event]);

    // Route to edit Page
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        router.push(`/events/admin/edit/${eventId}`);
    };

    if (!event) return <div>Loading...</div>;

    // Save and publish event on website
    const publishEvent = async () => {
        await onOpen(event);
        router.push('/events/explore');
    };

    // Mark event as closed and don't show it on website
    const endEvent = async () => {
        await onEnd(event);
        router.push('/events/explore');
    };

    // Create a copy of the current event and redirect to edit page
    const copyEvent = async () => {
        if (user) {
            const copiedEventID = await onCopy(event, user.uid);
            router.push(`/events/admin/edit/${copiedEventID}`);
        }
    };

    // Redirect to feedback page
    const viewFeedback = () => {
        router.push(`/events/admin/reviews/${eventId}`);
    };

    // Redirect back to appropriate page
    const handleBack = () => {
        if (isNew) {
            router.push(`/events/admin/edit/${eventId}`);
        } else {
            router.back();
        }
    };

    return (
        <div style={{ background: "#FFF6EE" }}>
            <Container maxWidth="sm" style={{ padding: "1em", paddingTop: "7em", background: "#FFF6EE" }}>
                <Paper elevation={3} style={{ background: "#FFF" }}>
                    <IconButton onClick={handleBack}>
                        <ArrowBackIcon color="secondary" />
                    </IconButton>
                    <Grid container padding="1em" paddingTop="0">
                        <Grid container marginBottom="0.2em" alignItems="center">
                            <Typography variant="h4" style={{ display: 'inline-block', marginTop: "3px", padding: "5px", paddingRight: "0px" }}>
                                {event.name}
                            </Typography>
                            {user && user.role === "Admin" && user.events.includes(eventId) && (
                                <IconButton onClick={handleEditToggle}>
                                    <EditIcon color="primary" fontSize="small" />
                                </IconButton>
                            )}
                        </Grid>
                        <Grid container justifyContent={"center"} marginBottom="1rem">
                            <ImageSlider imageUrls={imageUrls} remainingTime={remainingTime} />
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6" display="inline">Location: </Typography>
                            <Typography variant="body1" display="inline">{event.Location.abbreviation + ", " + event.locationDetails}</Typography>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6" display="inline">Address: </Typography>
                            <Typography variant="body1" display="inline">{event.Location.address}</Typography>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6" display="inline">Food First Arrived: </Typography>
                            <Typography variant="body1" display="inline">{formatEventDateTime(event.foodArrived)}</Typography>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6" display="inline">Food Available: </Typography>
                            <Typography variant="body1" display="inline">{`${formatEventDateTime(event.foodAvailable)} - ${formatEndTime(event)}`}</Typography>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6">Food List </Typography>
                            <ul>
                                {event.foods.map((food, index) => (
                                    <Typography key={index}>{food.quantity} {parseInt(food.quantity) === 1 ? food.unit.replace(/s$/, '') : food.unit} of {food.item}</Typography>
                                ))}
                            </ul>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6">Notes </Typography>
                            <Typography variant="body1">{event.notes}</Typography>
                        </Grid>
                        <Grid item xs={12} marginBottom="1em">
                            <Typography variant="h6">Map </Typography>
                        </Grid>
                        <Grid container justifyContent="center">
                            <Grid item sx={{ width: { xs: "80%", sm: "70%" } }}>
                                {event.Location && <Map location={event.Location} />}
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid xs justifyContent="flex-end" paddingBottom="2em">
                        {user && user.role === "Admin" && (user.events.includes(eventId) || isNew) && (
                            (event.status === "saved" || event.status === "drafted") ? (
                                <Grid container justifyContent={"center"}>
                                    <Button variant="outlined" color="primary" size="large"
                                            style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none", width: "200px" }}
                                            onClick={publishEvent}>
                                        <Typography variant="button">Publish</Typography>
                                    </Button>
                                </Grid>
                            ) : event.status === "open" ? (
                                <Grid container justifyContent={"center"}>
                                    <Grid direction="column" textAlign={"center"}>
                                        <Button variant="outlined" color="primary" size="large"
                                                style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none", width: "200px", marginBottom: "4px" }}
                                                onClick={endEvent}>
                                            <Typography variant="button">End Event</Typography>
                                        </Button>
                                        <Typography variant="body1" fontWeight="bold"
                                                    sx={{ textDecoration: "underline", cursor: 'pointer'  }}
                                                    onClick={viewFeedback}>
                                            {"View Feedback Section"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Grid container justifyContent={"center"}>
                                    <Grid direction="column" textAlign={"center"}>
                                        <Button variant="outlined" color="primary" size="large"
                                                style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none", width: "200px", marginBottom: "4px" }}
                                                onClick={copyEvent}>
                                            <Typography variant="button">Copy Event</Typography>
                                        </Button>
                                        <Typography variant="body1" fontWeight="bold"
                                                    sx={{ textDecoration: "underline", cursor: 'pointer'  }}
                                                    onClick={viewFeedback}>
                                            {"View Feedback Section"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            )
                        )}
                        {user && !user.events.includes(eventId) && !user.reviews.includes(eventId) && !isNew && (
                            <Grid container justifyContent={"center"}>
                                <Button variant="outlined" color="primary" size="large"
                                        style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none", width: "200px" }}
                                        onClick={() => router.push(`/events/review/${event.id}`)}>
                                    <Typography variant="button">I Picked Up Food</Typography>
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Container>
        </div>
    );
};

export default EventPreview;
