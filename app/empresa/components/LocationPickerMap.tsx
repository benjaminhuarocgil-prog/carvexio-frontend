"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const pickerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ lat, lng, onChange }: Props) {
  const markerRef = useRef<L.Marker>(null);

  const center: [number, number] = useMemo(() => {
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
    return [-12.046374, -77.042793]; // Lima por defecto
  }, [lat, lng]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onChange]
  );

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-3">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0 cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onChange={onChange} />
        <RecenterMap center={center} />

        {lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && (
          <Marker
            position={[lat, lng]}
            icon={pickerIcon}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
          >
            <Popup>
              <div className="font-bold text-xs text-slate-800">
                📍 Ubicación seleccionada de tu taller
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Haz clic en otra calle o arrastra este pin para ajustar la ubicación exactas.
              </p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm text-[11px] font-semibold text-slate-600">
        💡 Haz clic en cualquier parte del mapa o arrastra el pin
      </div>
    </div>
  );
}
