import React, { useState } from 'react';
import Select from 'react-select';
import { locations } from '@/utils/locations';
import { Location } from '@/types/types';

interface LocationDropdownProps {
  onLocationSelect: (location: Location) => void;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleLocationChange = (selectedOption: any) => {
    setSelectedLocation(selectedOption.value);
    onLocationSelect(selectedOption.value);
  };

  const locationOptions = locations.map((location) => ({
    label: location.address,
    value: location,
  }));

  return (
    <div style={{width:"100%"}}>
      <Select
        options={locationOptions}
        onChange={handleLocationChange}
        placeholder="Location"
        value={selectedLocation ? { label: selectedLocation.address, value: selectedLocation } : null}
        styles={customSelectStyles}
      />
    </div>
  );
};

export default LocationDropdown;

const customSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        color: 'secondary',
        borderRadius: '10px',
        width: '100%',
        height: "55px",
        fontSize: "0.9rem",
        borderColor: state.isFocused ? '#ab0101' : '#ab0101',
        '&:hover': {
            borderColor: '#ab0101',
        },
        boxShadow: state.isFocused ? '0 0 0 1px #ab0101' : 'none',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#505050',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'secondary',
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '10px',
      borderColor: '#ab0101',
      zIndex: 10000,
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: 0,
      zIndex: 10000,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#f5f5f5' : 'white',
      color: 'black',
      '&:hover': {
        backgroundColor: '#f5f5f5',
      },
    }),
  };