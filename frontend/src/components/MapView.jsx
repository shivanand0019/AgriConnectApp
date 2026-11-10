import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icons in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapView = ({
  pickup = { lat: 12.2958, lng: 76.6394, title: 'Mysuru Farm / APMC Yard' },
  delivery = { lat: 12.9716, lng: 77.5946, title: 'Bengaluru Wholesale Market' },
  height = '320px',
}) => {
  const pickupPos = [pickup.lat || 12.2958, pickup.lng || 76.6394];
  const deliveryPos = [delivery.lat || 12.9716, delivery.lng || 77.5946];
  const centerPos = [
    (pickupPos[0] + deliveryPos[0]) / 2,
    (pickupPos[1] + deliveryPos[1]) / 2,
  ];

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0 relative">
      <MapContainer
        center={centerPos}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pickupPos}>
          <Popup>
            <div className="text-xs font-semibold">
              📍 Pickup / Origin:
              <br />
              {pickup.title}
            </div>
          </Popup>
        </Marker>
        <Marker position={deliveryPos}>
          <Popup>
            <div className="text-xs font-semibold">
              🏁 Delivery Destination:
              <br />
              {delivery.title}
            </div>
          </Popup>
        </Marker>
        <Polyline positions={[pickupPos, deliveryPos]} color="#16a34a" weight={4} dashArray="8, 8" />
      </MapContainer>
    </div>
  );
};

export default MapView;
