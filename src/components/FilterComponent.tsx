import React, {useState} from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface FilterComponentProps {
    onSelectFilter: (filter: string) => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({ onSelectFilter }) => {
    const [filters, setFilters] = useState<null | HTMLElement>(null);

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilters(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilters(null);
    };

    const handleFilterSelect = (filter: string) => {
        onSelectFilter(filter);
        handleFilterClose();
    };

    return (
        <>
            <IconButton onClick={handleFilterClick}>
                <FilterListIcon />
            </IconButton>
            <Menu
                anchorEl={filters}
                open={Boolean(filters)}
                onClose={handleFilterClose}
            >
                <MenuItem onClick={() => handleFilterSelect("All")}>All</MenuItem>
                <MenuItem onClick={() => handleFilterSelect("Central")}>Central</MenuItem>
                <MenuItem onClick={() => handleFilterSelect("East")}>East</MenuItem>
                <MenuItem onClick={() => handleFilterSelect("West")}>West</MenuItem>
                <MenuItem onClick={() => handleFilterSelect("South")}>South</MenuItem>
                {/* Add more options as needed */}
            </Menu>
        </>
    );
};

export default FilterComponent;