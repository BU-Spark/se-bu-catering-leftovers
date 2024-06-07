import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Typography, Grid, IconButton, Divider, TextField, Select, MenuItem, FormControl } from '@mui/material';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import styled from '@mui/material/styles/styled';
import { props } from "../app/functions/styling";
import { FoodItem } from '../app/functions/types';

interface FoodSelectionProps {
    foodItems: FoodItem[];
    setFoodItems: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

// Component to select food items on the Event form
export const FoodSelection: React.FC<FoodSelectionProps> = ({ foodItems, setFoodItems }) => {
    // Define the unit options from client
    const unitOptions = ['Trays', 'Pieces', 'Portions', 'Dozens', 'Cups', 'Bowls'];

    // Handle food item changes
    const handleFoodItemChange = (id: string, field: string, value: string) => {
        setFoodItems((prevItems) =>
            prevItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    // Add a food item
    const addFoodItem = () => {
        setFoodItems([...foodItems, { id: uuidv4(), quantity: '', item: '', unit: ''}]);
    };
    
    // Remove a food item
    const removeFoodItem = (id: string) => {
        setFoodItems(foodItems.filter((item) => item.id !== id));
    };

    return (
        <Grid
            padding={2}
            paddingLeft={0}
            paddingRight={0} 
            border={1} 
            borderColor="#ab0101" 
            borderRadius="12px"
        >   
            <Typography paddingLeft={2} fontSize="1.2rem" color="secondary">Select Food Items</Typography>
            <Grid marginBottom={2} paddingLeft={2} >
                <Grid container alignItems="center">
                    <Grid item sx={{ width: '15px' }}></Grid>
                    <Grid item marginLeft={2} sx={{ width: '40px' }} textAlign="left">
                        <Typography variant="body2">Qty.</Typography>
                    </Grid>
                    <Grid item marginLeft={1} sx={{ width: '80px' }} textAlign="left">
                        <Typography variant="body2">Unit</Typography>
                    </Grid>
                    <Grid container marginLeft={1} xs justifyContent="space-between" alignItems={"center"}>
                        <Grid item>
                            <Typography variant="body2">Food</Typography>
                        </Grid>
                        <Grid item paddingRight={0.5}>
                            <IconButton onClick={addFoodItem}>
                                <AddCircleRoundedIcon style={{fontSize:"30px"}} color="primary"/>
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item paddingRight={2}>
                    <Divider/>
                </Grid>
            </Grid>
            {foodItems.map((item) => (
                <Grid container marginBottom={2} paddingRight={2} key={item.id} alignItems="center" >
                    <Grid item >
                        <IconButton onClick={() => removeFoodItem(item.id)}>
                            <RemoveCircleRoundedIcon color="primary"/>
                        </IconButton>
                    </Grid>
                    <Grid item sx={{ maxWidth: '40px' }}>
                        <StyledTextField
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleFoodItemChange(item.id, 'quantity', e.target.value)}
                        />
                    </Grid>
                    <Grid item marginLeft={1} sx={{ width: '90px' }}>
                        <FormControl fullWidth size="small" sx={{...props}}>
                            <Select
                                value={item.unit}
                                onChange={(e) => handleFoodItemChange(item.id, 'unit', e.target.value)}
                                displayEmpty
                            >
                                {unitOptions.map((unit) => (
                                    <MenuItem key={unit} value={unit}>
                                        <Typography paddingTop={"1.5px"} fontSize={"0.8em"} textAlign="left">{unit}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item marginLeft={1} xs>
                        <StyledTextField
                            fullWidth
                            size="small"
                            value={item.item}
                            onChange={(e) => handleFoodItemChange(item.id, 'item', e.target.value)}
                        />
                    </Grid>
                </Grid>
            ))}
        </Grid>
    );
};


    // Customize the TextField component
export const StyledTextField = styled(TextField)({
    ...props
    });