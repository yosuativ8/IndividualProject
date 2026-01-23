import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for selected location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map centering when mapCenter prop changes
function MapCenterController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
}

// Component untuk handle click events pada map
function MapClickHandler({ onLocationSelect }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lon: lng });
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

export default function MapSelector({ onLocationSelect, selectedLocation, mapCenter, places }) {
  const defaultCenter = [-2.5489, 118.0149]; // Indonesia center
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [currentZoom, setCurrentZoom] = useState(5);
  const [mapKey, setMapKey] = useState(0); // Key untuk force re-render

  useEffect(() => {
    console.log('MapSelector received:', { mapCenter, selectedLocation });
    
    if (mapCenter && mapCenter.lat && mapCenter.lon) {
      console.log('Updating map to:', mapCenter);
      setCurrentCenter([mapCenter.lat, mapCenter.lon]);
      setCurrentZoom(mapCenter.zoom || 11);
      setMapKey(prev => prev + 1); // Force re-render map
    } else if (selectedLocation) {
      console.log('Updating map to selected location:', selectedLocation);
      setCurrentCenter([selectedLocation.lat, selectedLocation.lon]);
      setCurrentZoom(11);
      setMapKey(prev => prev + 1); // Force re-render map
    }
  }, [mapCenter, selectedLocation]);

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
      <MapContainer
        key={mapKey}
        center={currentCenter}
        zoom={currentZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
        doubleClickZoom={true}
        closePopupOnClick={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterController center={currentCenter} zoom={currentZoom} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={redIcon}>
            <Popup>
              <strong>Selected Location</strong>
              <br />
              Searching nearby destinations...
            </Popup>
          </Marker>
        )}
        
        {/* Render markers for places */}
        {places && places.length > 0 && places.map((place, idx) => (
          place.latitude && place.longitude && (
            <Marker 
              key={idx} 
              position={[place.latitude, place.longitude]}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                <small>{place.location}</small>
                <br />
                <small className="text-muted">{place.category}</small>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
