import React, {useEffect, useState} from 'react';
import { Typography, Paper, Grid } from '@mui/material';
import { Event } from "../functions/types"
import { formatEventTimes, calculateRemainingTime } from '../functions/timeUtil';
import { getImageUrl } from '../functions/imageUtils';
import { useRouter } from 'next/navigation';
import { onEnd } from '../functions/eventUtils';

interface EventCardProps {
    event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { foodAvailableDate, foodAvailableTime, endTimeFormatted } = formatEventTimes(event);
  const [imageUrl, setImageUrl] = useState<string>();
  const [remainingTime, setRemainingTime] = useState<string>("00:00:00");
  const router = useRouter();

  // Set up interval to update remaining time of events
  useEffect(() => {
    const interval = setInterval(() => {
          const remainingTime = calculateRemainingTime(event);
          setRemainingTime(remainingTime);
          checkAvailability(remainingTime);
    }, 1000); // Update every second
    
    const checkAvailability = async (remainingTime: string) => {
      if (remainingTime === "00:00:00") {
        await onEnd(event);
      }
    };

    return () => clearInterval(interval);
    
  }, [event]);


  useEffect(() => {
    // Fetch image URL from Firestore
    const getImage = async () => {
      const url = await getImageUrl(event.images[0]);
      setImageUrl(url);
    };

    getImage();
  }, []);

  const handleClick = () => {
    router.push(`/EventPreview/${event.id}`)
  }

  return (
    <Grid item xs={12} sm={6} style={{ padding: '0.5em', paddingTop: "0" }} justifyContent="space-between">
      <Paper elevation={3} style={{ background: "#FFF6EE", position: 'relative', borderRadius:"15px" }}>
        {imageUrl && (
          <div style={{ position: 'relative' }}>
            <img src={imageUrl} alt="Firestore Image" style={{ width: '100%', height: '160px', objectFit: "cover", borderTopLeftRadius:"15px", borderTopRightRadius:"15px"}} />
              <Typography
                variant="body1"
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
              <Typography variant="body1">{event.location}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1">
                {`${foodAvailableDate}, ${foodAvailableTime} - ${endTimeFormatted}`}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1" fontWeight="bold" onClick={handleClick}>
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
