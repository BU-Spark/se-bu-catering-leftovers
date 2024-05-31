import React, {useEffect, useState} from 'react';
import { Typography, Paper, Grid, Button } from '@mui/material';
import {Event} from "../app/EventPage/page"
import {firestore as db} from '../../firebaseConfig';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

interface EventCardProps {
    event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Set up interval to update remaining time of events
  const [remainingTime, setRemainingTime] = useState<string>("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
          setRemainingTime(calculateRemainingTime(event));
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [event]);

  // Calculate the remaining time of an event
  const calculateRemainingTime = (event: Event): string => {
    if (!event.duration || !event.foodAvailable) return "N/A";

    const foodAvailable = event.foodAvailable.toDate();
    const durationInMillis = parseInt(event.duration) * 60 * 1000;
    const endTime = foodAvailable.getTime() + durationInMillis;
    const currentTime = Date.now();
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) return "00:00:00";

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate the end time
  const durationMinutes = parseInt(event.duration);
  const endTime = new Date(event.foodAvailable.toDate().getTime() + durationMinutes * 60000); // 60000 ms = 1 minute

  // Format date and time
  const foodAvailableDate = event.foodAvailable.toDate().toLocaleDateString(undefined, {
    month: 'long',
    day: '2-digit'
  });
  const foodAvailableTime = event.foodAvailable.toDate().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const endTimeFormatted = endTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Format the countdown time
  const formatDuration = (duration: string): string => {
    const hours = Math.floor(parseInt(duration) / 60);
    const minutes = (parseInt(duration) % 60).toString().padStart(2, '0');
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    // Fetch image URL from Firestore
    const getImageUrl = async () => {
      try {
        const storage = getStorage();
        const storageRef = ref(storage, event.images[0]);
        const url = await getDownloadURL(storageRef);
        
        setImageUrl(url);
        console.log("hey");
      } catch (error) {
        console.error("Error fetching image URL:", error);
      }
    };

    getImageUrl();
  }, []);

  const handleClick = () => {
    console.log("I was clicked");
  }

  return (
    <Grid item xs={12} sm={6} style={{ padding: '1em' }} justifyContent="center">
      <Paper elevation={3} style={{ background: "#FFF6EE", position: 'relative', borderRadius:"15px" }}>
        {imageUrl && (
          <div style={{ position: 'relative' }}>
            <img src={imageUrl} alt="Firestore Image" style={{ width: '100%', height: 'auto', borderTopLeftRadius:"15px", borderTopRightRadius:"15px"}} />
              <Typography
                variant="body2"
                style={{ position: 'absolute', top: 20, right: 0, backgroundColor: "#195626", color: '#FFF',
                  padding: '0.5em', borderTopLeftRadius: '5px', borderBottomLeftRadius: '5px'}}
              >
                <span style={{ fontSize: '1.4em', fontWeight: 'bold', marginRight: '0.2em' }}>{remainingTime}</span>
                <span style={{ fontSize: '0.7em' }}>{" left to pick up"}</span>
              </Typography>
          </div>
        )}
        <Grid padding={2} paddingTop={1}>
          <Typography fontFamily="Inter" fontWeight="600" fontSize="1em">{event.name}</Typography>
          <Grid container justifyContent={"space-between"}>
            <Grid item>
              <Typography variant="body2">{event.location}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                {`${foodAvailableDate}, ${foodAvailableTime} - ${endTimeFormatted}`}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" fontWeight="bold" onClick={handleClick}>
                {"Learn More >"}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default EventCard;


{/* <Grid xs>
<Paper elevation={3} style={{ padding: '1em', background:"#FFF6EE" }}>
    {imageUrl && <img src={imageUrl} alt="Firestore Image" />}
    <Typography variant="h6">{event.name}</Typography>
    <Grid container spacing={2} alignItems="center">
        <Grid item maxWidth="30%">
            <Typography variant="body2">Location: {event.location}</Typography>
        </Grid>
        <Grid item maxWidth="40%">
            <Typography variant="body2">{`${foodAvailableDate}, ${foodAvailableTime} - ${endTimeFormatted}`}</Typography>
        </Grid>
        <Grid item maxWidth="30%">
            <Typography variant="body2" fontWeight="bold" onClick={handleClick}>{"Learn More >"} </Typography>
        </Grid>
    </Grid>
    <Typography variant="body2">{remainingTime}</Typography>
</Paper>
</Grid>
); */}