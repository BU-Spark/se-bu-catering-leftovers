import React, { useState, useRef } from 'react';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4} from 'uuid';
import { Button, Typography, Grid, IconButton } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import HighlightOffTwoToneIcon from '@mui/icons-material/HighlightOffTwoTone';

interface ImageUploadProps {
    setImageUrl: (url: string) => void;
    removeImage: (url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({setImageUrl, removeImage}) => {
    const [image, setImage] = useState<File | null>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const fileInput = useRef(null);

    const uploadImage = () => {
        if (image == null) return;
        const storageRef = ref(storage, `images/${image.name + uuidv4()}`);

        uploadBytes(storageRef, image).then(() => {
            console.log('Upload is done!');
            getDownloadURL(storageRef).then((url) => {
                setImageUrl(url);
                setUploadedImages((prev) => [...prev, url]);
            });
        })
    };
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImage(event.target.files ? event.target.files[0] : null);
    };

    const handleDeleteImage = async (url: string) => {
        const storageRef = ref(storage, url);

        await deleteObject(storageRef);

        setUploadedImages((prev) => prev.filter((img) => img !== url));
        removeImage(url);
    };
    return (
        <Grid container>
            <Grid
                padding={2} 
                border={1} 
                marginRight={1}
                borderColor="#ab0101" 
                borderRadius="12px"
                textAlign="center"
                xs
                sm
                
            >   
                    <input
                        style={{ display: 'none' }}
                        id="contained-button-file"
                        type="file"
                        ref={fileInput}
                        onChange={handleImageChange}/>
                    <label htmlFor="contained-button-file">
                        <IconButton onClick={() => fileInput.current.click()}>
                            <FileUploadOutlinedIcon style={{fontSize:"60px"}} color="primary"/>
                        </IconButton>
                    </label>
                        <Typography variant="body1">Upload Photo</Typography>
                        {image && (
                            <Button variant="outlined" color="secondary" size="small" sx={{fontSize:{xs: "0.55em", sm: "0.7em"}}} onClick={uploadImage}>
                                {"Upload " + image.name} 
                            </Button>
                        )}
            
            </Grid>
            {uploadedImages.length > 0 && (
                <Grid
                    paddingLeft={1}
                    textAlign="center"
                    position="relative"
                    xs={7}
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



{/* <div>
<input 
    type="file" 
    onChange={(event) => {
        setImage(event.target.files ? event.target.files[0] : null)
        }}/>
<button onClick={uploadImage}>Upload Image</button>
</div> */}

