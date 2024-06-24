import React, { useState } from 'react';
import axios from 'axios';
import { Location } from '@/types/types';
import { TextField, IconButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import styled from '@emotion/styled';
import { props } from '@/styles/styling';

interface GeocodeSearchProps {
  onLocationSelect: (location: Location) => void;
}

const GeocodeSearch: React.FC<GeocodeSearchProps> = ({ onLocationSelect }) => {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<any[]>([]);

    // Search for location
    const searchLocation = async () => {
        try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'us', 
        },
        });
        setResults(response.data);
        } catch (error) {
        console.error('Error searching location:', error);
        }
    };

    // Handle location selection
    const handleSelect = (result: any) => {
        // Create abbreviated address
        const abbreviatedAddress = `${result.address.name}, ${result.address.city}, ${result.address.state}`;

        const location: Location = {
            address: result.display_name,
            abbreviatedAddress: abbreviatedAddress,
            lat: result.lat,
            lon: result.lon,
        };
        onLocationSelect(location);
        setResults([]);
        setQuery('');
    };

    // Search for location when Enter key is pressed
    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
          searchLocation();
        }
      };

    return (
        <div>
        <StyledTextField
            fullWidth
            sx={{width:"100%"}}
            label="Location"
            name="location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            InputProps={{
              endAdornment: (
                <IconButton onClick={searchLocation}>
                  <SearchIcon />
                </IconButton>
              ),
            }}
        />

        <List style={{ zIndex: 1, width: '100%' }}>
            {results.map((result) => (
            <ListItem
                key={result.place_id}
                onClick={() => handleSelect(result)}
                style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}
            >
                <ListItemText primary={result.display_name} secondary={`${result.address.city}, ${result.address.state}`} />
            </ListItem>
            ))}
        </List>
        </div>
    );
};

export default GeocodeSearch;

// Customize the TextField component
export const StyledTextField = styled(TextField)({
    ...props
    });