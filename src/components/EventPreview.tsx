import React, { useEffect, useState } from 'react';
import { Typography, Container, Button, Paper, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { getImageUrls } from '../app/functions/imageUtils';
import { Event } from '../app/functions/types';
import { calculateRemainingTime } from '../app/functions/timeUtil';
import { ImageSlider } from './ImageSlider';
import EditIcon from '@mui/icons-material/Edit';
import { formatEventDateTime, formatEndTime } from '../app/functions/timeUtil';
import { useRouter } from 'next/navigation';

interface EventPreviewProps {
    eventId: string;
}

// This component where users can see all the information on an event
const EventPreview: React.FC<EventPreviewProps>  = ({ eventId }) => {
    const [event, setEvent] = useState<Event | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

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
    }, [eventId]);

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

  return (
    <div style={{background: "#FFF6EE"}}>
        <Container maxWidth="sm" style={{padding: "1em", paddingTop: "7em", background: "#FFF6EE"}} >
            <Paper elevation={3} style={{ background: "#FFF", }}>
                <IconButton onClick={()=> router.back()}>
                    <ArrowBackIcon color="secondary" />
                </IconButton>
                <Grid padding= "1em" paddingTop="0">
                    <Grid container marginBottom="0.2em" alignItems="center">
                        <Typography variant="h4" style={{ display: 'inline-block' }}>
                            {event.name}
                        </Typography>
                        <IconButton onClick={handleEditToggle} style={{marginBottom:"5px"}}>
                            <EditIcon color="primary" fontSize="small" />
                        </IconButton>
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
                        { event.status === "saved" ? (
                            <Grid container justifyContent={"center"}>
                                <Button variant="outlined" color="primary" style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none", width:"200px" }} size="large">
                                    <Typography variant="button">Publish</Typography>
                                </Button>
                            </Grid>
                        ) : (
                            <Grid container justifyContent={"center"}>
                                <Grid direction="column" textAlign={"center"}>
                                    <Button variant="outlined" color="primary" style={{borderRadius: "20px",  borderWidth:"3px", borderColor: "#ab0101", textTransform: "none", width:"200px", marginBottom: "4px" }} size="large">
                                        <Typography variant="button">Save</Typography>
                                    </Button>
                                    <Typography variant="body1" fontWeight="bold" sx={{textDecoration: "underline"}}>
                                        {"View Feedback Section"}
                                    </Typography>
                                </Grid>
                            </Grid>
                        )
                        }
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    </div>
    );
};

export default EventPreview;


