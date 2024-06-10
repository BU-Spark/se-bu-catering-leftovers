import React from 'react';
import SwipeableViews from 'react-swipeable-views';
import { virtualize } from 'react-swipeable-views-utils';
import { Typography, Grid } from '@mui/material';
import { useEffect } from 'react';

interface ImageSliderProps {
    imageUrls: string[];
    remainingTime: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ imageUrls, remainingTime }) => {
    const [index, setIndex] = React.useState(0);
    
    return (
        <div>
            {imageUrls.length > 0 && (
                <Grid >
                    <SwipeableViews enableMouseEvents onChangeIndex={setIndex} style={{borderRadius: "15px"}}>
                    {imageUrls.map((url, index) => (
                        <div>
                            <img src={url} alt={`Event image ${index + 1}`} 
                                style={{ height: "150px", objectFit: "cover"}} 
                            />
                        </div>
                    ))}
                    </SwipeableViews>
                    <Typography
                        variant="body1"
                        style={{
                            position: 'relative',
                            top: -135,
                            left: "50%",
                            width: "50%",
                            backgroundColor: "#195626",
                            color: '#FFF',
                            padding: '0.5em',
                            borderTopLeftRadius: '5px',
                            borderBottomLeftRadius: '5px',
                            zIndex: 1,
                        }}
                        >
                        <span style={{ fontSize: "0.9rem", fontWeight: 'bold', marginRight: '0.2em' }}>{remainingTime}</span>
                        <span style={{ fontSize: '0.7em' }}>{" left"}</span>
                    </Typography>
                    <div style={{ position: 'relative', top: -60, left:"90%", transform: 'translateX(-50%)', display: 'flex' }}>
                        {imageUrls.map((_, idx) => (
                            <div
                            key={idx}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: idx === index ? "#ab0101" : '#DDD',
                                margin: '0 5px'
                                
                            }}
                            />
                        ))}
                    </div>
                </Grid>
            )}
        </div>
    )
}
