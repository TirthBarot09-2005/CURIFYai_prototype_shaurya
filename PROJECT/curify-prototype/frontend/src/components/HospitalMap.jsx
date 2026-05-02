import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2, Hospital, X, Info } from 'lucide-react';
import axios from 'axios';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper to calculate distance
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MapController = ({ center, searchLocation, onSearchResolved }) => {
  const map = useMap();

  useEffect(() => {
    if (searchLocation) {
      const geocode = async () => {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json&limit=1`);
          if (res.data && res.data.length > 0) {
            const { lat, lon } = res.data[0];
            const newPos = [parseFloat(lat), parseFloat(lon)];
            
            // Manual marker cleanup as requested before flying
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) map.removeLayer(layer);
            });
            
            map.flyTo(newPos, 13);
            onSearchResolved(newPos);
          }
        } catch (err) { console.error("Geocoding failed", err); }
      };
      geocode();
    }
  }, [searchLocation, map, onSearchResolved]);

  useEffect(() => {
    if (center && !searchLocation) map.setView(center, 14);
  }, [center, map, searchLocation]);

  return null;
};



export default function HospitalMap({ searchLocation }) {
  const [position, setPosition] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(() => {
    return localStorage.getItem('curify_location_pref') || 'prompt';
  }); 
  const defaultCity = [21.1458, 79.0882]; // Nagpur

  // Auto-fetch if previously allowed
  useEffect(() => {
    if (permission === 'granted') {
      handleAllow();
    }
  }, []);

  const fetchHospitals = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const query = `[out:json];(node["amenity"="hospital"](around:5000,${lat},${lon});way["amenity"="hospital"](around:5000,${lat},${lon});rel["amenity"="hospital"](around:5000,${lat},${lon}););out center;`;
      const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      const results = res.data.elements.map(el => ({
        id: el.id,
        name: el.tags.name || el.tags['name:en'] || 'Unnamed Hospital',
        lat: el.lat || el.center.lat,
        lon: el.lon || el.center.lon,
        type: el.tags.healthcare || el.tags.amenity || 'Medical Center',
        distance: getDistance(lat, lon, el.lat || el.center.lat, el.lon || el.center.lon)
      })).sort((a, b) => a.distance - b.distance).slice(0, 5);

      setHospitals(results);
    } catch (err) {
      console.error("Overpass fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchResolved = useCallback((newPos) => {
    setHospitals([]); // Clear state markers
    setPosition(newPos);
    fetchHospitals(newPos[0], newPos[1]);
  }, [fetchHospitals]);

  const handleAllow = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setPermission('granted');
        localStorage.setItem('curify_location_pref', 'granted');
        fetchHospitals(latitude, longitude);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setPermission('denied');
        localStorage.setItem('curify_location_pref', 'denied');
        setPosition(defaultCity);
        fetchHospitals(defaultCity[0], defaultCity[1]);
      }
    );
  };

  const handleDeny = () => {
    setPermission('denied');
    localStorage.setItem('curify_location_pref', 'denied');
    setPosition(defaultCity);
    fetchHospitals(defaultCity[0], defaultCity[1]);
  };

  return (
    <div className="relative w-full h-[380px] rounded-[18px] overflow-hidden border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-[#0f172a]">
      {permission === 'prompt' && (
        <div className="absolute inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <MapPin className="text-emerald-400" size={24} />
          </div>
          <h3 className="text-white font-bold mb-2">Find Nearby Hospitals</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-[240px]">
            Allow location access to discover hospitals and clinics within 5km of your current position.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDeny} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs hover:bg-white/10 transition-all">
              Use Default City
            </button>
            <button onClick={handleAllow} className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              Allow Location Access
            </button>
          </div>
        </div>
      )}

      {position && (
        <>
          <MapContainer center={position} zoom={14} className="w-full h-full dark-map" zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={position} icon={redIcon}>
              <Popup className="custom-popup">
                <div className="text-slate-900 font-bold text-xs text-center">Current Center</div>
              </Popup>
            </Marker>

            {hospitals.map((h, i) => (
              <Marker key={h.id} position={[h.lat, h.lon]} icon={i === 0 ? goldIcon : redIcon}>
                <Popup className="custom-popup">
                  <div className="text-slate-900 p-1 min-w-[160px]">
                    {i === 0 && (
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                        ⭐ Recommended
                      </span>
                    )}
                    <h4 className="font-bold text-sm leading-tight text-slate-800 mb-1">{h.name}</h4>
                    <div className="mt-2 border-t border-slate-100 pt-2 mb-3 text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase leading-none block mb-1">Distance</span>
                      <span className="text-sm font-black text-emerald-600 leading-tight">{h.distance.toFixed(1)} km</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${position[0]},${position[1]}&destination=${h.lat},${h.lon}`, '_blank');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <MapPin size={12} /> Open in Google Maps
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapController 
              center={position} 
              searchLocation={searchLocation} 
              onSearchResolved={handleSearchResolved} 
            />
          </MapContainer>

          {/* Bottom Bar */}
          <div className="absolute bottom-4 left-0 right-0 z-[1000] px-4 pointer-events-none">
            <div className="max-w-[280px] mx-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full py-1.5 px-3 flex items-center justify-between shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Hospital size={12} className="text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-white">
                  {loading ? (
                    <Loader2 size={10} className="animate-spin inline" />
                  ) : (
                    <span className="text-emerald-400">{hospitals.length}</span>
                  )} Hospitals Nearby
                </span>
              </div>
              
              <button 
                onClick={() => { setPosition([...position]); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold transition-all active:scale-95"
              >
                <Navigation size={10} /> Re-center
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .dark-map .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container {
          background: #0f172a;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-content {
          margin: 10px;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container a.leaflet-popup-close-button {
            color: #94a3b8;
            padding: 8px;
        }
        .leaflet-routing-container {
          display: none;
        }
      `}</style>
    </div>
  );
}
