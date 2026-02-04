"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const eventIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MarkerData {
  position: [number, number];
  popup: string;
  isUser?: boolean;
}

interface MapProps {
  center: [number, number];
  zoom: number;
  markers: MarkerData[];
  className?: string;
}

// Component to fit bounds when markers change
function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (markers.length === 1) {
      map.setView(markers[0].position, 15);
    }
  }, [map, markers]);

  return null;
}

export default function MapComponent({ center, zoom, markers, className }: MapProps) {
  return (
    <div className={`${className} relative overflow-hidden rounded-lg border shadow-sm`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", minHeight: "120px" }}
        className="z-0"
        zoomControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={marker.isUser ? userIcon : eventIcon}
          >
            <Popup closeButton={false} className="custom-popup">
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: marker.popup }}
              />
            </Popup>
          </Marker>
        ))}

        <FitBounds markers={markers} />
      </MapContainer>

      {/* Loading overlay (shown while map initializes) */}
      <div className="absolute inset-0 bg-muted/20 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300" id="map-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
      </div>
    </div>
  );
}