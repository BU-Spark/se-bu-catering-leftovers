import React, { useEffect, useState } from 'react';
import { Typography, Container, Button, Paper, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { getImageUrls } from '../functions/imageUtils';
import { Event, User } from '../functions/types';
import { calculateRemainingTime } from '../functions/timeUtil';
import { ImageSlider } from './ImageSlider';
import EditIcon from '@mui/icons-material/Edit';
import { formatEventDateTime, formatEndTime } from '../functions/timeUtil';
import { useRouter } from 'next/navigation';
import { onOpen, onEnd } from '../functions/eventUtils';

interface EventPreviewProps {
    eventId: string;
}

// This component where users can see all the information on an event
const EventPreview: React.FC<EventPreviewProps>  = ({ eventId }) => {
    const userid = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    const [user, setUser] = useState<User>();

    const [event, setEvent] = useState<Event | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const eventRef = doc(firestore, 'Events', eventId as string);

        const fetchUser = async () => {
            setUser(await getUser(userid));
        }
        
        fetchUser();

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
    }, []);

    // Retrieve user from database
    const getUser = async (userid: string) => {
        // Placeholder for user authentication
        const user = await getDoc(doc(firestore, 'Users', userid));
        return user.data() as User;
    };
    // Set up interval to update remaining time of events
    useEffect(() => {
        if (event) {
            const interval = setInterval(() => {
                setRemainingTime(calculateRemainingTime(event));
            }, 1000); // Update every second
            return () => clearInterval(interval);
        }
    }, [event]);

    const handleSave = async (updatedEvent: Event) => {
        if (eventId) {
            const updatePayload: { [key: string]: any } = { ...updatedEvent };
            await updateDoc(doc(firestore, 'Events', eventId as string), updatePayload);
            setIsEditing(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        router.push(`/EditEvent/${eventId}`, );
    };

    if (!event) return <div>Loading...</div>;

    // Save and publish event on website
    const publishEvent = async () => {
        await onOpen(event);
        router.push('/EventPage');
    };

    // Mark event as closed and don't show it on website
    const endEvent = async () => {
        await onEnd(event);
        router.push('/EventPage');
    }

    // Redirect to feedback page
    const viewFeedback = () => {
        router.push(`/EventFeedback/${eventId}`);
    }

  return (
    <div style={{background: "#FFF6EE"}}>
        <Container maxWidth="sm" style={{padding: "1em", paddingTop: "7em", background: "#FFF6EE" }}>
            <Paper elevation={3} style={{ background: "#FFF"}}>
                <IconButton onClick={()=> router.back()}>
                    <ArrowBackIcon color="secondary" />
                </IconButton>
                <Grid padding= "1em" paddingTop="0">
                    <Grid container marginBottom="0.2em" alignItems="center">
                        <Typography variant="h4" style={{ display: 'inline-block', marginTop: "3px", padding:"5px", paddingRight:"0px"}}>
                            {event.name}
                        </Typography>
                        {user && user.type == "Admin" && user.events.includes(eventId) && (
                            <IconButton onClick={handleEditToggle} >
                                <EditIcon color="primary" fontSize="small" />
                            </IconButton>
                        )}
                    </Grid>
                    <Grid container justifyContent={"center"} marginBottom="1rem">
                        <Grid container sx={{maxWidth: {xs: "70%", sm: "50%"}, height:{xs:"150px", sm: "150px"}}}>
                            <ImageSlider imageUrls={imageUrls} remainingTime={remainingTime} />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" display="inline">Location: </Typography>
                            <Typography variant="body1" display="inline">{event.location}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" display="inline">Food First Arrived: </Typography>
                            <Typography variant="body1" display="inline">{formatEventDateTime(event.foodArrived)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" display="inline">Food Available: </Typography>
                            <Typography variant="body1" display="inline">{`${formatEventDateTime(event.foodAvailable)} - ${formatEndTime(event)}`}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6">Food List </Typography>
                            <ul>
                                {event.foods.map((food, index) => (
                                    <Typography key={index}>{food.quantity} {parseInt(food.quantity) === 1 ? food.unit.replace(/s$/, '') : food.unit} of {food.item}</Typography>
                                ))}
                            </ul>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6">Notes </Typography>
                            <Typography variant="body1">{event.notes}</Typography>
                        </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6">Map </Typography>
                    </Grid>
                    </Grid>
                    <Grid xs justifyContent="flex-end">
                    {user && user.type == "Admin" && user.events.includes(eventId) && (
                        event.status === "saved" ? (
                            <Grid container justifyContent={"center"}>
                                <Button variant="outlined" color="primary" size="large"
                                    style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none", width:"200px" }} 
                                    onClick={publishEvent}>
                                    <Typography variant="button">Publish</Typography>
                                </Button>
                            </Grid>
                        ) : event.status === "open" ? (
                            <Grid container justifyContent={"center"}>
                                <Grid direction="column" textAlign={"center"}>
                                    <Button variant="outlined" color="primary" size="large" 
                                        style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none", width:"200px", marginBottom: "4px" }} 
                                        onClick={endEvent}>
                                        <Typography variant="button">End Event</Typography>
                                    </Button>
                                    <Typography variant="body1" fontWeight="bold" 
                                        sx={{textDecoration: "underline"}}
                                        onClick={viewFeedback}>
                                        {"View Feedback Section"}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <Grid container justifyContent={"center"}>
                                <Typography variant="body1" fontWeight="bold" 
                                    sx={{textDecoration: "underline"}}
                                    onClick={viewFeedback}>
                                    {"View Feedback Section"}
                                </Typography>
                            </Grid>
                        )
                    )}
                     {user && !user.events.includes(eventId) && !user.reviews.includes(eventId) && (
                        <Grid container justifyContent={"center"}>
                            <Button variant="outlined" color="primary" size="large"
                                style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none", width:"200px" }} 
                                onClick={() => router.push(`/FeedbackForm/${event.id}`)}>
                                <Typography variant="button">I Picked Up Food</Typography>
                            </Button>
                        </Grid>
                     )}
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    </div>
    );
};

export default EventPreview;