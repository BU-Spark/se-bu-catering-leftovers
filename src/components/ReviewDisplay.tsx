import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid } from '@mui/material';
import { collection, query, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { Review } from '../functions/types';
import { ReviewCard } from "./ReviewCard";
import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ReviewsDisplayProps {
  eventId: string;
}

const ReviewsDisplay: React.FC<ReviewsDisplayProps> = ({ eventId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, `Reviews/${eventId}/Reviews`), (snapshot) => {
      fetchReviews();
    });
    
    return () => unsubscribe(); // Cleanup listener on unmount

  }, [eventId]);

  const fetchReviews = async () => {
    const reviewsRef = collection(firestore, `Reviews/${eventId}/Reviews`);
    const q = query(reviewsRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const reviewsList = querySnapshot.docs.map(doc => doc.data() as Review);
    setReviews(reviewsList);
  };

  return (
    <Container maxWidth="md" style={{ paddingTop: "7em"}}>
        <IconButton onClick={()=> router.back()} style={{paddingLeft: "0em"}}>
            <ArrowBackIcon color="secondary" />
        </IconButton>
        <Typography variant="h4" marginBottom="0.7rem">Event Reviews</Typography>
        {reviews.length === 0 ? (
          <Typography variant="body1" style={{ marginTop: 20, textAlign: "center", fontStyle: "italic" }}>
              There is no feedback currently available. Stay tuned for updates!
          </Typography>
        ) : (
          reviews.map((review) => (
            <ReviewCard review={review}/>
          ))
        )}
    </Container>
  );
};

export default ReviewsDisplay;