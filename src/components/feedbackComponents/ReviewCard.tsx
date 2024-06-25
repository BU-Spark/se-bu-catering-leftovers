
import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Rating from '@mui/material/Rating';
import { Review } from '@/types/types';
import { getImageUrls } from '@/utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import { styled } from 'styled-components';

interface ReviewCardProps {
    review: Review;
}

const StyledRating = styled(Rating)({
    '& .MuiRating-iconFilled': {
        color: "#ab0101",
      }
});

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    useEffect(() => {
        const fetchImageUrls = async () => {
            if (!review.images || review.images.length === 0) {
                setImageUrls([]);
                return;
            } else {
                const urls = await getImageUrls(review.images);
                setImageUrls(urls); 
            }
        };

        fetchImageUrls();
    }, [review.images]);

    return (
        <Paper elevation={3} style={{ padding: '1em', marginBottom: '1em'}}>
            <Grid container paddingTop="10px">
                <Grid container alignItems="center" marginBottom="0.5em">
                    <AccountCircleIcon sx={{fontSize:"40px", color: "#eb8dbd"}}/>
                    <Grid item direction="column">
                        <Typography marginLeft="5px" variant="body1" fontSize="0.8rem">{review.shareContact? review.name : "Anonymous"}</Typography>
                        <Typography marginLeft="5px" variant="body1" fontSize="0.8rem">{review.shareContact? review.email : ""}</Typography>
                    </Grid>
                </Grid>
                <Grid container direction="column">
                    <Grid container alignItems="center" marginBottom="8px">
                        <Typography variant="body2" fontSize="0.8rem" color="textSecondary">
                            {formatDistanceToNow(review.date.toDate(), { addSuffix: true })}
                        </Typography>
                    </Grid>
                    <Typography variant="body2" fontSize="0.8rem">{review.comment}</Typography>
                    <Grid container xs marginTop="8px" justifyContent={"center"}>
                        {review.images && review.images.length > 0 && (
                            review.images.length == 1 ? (
                                <Grid container sx={{maxWidth:{xs:"40%", sm: "25%"}}}>
                                    <img src={imageUrls[0]} alt={`Review Image 1`} style={{ width: '100%', height:"100%", objectFit: "cover", borderRadius: "5px" }} />
                                </Grid>
                            ) : (
                                <Grid container spacing={1} sx={{maxWidth:{xs:"80%", sm: "50%"}}}>
                                    {imageUrls.slice(0,2).map((image, idx) => (
                                        <Grid item key={idx} xs={6}>
                                            <img src={image} alt={`Review Image ${idx}`} style={{ width: '100%', height:"100%", objectFit: "cover", borderRadius: "5px" }} />
                                        </Grid>
                                    ))}
                                </Grid> 
                            )
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </Paper>

    )
}