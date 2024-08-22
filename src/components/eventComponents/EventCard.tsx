import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid } from '@mui/material';
import { Event } from "@/types/types";
import { formatEventTimes, calculateRemainingTime } from '@/utils/timeUtil';
import { getImageUrl } from '@/utils/imageUtils';
import { useRouter } from 'next/navigation';
import { onEnd } from '@/utils/eventUtils';
import Image from 'next/image';

interface EventCardProps {
  event: Event;
  imageHeight?: string;
  adminView?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, imageHeight = '180px', adminView = false }) => {
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
  }, [event.images]); // Added event.images to the dependency array

  const handleClick = () => {
    router.push(`/events/preview/${event.id}`);
  };

  return (
      <Grid item xs={12} style={{ padding: '0.5em', paddingTop: "0" }} justifyContent="space-between">
        <Paper elevation={3} style={{ background: "#FFF6EE", position: 'relative', borderRadius: "15px", cursor: 'pointer' }} onClick={handleClick}>
          {imageUrl && (
              <div style={{ position: 'relative', width: '100%', height: imageHeight }}>
                <Image src={imageUrl} alt="Firestore Image" layout="fill" objectFit="cover" style={{ borderTopLeftRadius: "15px", borderTopRightRadius: "15px" }} />
                <Typography
                    variant="body1"
                    style={{
                      position: 'absolute', top: 20, right: 0, backgroundColor: "#195626", color: '#FFF',
                      padding: '0.5em', borderTopLeftRadius: '5px', borderBottomLeftRadius: '5px'
                    }}
                >
                  <span style={{ fontSize: '1.4em', fontWeight: 'bold', marginRight: '0.2em' }}>{remainingTime}</span>
                  <span style={{ fontSize: '0.7em' }}>{" left to pick up"}</span>
                </Typography>
              </div>
          )}
          <Grid padding={2} paddingTop={1}>
            <Typography fontFamily="Inter" fontWeight="600" fontSize="1em">{event.name}</Typography>
            <Grid item>
              <Typography variant="body1">{event.Location.address}</Typography>
            </Grid>
            <Grid container justifyContent={"space-between"}>
              <Grid item>
                <Typography variant="body1">
                  {`${foodAvailableDate}, ${foodAvailableTime} - ${endTimeFormatted}`}
                </Typography>
              </Grid>
              <Grid item>
                {adminView ? (
                    <Typography variant="body1" fontWeight="bold">
                      <span style={{ color: "green" }}>{`(${event.status.charAt(0).toUpperCase() + event.status.slice(1)})`}</span>
                      <span> Edit &gt;</span>
                    </Typography>
                ) : (
                    <Typography variant="body1" fontWeight="bold">
                      Learn More &gt;
                    </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
  );
};

export default EventCard;
