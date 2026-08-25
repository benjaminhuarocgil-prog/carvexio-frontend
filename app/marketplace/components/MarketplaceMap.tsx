"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons in React / Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(37,99,235,0.9);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type Business = {
  id: number;
  name?: string;
  category?: string;
  address?: string;
  phone?: string;
  photoUrl?: string;
  description?: string;
  district?: string;
  department?: string;
  latitude?: number;
  longitude?: number;
};

type Props = {
  businesses: Business[];
  userLocation: { lat: number; lng: number } | null;
  categoryLabel: (cat: string) => string;
};

// Haversine formula to compute distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MarketplaceMap({ businesses, userLocation, categoryLabel }: Props) {
  // Generar coordenadas reales o aproximadas en Lima para empresas sin geolocalización fijada
  const businessesWithLocation = businesses.map((b, idx) => {
    if (b.latitude != null && b.longitude != null) {
      return { ...b, lat: b.latitude, lng: b.longitude, isEstimated: false };
    }
    // Fallback alrededor de Lima basado en el id/índice para no superponer
    const offsetLat = ((idx % 7) - 3) * 0.015;
    const offsetLng = (((idx * 3) % 7) - 3) * 0.015;
    return {
      ...b,
      lat: -12.046374 + offsetLat,
      lng: -77.042793 + offsetLng,
      isEstimated: true,
    };
  });
  
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : businessesWithLocation.length > 0 
      ? [businessesWithLocation[0].lat, businessesWithLocation[0].lng]
      : [-12.046374, -77.042793]; // Lima default

  return (
    <div className="relative w-full h-[550px] rounded-3xl overflow-hidden border border-slate-200 shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={defaultCenter} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="font-bold text-xs text-blue-600">📍 Tu ubicación actual</div>
            </Popup>
          </Marker>
        )}

        {/* Business Markers */}
        {businessesWithLocation.map((biz) => {
          const lat = biz.lat;
          const lng = biz.lng;
          const dist = userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
            : null;

          return (
            <Marker key={biz.id} position={[lat, lng]} icon={defaultIcon}>
              <Popup>
                <div className="w-52 p-1 text-slate-900">
                  {biz.photoUrl && (
                    <img
                      src={biz.photoUrl}
                      alt={biz.name ?? "Taller"}
                      className="w-full h-24 object-cover rounded-xl mb-2"
                    />
                  )}
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight mb-1">
                    {biz.name}
                  </h4>
                  {biz.category && (
                    <span className="inline-block bg-orange-100 text-orange-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md mb-1.5">
                      {categoryLabel(biz.category)}
                    </span>
                  )}
                  {biz.address && (
                    <p className="text-xs text-slate-500 mb-2 truncate" title={biz.address}>
                      📍 {biz.address}
                    </p>
                  )}
                  {dist != null && (
                    <p className="text-xs font-bold text-emerald-600 mb-2">
                      ⚡ A {dist} km de ti
                    </p>
                  )}
                  <Link
                    href={`/business/${biz.id}`}
                    className="block text-center w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition"
                  >
                    Ver taller &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
