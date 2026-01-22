import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component untuk handle click events pada map
function MapClickHandler({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect({ lat, lon: lng });
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Selected Location
        <br />
        Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
      </Popup>
    </Marker>
  ) : null;
}

export default function MapSelector({ onLocationSelect, selectedLocation }) {
  const defaultCenter = [-2.5489, 118.0149]; // Indonesia center
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lon]);
      setMapKey(prev => prev + 1); // Force map refresh
    }
  }, [selectedLocation]);

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
        doubleClickZoom={false}
        closePopupOnClick={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
            <Popup>
              Selected Location
              <br />
              Searching nearby destinations...
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
