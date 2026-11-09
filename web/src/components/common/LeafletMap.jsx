import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Controller to center or fit bounds
const MapBoundsController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

// Map click handler for selecting coordinates
const LocationPickerHandler = ({ onSelectLocation }) => {
  useMapEvents({
    click(e) {
      if (onSelectLocation) {
        onSelectLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

// Custom DivIcons with SVG & Tailwind
const createAmbulanceIcon = (status, type) => {
  const color =
    status === 'EN_ROUTE' || status === 'TRANSPORTING'
      ? '#ef4444'
      : status === 'AVAILABLE'
      ? '#10b981'
      : '#f59e0b';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: #0f172a; border: 2px solid ${color}; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
        <span style="position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background: ${color}; border-radius: 50%; border: 1.5px solid #0f172a;"></span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const createEmergencyIcon = (priority = 'P1') => {
  const color = priority === 'P1' ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createHospitalIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #0284c7; border: 2px solid #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12"/>
          <path d="M6 12h12"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

export const LeafletMap = ({
  center = [12.9716, 77.5946],
  zoom = 12,
  ambulances = [],
  emergencies = [],
  hospitals = [],
  routeCoordinates = null,
  routePolyline = null,
  isRoadNetwork = false,
  routingProvider = null,
  selectedLocation = null,
  onSelectLocation = null,
  height = '460px',
}) => {
  const activeRoute = routeCoordinates || routePolyline;

  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Route Provider Pill on Map */}
      {activeRoute && activeRoute.length > 1 && (
        <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
          <div
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md shadow-lg flex items-center gap-1.5 ${
              isRoadNetwork
                ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isRoadNetwork ? 'bg-sky-400' : 'bg-amber-400'}`}
            />
            <span>{routingProvider || (isRoadNetwork ? 'OSRM Road Network' : 'Geodesic Fallback')}</span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full dark-tiles"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsController center={center} zoom={zoom} />
        {onSelectLocation && <LocationPickerHandler onSelectLocation={onSelectLocation} />}

        {/* Hospitals */}
        {hospitals.map((hosp) => (
          <Marker
            key={hosp.id}
            position={[hosp.lat, hosp.lng]}
            icon={createHospitalIcon()}
          >
            <Popup className="text-slate-900">
              <div className="p-1">
                <h4 className="font-bold text-sm text-sky-900">{hosp.name}</h4>
                <p className="text-xs text-slate-600 mb-1">{hosp.address}</p>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="text-rose-600">ICU: {hosp.availableIcuBeds}/{hosp.totalIcuBeds}</span>
                  <span className="text-emerald-700">Gen: {hosp.availableGeneralBeds}/{hosp.totalGeneralBeds}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{hosp.traumaLevel}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ambulances */}
        {ambulances.map((amb) => (
          <Marker
            key={amb.id}
            position={[amb.lat, amb.lng]}
            icon={createAmbulanceIcon(amb.status, amb.type)}
          >
            <Popup className="text-slate-900">
              <div className="p-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                    {amb.vehicleNumber}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-700">
                    {amb.type} ({amb.status})
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">Driver: {amb.driverName}</p>
                <p className="text-xs text-slate-500">Speed: {amb.speedKmh} km/h • O2: {amb.batteryOxygenPct}%</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergencies */}
        {emergencies.map((emg) => {
          const lat = emg.pickupLocation?.lat ?? emg.lat ?? emg.latitude;
          const lng = emg.pickupLocation?.lng ?? emg.lng ?? emg.longitude;
          // Skip null, undefined, or extreme boundary values (e.g. test records with lat=-90, lng=-180)
          if (lat == null || lng == null) return null;
          if (lat <= -89.9 || lat >= 89.9 || lng <= -179.9 || lng >= 179.9) return null;
          const address = emg.pickupLocation?.address || emg.pickup_address || emg.address || 'Reported GPS Location';
          const priority = emg.priority || emg.severity || 'P1';
          const priorityLabel = emg.priorityLabel || (emg.severity ? `Critical - ${emg.severity}` : 'High Priority');
          const patientName = emg.patientName || emg.reporter_name || emg.patient_name || 'Emergency Incident';
          const eta = emg.etaMinutes ?? emg.estimated_eta_minutes ?? '8-12';
          const status = emg.status || 'Active';

          return (
            <Marker
              key={emg.id || emg.incident_code || Math.random()}
              position={[lat, lng]}
              icon={createEmergencyIcon(priority)}
            >
              <Popup className="text-slate-900">
                <div className="p-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    <span className="font-bold text-xs text-rose-700 uppercase">
                      {priorityLabel}
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900">{patientName}</h5>
                  <p className="text-[11px] text-slate-600 mb-1">{address}</p>
                  <div className="text-[11px] bg-slate-100 p-1 rounded font-mono text-slate-700">
                    ETA: ~{eta} mins | Status: {status}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Selected Location from Picker */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createEmergencyIcon('P1')}
          >
            <Popup>
              <div className="text-xs font-semibold">Selected Pickup Location</div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline (Road Network or Geodesic Trajectory) */}
        {activeRoute && activeRoute.length > 1 && (
          <Polyline
            positions={activeRoute}
            pathOptions={{
              color: isRoadNetwork ? '#38bdf8' : '#ef4444',
              weight: isRoadNetwork ? 5 : 4,
              opacity: isRoadNetwork ? 0.9 : 0.85,
              dashArray: isRoadNetwork ? null : '8, 8',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
