import React, { useState, useRef, useEffect } from 'react';
import { storage, firestore } from '@/../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4} from 'uuid';
import { Button, Typography, Grid, IconButton } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import HighlightOffTwoToneIcon from '@mui/icons-material/HighlightOffTwoTone';
import { Event, Review } from '@/types/types';
import { getImageUrls } from '@/utils/imageUtils';

interface ImageUploadProps {
    setImageUrl: (url: string) => void;
    removeImage: (url: string) => void;
    event?: Event;
    review?: Review;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({setImageUrl, removeImage, event, review}) => {
    const [image, setImage] = useState<File | null>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const fileInput = useRef<HTMLInputElement | null>(null);

    useEffect (() => {
        const fetchImages = async (imagePaths: string[]) => {
            const urls = await getImageUrls(imagePaths);
            setUploadedImages(urls);
        };
        if (event) {
            if (event.images) {
                fetchImages(event.images);
            }
        } else if (review) {
            if (review.images) {
                fetchImages(review.images);
            }
        }

    }, []);

    const uploadImage = () => {
        if (uploadedImages.length >= 3) {
            alert('You can upload up to 3 images.');
            return;
        }
        
        if (image == null) return;
        const directory = event ? `events/images/${image.name + uuidv4()}` : `reviews/images/${image.name + uuidv4()}`;
        const storageRef = ref(storage, directory);

        uploadBytes(storageRef, image).then(() => {
            console.log('Upload is done!');
            getDownloadURL(storageRef).then((url) => {
                setImageUrl(url);
                setUploadedImages((prev) => [...prev, url]);
            });
        })
    };
    
    // Check if image is uploaded
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImage(event.target.files ? event.target.files[0] : null);
    };

    // TODO: Has bug
    // Delete image from storage
    const handleDeleteImage = async (url: string) => {
        const storageRef = ref(storage, url);

        await deleteObject(storageRef);

        // const eventRef = doc(firestore, `Events`, event.id as string);
        // await updateDoc(eventRef, {images: arrayRemove(url)});

        setUploadedImages((prev) => prev.filter((img) => img !== url));
        removeImage(url);
    };
    
    return (
        <Grid container>
            <Grid
                padding={2} 
                border={1} 
                borderColor="#ab0101" 
                borderRadius="12px"
                textAlign="center"
                xs={uploadedImages.length > 0 ? 5.5 : 12}
                sm
                
            >   
                    <input
                        style={{ display: 'none' }}
                        id="contained-button-file"
                        type="file"
                        ref={fileInput}
                        onChange={handleImageChange}/>
                    <label htmlFor="contained-button-file">
                        <IconButton onClick={() => fileInput.current?.click()}>
                            <FileUploadOutlinedIcon style={{fontSize:"60px"}} color="primary"/>
                        </IconButton>
                    </label>
                        <Typography variant="body2">Upload Photo</Typography>
                        {image && (
                            <Button variant="outlined" color="secondary" size="small" onClick={uploadImage}>
                                <Typography sx={{fontSize:{xs:"0.7em", sm: "0.9em"},  maxWidth:{xs:"90px", sm: "200px"},  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{"Upload " + image.name} </Typography>
                            </Button>
                        )}
            
            </Grid>
            {uploadedImages.length > 0 && (
                <Grid
                    paddingLeft={1}
                    marginLeft={1}
                    textAlign="center"
                    position="relative"
                    xs
                    sm={5}
                    height="160px"
                >   
                
                    <img src={uploadedImages[uploadedImages.length - 1]} alt={`Uploaded`} style={{ height: "100%", objectFit: "cover", borderRadius:"12px"}}/>
                    <IconButton 
                        onClick={() => handleDeleteImage(uploadedImages[uploadedImages.length - 1])} 
                        color="primary"
                        size="small"
                        style={{
                            position: 'absolute',
                            left: -10,
                            top: -10,
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                        }}
                        >
                        <HighlightOffTwoToneIcon />
                    </IconButton>
                </Grid> 
            )}       
        </Grid>
    );
};
