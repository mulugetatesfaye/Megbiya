"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface EventMapProps {
  locationName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  className?: string;
}

export default function EventMap({
  locationName,
  address,
  latitude,
  longitude,
  className = "",
}: EventMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Get user's current location for directions
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShowDirections(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback: just show the event location
          setShowDirections(true);
        }
      );
    } else {
      setShowDirections(true);
    }
  };

  // Generate Google Maps directions URL
  const getDirectionsUrl = () => {
    const destination = encodeURIComponent(`${locationName}, ${address}`);
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destination}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  };

  // Check if we have valid coordinates for the map
  const hasValidCoordinates = latitude && longitude && !isNaN(latitude) && !isNaN(longitude);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Location Details */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base leading-tight">{locationName}</h4>
          <p className="text-sm text-muted-foreground mt-1">{address}</p>

          {/* Action Controls - Compact */}
          <div className="flex items-center gap-2 mt-3">
            {hasValidCoordinates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="h-8 px-3 text-xs"
              >
                <Map className="h-3 w-3 mr-1.5" />
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={getUserLocation}
              className="h-8 px-3 text-xs"
              disabled={showDirections}
            >
              <Navigation className="h-3 w-3 mr-1.5" />
              {showDirections ? "Directions Ready" : "Directions"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-3 text-xs"
            >
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Maps
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Map Container - Collapsible */}
      {hasValidCoordinates && showMap && (
        <div className="relative animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <DynamicMap
            center={[latitude, longitude]}
            zoom={15}
            markers={[
              {
                position: [latitude, longitude],
                popup: `<strong>${locationName}</strong><br/>${address}`,
              },
              ...(userLocation ? [{
                position: [userLocation.lat, userLocation.lng] as [number, number],
                popup: "<strong>Your Location</strong><br/>Current position",
                isUser: true,
              }] : []),
            ]}
            className="w-full h-48 rounded-lg overflow-hidden border shadow-sm"
          />

          {/* Directions Status - Overlay */}
          {showDirections && (
            <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-sm rounded-md p-2 border shadow-lg">
              <p className="text-xs text-foreground">
                ✅ Map shows directions from your location
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fallback for no coordinates */}
      {!hasValidCoordinates && (
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Location map not available
          </span>
        </div>
      )}
    </div>
  );
}