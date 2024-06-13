import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Grid, Paper, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from "@mui/material/styles";
import { props } from "../functions/styling";
import { ImageUpload } from '../components/ImageUpload';
import { Review, Event } from '../functions/types';
import { useRouter } from 'next/navigation';

interface FeedbackFormProps {
    event: Event;
    review: Review;
    onSubmit: (review: Review, eventId: string, userId: string) => void;
}

// This component is the intake form where users can submit feedback for events
export const FeedbackForm: React.FC<FeedbackFormProps> = ({ event, review, onSubmit }) => {
    const userId = "xQXZfuSgOIfCshFKWAou"; // Placeholder for user authentication
    const [formData, setFormData] = useState<Review>(review);
    const [images, setImages] = useState<string[]>(review.images);
    const [shareContact, setShareContact] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const router = useRouter();
    
    // Update form data when user types
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Validate the form before submitting
    const validateForm = () => {
        if (!formData.comment) {
            alert("Please add a comment before submitting.");
            return false;
        }
        if (shareContact && !name && !email) {
            alert("Please provide either your name or email if you wish to share your contact information.");
            return false;
        }
        return true;
    };

    // Submit the form to DB
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        const reviewToSubmit = {
            ...formData,
            images: images,
            shareContact: shareContact,
            name: shareContact ? name : '',
            email: shareContact ? email : ''
        };
        await onSubmit(reviewToSubmit, event.id, userId);
        router.back();
    };

    // Add image to the form
    const setImageUrl = (url: string) => {
        setImages([...images, url]);
    };

    // Remove image from the form
    const removeImage = (url: string) => {
        setImages(images.filter((image) => image !== url));
    };

return (
    <div style={{ background: "#FFF6EE" }}>
        <Container maxWidth="sm" style={{ padding: "1em", paddingTop: "7em", background: "#FFF6EE" }}>
            <Paper elevation={3} style={{ padding: '1em', paddingTop: "0.5em", paddingLeft: "0em" }}>
                <Grid item maxWidth={"40px"} paddingLeft="0.5em">
                    <IconButton onClick={() => router.back()}>
                        <ArrowBackIcon color="secondary" />
                    </IconButton>
                </Grid>
                <Grid item textAlign={"left"} paddingLeft="1em" xs>
                    <Typography variant="h4" gutterBottom>
                        {event.name}
                    </Typography>
                </Grid>
                <Grid container paddingLeft="1em">
                    <Grid item xs={12} marginTop={1}>
                        <ImageUpload setImageUrl={setImageUrl} removeImage={removeImage} review={formData} />
                    </Grid>
                    <Grid item textAlign={"left"} marginTop={1} xs>
                        <Typography variant="h6">
                            Feedback
                        </Typography>
                    </Grid>
                    <Grid item xs={12} marginTop={1}>
                        <StyledTextField
                            fullWidth
                            label="Comments"
                            name="comment"
                            multiline
                            rows={4}
                            value={formData.comment}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid container xs={12} alignItems="center"  marginTop={1}>
                        <FormControlLabel
                            control={<Checkbox size="medium" checked={shareContact} onChange={() => setShareContact(!shareContact)} />}
                            label={<Typography alignSelf="center" fontSize="0.8em">Would you like to share your contact information?</Typography>}
                        />
                    </Grid>
                    {shareContact && (
                        <>
                            <Grid item xs={12}>
                                <StyledTextField
                                    fullWidth
                                    label="Name (Optional)"
                                    name="name"
                                    value={name}
                                    size="small"
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} marginTop={2} marginBottom={1}>
                                <StyledTextField
                                    fullWidth
                                    label="Email (Optional)"
                                    name="email"
                                    value={email}
                                    size="small"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Grid>
                        </>
                    )}
                    <Grid container xs={12} justifyContent={"center"} marginTop={1}>
                        <Button variant="outlined" color="primary" style={{ borderRadius: "20px", borderWidth: "3px", borderColor: "#ab0101", textTransform: "none" }} fullWidth size="large" onClick={handleSubmit}>
                            <Typography variant="button">Submit</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    </div>
    );
};

// Customize the TextField component
export const StyledTextField = styled(TextField)({
    ...props
    });