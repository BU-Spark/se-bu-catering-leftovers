import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { collection, query, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { Review } from '../app/functions/types';
import { ReviewCard } from "./ReviewCard";

interface ReviewsDisplayProps {
  eventId: string;
}

const ReviewsDisplay: React.FC<ReviewsDisplayProps> = ({ eventId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

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
    <Container maxWidth="md" style={{ padding: '1em', paddingTop: "7.5em"}}>
      <Typography variant="h4" marginBottom="0.7rem">Event Reviews</Typography>
      {reviews.map((review) => (
        <ReviewCard review={review}/>
      ))}
    </Container>
  );
};

export default ReviewsDisplay;