"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const branchIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: "user-gps-marker",
  html: `<div class="relative flex items-center justify-center">
           <div class="absolute h-5 w-5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
           <div class="relative h-4.5 w-4.5 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
             <div class="h-1.5 w-1.5 bg-white rounded-full"></div>
           </div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type MapBranch = {
  id: number;
  name: string | null;
  address: string | null;
  district: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  branches: MapBranch[];
  onSelectBranch: (id: number) => void;
  userCoords: { lat: number; lng: number } | null;
};

function AutoFitBounds({ center, branches, userCoords }: { center: [number, number]; branches: MapBranch[]; userCoords: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    const validPoints: [number, number][] = [];
    
    // Add valid branch points
    branches.forEach(b => {
      if (b.latitude != null && b.longitude != null && !isNaN(b.latitude) && !isNaN(b.longitude)) {
        validPoints.push([b.latitude, b.longitude]);
      }
    });

    // Add user coords point
    if (userCoords) {
      validPoints.push([userCoords.lat, userCoords.lng]);
    }

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(center, 13);
    }
  }, [branches, userCoords, map, center]);

  return null;
}

// Calculate distance in kilometers using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export default function BranchesMap({ branches, onSelectBranch, userCoords }: Props) {
  const validBranches = useMemo(() => {
    return branches.filter(b => b.latitude != null && b.longitude != null && !isNaN(b.latitude) && !isNaN(b.longitude));
  }, [branches]);

  const center: [number, number] = useMemo(() => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (validBranches.length > 0) {
      return [validBranches[0].latitude!, validBranches[0].longitude!];
    }
    return [-12.046374, -77.042793]; // Lima default
  }, [validBranches, userCoords]);

  return (
    <div className="w-full h-[450px] relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds center={center} branches={validBranches} userCoords={userCoords} />

        {/* User GPS marker */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="font-bold text-xs text-blue-600">📍 Tu ubicación actual</div>
            </Popup>
          </Marker>
        )}

        {/* Branch Markers */}
        {validBranches.map(branch => {
          const distance = userCoords
            ? calculateDistance(userCoords.lat, userCoords.lng, branch.latitude!, branch.longitude!)
            : null;

          return (
            <Marker
              key={branch.id}
              position={[branch.latitude!, branch.longitude!]}
              icon={branchIcon}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="font-bold text-sm text-slate-800 tracking-tight">
                    {branch.name || `Sede ${branch.id}`}
                  </div>
                  
                  {branch.district && (
                    <span className="inline-block mt-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      {branch.district}
                    </span>
                  )}

                  {distance != null && (
                    <span className="ml-2 inline-block bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      A {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`}
                    </span>
                  )}

                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    📍 {branch.address || "Sin dirección exacta"}
                  </div>

                  {branch.phone && (
                    <div className="text-xs text-slate-400 mt-1 font-semibold">
                      📞 {branch.phone}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectBranch(branch.id)}
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-200 text-center"
                  >
                    Seleccionar esta sede
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
