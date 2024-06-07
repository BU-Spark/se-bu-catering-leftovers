import SwipeableViews from 'react-swipeable-views';
import { virtualize } from 'react-swipeable-views-utils';
import { Typography, Grid } from '@mui/material';

interface ImageSliderProps {
    imageUrls: string[];
    remainingTime: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ imageUrls, remainingTime }) => {

    const VirtualizeSwipeableViews = virtualize(SwipeableViews);

    const slideRenderer = ({key, index}) => {
        // Calculate the actual index to loop the images if index is out of bounds
        const actualIndex = Math.abs(index % imageUrls.length);
        const url = imageUrls[actualIndex];
        return (
            <div key={key}>
                <img src={url} alt={`Event image ${actualIndex + 1}`} 
                    style={{ borderRadius: "15px", 
                        height: "150px", objectFit: "cover"
                    }} />
                <Typography
                    variant="body1"
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        top: 20,
                        right: 0,
                        backgroundColor: "#195626",
                        color: '#FFF',
                        padding: '0.5em',
                        borderTopLeftRadius: '5px',
                        borderBottomLeftRadius: '5px'
                    }}
                    >
                    <span style={{ fontSize: '1.4em', fontWeight: 'bold', marginRight: '0.2em' }}>{remainingTime}</span>
                    <span style={{ fontSize: '0.7em' }}>{" left to pick up"}</span>
                </Typography>
                <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex' }}>
                    {imageUrls.map((_, idx) => (
                        <div
                        key={idx}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: idx === actualIndex ? '#FFF' : '#AAA',
                            margin: '0 5px'
                        }}
                        />
                    ))}
                    </div>
            </div>
        );
    };
    return (
        <div>
            {imageUrls.length > 0 && (
                <VirtualizeSwipeableViews 
                    enableMouseEvents
                    slideRenderer={slideRenderer}
                />
                    
            )}
        </div>
    )
}
