import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '@/types/types';

interface MapProps {
  location: Location;
}

// Fix for marker icons not showing correctly
// Override the default marker icons with custom icons to improve visual appearance
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SetViewOnLocationChange = ({ location }: { location: Location }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([parseFloat(location.lat), parseFloat(location.lon)], 16);
  }, [location, map]);

  return null;
};

const Map: React.FC<MapProps> = ({ location }) => {
  
  
  return (
    <MapContainer center={[parseFloat(location.lat), parseFloat(location.lon)]} zoom={16} style={{ height: '200px', width: '100%', borderRadius: "10px" }}>
      <TileLayer
        url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
        attribution= '© CARTO'
      />
      <Marker position={[parseFloat(location.lat), parseFloat(location.lon)]}>
        <Popup>{location.address}</Popup>
      </Marker>
      <SetViewOnLocationChange location={location} />
    </MapContainer>
  );
};

export default Map;

// Stamen Design: Provides a variety of map styles such as watercolor, toner, and terrain.

// URL: https://{s}.tile.stamen.com/{style}/{z}/{x}/{y}.png
// Example: https://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg
// CartoDB: Offers various map styles like light, dark, and voyager.

// URL: https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png
// Example: https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png