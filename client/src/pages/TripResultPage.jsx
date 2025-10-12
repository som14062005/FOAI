import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, Clock, Calendar, DollarSign, CloudRain, Sun, Cloud,
  Users, Star, Info, ChevronDown, ChevronUp, Save, RefreshCw,
  ArrowLeft, Navigation, Droplets, TrendingUp, Flag, X, Loader
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const TripResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ Get data from navigation state
  const userId = location.state?.userId || location.state?.tripInputData?.userId || sessionStorage.getItem('userId');
  const tripInputData = location.state?.tripInputData;
  const fromPlannedTrip = location.state?.fromPlannedTrip || false;

  const [tripData, setTripData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState({ 'Day 1': true });
  const [showAIInfo, setShowAIInfo] = useState(false);
  const [mapStyle, setMapStyle] = useState('default');
  const [selectedDay, setSelectedDay] = useState('all');
  const [routesLoading, setRoutesLoading] = useState(true);
  const [cachedRoutes, setCachedRoutes] = useState({});

  const mapStyles = {
    default: {
      name: '🌍 Default',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap'
    },
    dark: {
      name: '🌙 Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO'
    },
    light: {
      name: '☀️ Light',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO'
    },
    satellite: {
      name: '🛰️ Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    }
  };

  useEffect(() => {
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/[email protected]/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container {
        font-family: 'Inter', -apple-system, sans-serif;
        z-index: 1;
      }
      
      .custom-marker-icon {
        background: transparent !important;
        border: none !important;
      }

      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      }

      .leaflet-popup-content {
        margin: 0;
        width: 280px !important;
      }

      .leaflet-popup-tip {
        display: none;
      }

      .map-style-btn {
        transition: all 0.2s ease;
      }

      .map-style-btn:hover {
        transform: scale(1.05);
      }

      .day-filter-btn {
        transition: all 0.3s ease;
      }

      .day-filter-btn:hover {
        transform: translateY(-2px);
      }

      .map-container-wrapper {
        position: relative;
        width: 100%;
        height: 600px;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    return () => {
      document.head.removeChild(leafletCSS);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTripData();
    } else {
      console.error('❌ No userId found. Redirecting to dashboard...');
      alert('Session expired. Please log in again.');
      navigate('/user-dashboard');
    }
  }, [userId]);

  // ✅ Transform data for Flask backend with proper nested structure
  // ✅ FINAL FIX: Transform data matching Flask backend expectations
// ✅ FINAL CORRECTED: Match Flask backend format exactly (mixed case)
const transformToBackendFormat = (frontendData) => {
  return {
    latestTrip: {
      user_id: frontendData.userId,           // snake_case (not used in plan_trip_csp but included)
      district: frontendData.district,        // plain
      days: frontendData.days,                // plain
      budget: frontendData.budget,            // plain
      travelWith: frontendData.travelWith     // ✅ camelCase - line 242 expects this
    },
    travelerProfile: {
      travelerType: frontendData.travelerType  // ✅ camelCase - line 243 expects this
    }
  };
};



  // ✅ CORRECTED: fetchTripData function with dual flow support
  const fetchTripData = async () => {
    try {
      setLoading(true);

      // ✅ If coming from planned trips, use the provided data
      if (fromPlannedTrip && tripInputData) {
        console.log('📥 Using provided trip data:', tripInputData);
        
        // Transform to backend format with nested structure
        const backendFormattedData = transformToBackendFormat(tripInputData);
        
        console.log('🔄 Transformed data for backend:', backendFormattedData);
        
        // Call AI to generate trip with the transformed data
        const aiRes = await axios.post(
          'http://localhost:5000/generate-trip', 
          backendFormattedData,
          {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ AI Response:', aiRes.data);
        setTripData(aiRes.data);
        setUserInfo(tripInputData);
      } 
      // ✅ Otherwise, use the old flow (fetch from backend)
      else {
        console.log('📥 Fetching trip from backend for userId:', userId);
        
        const userRes = await axios.get(`http://localhost:3000/trips/input/${userId}`);
        setUserInfo(userRes.data);
        
        // The old flow already returns properly formatted data
        const aiRes = await axios.post(
          'http://localhost:5000/generate-trip', 
          userRes.data,
          {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        setTripData(aiRes.data);
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching trip:', error);
      
      let errorMessage = 'Failed to generate trip.\n\n';
      
      if (error.response) {
        console.error('Backend error response:', error.response.data);
        errorMessage += `Server Error: ${error.response.data?.error || error.response.data?.message || error.response.statusText}\n`;
        if (error.response.data?.details) {
          errorMessage += `Details: ${JSON.stringify(error.response.data.details)}`;
        }
      } else if (error.request) {
        errorMessage += 'Cannot connect to AI service.\n\n';
        errorMessage += 'Please ensure:\n';
        errorMessage += '✓ Flask backend is running on http://localhost:5000\n';
        errorMessage += '✓ No firewall is blocking the connection';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripData && tripData.itinerary) {
      fetchAllRoutes();
    }
  }, [tripData]);

  const fetchAllRoutes = async () => {
    setRoutesLoading(true);
    const routes = {};
    
    try {
      const promises = Object.entries(tripData.itinerary).map(async ([day, dayPlaces], idx) => {
        const validPlaces = dayPlaces.filter(p => p.latitude && p.longitude);
        if (validPlaces.length >= 2) {
          const waypoints = validPlaces.map(p => 
            `${parseFloat(p.longitude)},${parseFloat(p.latitude)}`
          ).join(';');
          
          try {
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
              const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
              routes[day] = {
                coordinates,
                color: getDayColor(idx)
              };
            }
          } catch (error) {
            console.error(`Error fetching route for ${day}:`, error);
            routes[day] = {
              coordinates: validPlaces.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]),
              color: getDayColor(idx)
            };
          }
        }
      });

      await Promise.all(promises);
      setCachedRoutes(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setRoutesLoading(false);
    }
  };

  const toggleDay = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const sanitizeTripDataForBackend = (tripData) => {
    const sanitized = JSON.parse(JSON.stringify(tripData));
    
    if (sanitized.itinerary) {
      Object.keys(sanitized.itinerary).forEach(day => {
        sanitized.itinerary[day] = sanitized.itinerary[day].map(place => ({
          name: place.name,
          type: place.type,
          duration: place.duration,
          rating: place.rating,
          timing: place.timing,
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          weather: place.weather ? {
            temp: place.weather.temp,
            condition: place.weather.condition,
            description: place.weather.description,
            humidity: place.weather.humidity
          } : undefined,
          explanation: place.explanation ? {
            reasons: place.explanation.reasons || []
          } : undefined
        }));
      });
    }
    
    return sanitized;
  };

  const saveTripHandler = async () => {
    if (!userId || !tripData) {
      alert('⚠️ Missing required data. Please regenerate the trip.');
      return;
    }

    setSaving(true);

    try {
      const sanitizedTripData = sanitizeTripDataForBackend(tripData);

      const payload = {
        userId: userId,
        tripData: {
          district: sanitizedTripData.district,
          days: sanitizedTripData.days,
          budget: sanitizedTripData.budget,
          travelWith: sanitizedTripData.travelWith,
          travelerType: sanitizedTripData.travelerType,
          algorithm: sanitizedTripData.algorithm || 'Hybrid TSP + ML Recommendation',
          stats: {
            totalPlaces: sanitizedTripData.stats.totalPlaces,
            totalDuration: sanitizedTripData.stats.totalDuration
          },
          itinerary: sanitizedTripData.itinerary,
          weatherForecast: sanitizedTripData.weatherForecast || [],
          aiFeatures: sanitizedTripData.aiFeatures || {}
        },
        tags: [
          `${sanitizedTripData.travelWith} trip`,
          sanitizedTripData.district,
          `${sanitizedTripData.days} days`,
          sanitizedTripData.travelerType
        ],
        notes: `AI-generated trip on ${new Date().toLocaleDateString()}`
      };

      console.log('📤 Saving sanitized trip:', payload);

      const response = await axios.post(
        'http://localhost:3000/api/saved-trips',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Save response:', response.data);

      if (response.data.success) {
        alert(
          `✅ Trip Saved Successfully!\n\n` +
          `Trip ID: ${response.data.data._id}\n` +
          `District: ${sanitizedTripData.district}\n` +
          `Duration: ${sanitizedTripData.days} days`
        );
        
        sessionStorage.setItem('lastSavedTripId', response.data.data._id);
      }

    } catch (error) {
      console.error('❌ Save error:', error);
      
      let errorMessage = 'Failed to save trip. Please try again.';

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        
        if (error.response.status === 400) {
          console.error('Validation errors:', error.response.data);
          
          if (Array.isArray(error.response.data.message)) {
            errorMessage = 'Validation failed:\n' + error.response.data.message.join('\n');
          }
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if it\'s running.';
      }

      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const replanHandler = () => {
    setLoading(true);
    fetchTripData();
  };

  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Rain': return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'Clear': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'Clouds': return <Cloud className="w-5 h-5 text-gray-500" />;
      default: return <Sun className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDayColor = (dayIndex) => {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
    ];
    return colors[dayIndex % colors.length];
  };

  const createMarkerIcon = (number, color, isFirst = false, isLast = false) => {
    const label = isFirst ? 'S' : isLast ? 'E' : number;
    
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div style="position: relative;">
          <svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow-${number}-${color}">
                <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/>
              </filter>
            </defs>
            <path d="M22 0C13.716 0 7 6.716 7 15c0 8.284 15 39 15 39s15-30.716 15-39c0-8.284-6.716-15-15-15z" 
                  fill="${color}" 
                  stroke="white"
                  stroke-width="2"
                  filter="url(#shadow-${number}-${color})"/>
            <circle cx="22" cy="15" r="10" fill="white"/>
            <text x="22" y="${isFirst || isLast ? '19' : '21'}" text-anchor="middle" fill="${color}" font-size="${isFirst || isLast ? '14' : '13'}" font-weight="bold">${label}</text>
          </svg>
        </div>
      `,
      iconSize: [44, 54],
      iconAnchor: [22, 54],
      popupAnchor: [0, -54]
    });
  };

  const MapController = ({ places }) => {
    const map = useMap();

    useEffect(() => {
      if (places.length > 0) {
        const bounds = L.latLngBounds(
          places.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }, [places, map]);

    return null;
  };

  const OptimizedTripMap = ({ itinerary }) => {
    const allDays = Object.keys(itinerary);
    
    const getFilteredPlaces = () => {
      const places = [];
      
      if (selectedDay === 'all') {
        Object.entries(itinerary).forEach(([day, dayPlaces], dayIdx) => {
          dayPlaces.forEach((place, placeIdx) => {
            if (place.latitude && place.longitude) {
              places.push({
                ...place,
                day,
                dayNum: dayIdx + 1,
                placeNum: placeIdx + 1,
                color: getDayColor(dayIdx),
                isFirst: placeIdx === 0,
                isLast: placeIdx === dayPlaces.length - 1
              });
            }
          });
        });
      } else {
        const dayIndex = allDays.indexOf(selectedDay);
        const dayPlaces = itinerary[selectedDay];
        
        dayPlaces.forEach((place, placeIdx) => {
          if (place.latitude && place.longitude) {
            places.push({
              ...place,
              day: selectedDay,
              dayNum: dayIndex + 1,
              placeNum: placeIdx + 1,
              color: getDayColor(dayIndex),
              isFirst: placeIdx === 0,
              isLast: placeIdx === dayPlaces.length - 1
            });
          }
        });
      }
      
      return places;
    };

    const getVisibleRoutes = () => {
      if (selectedDay === 'all') {
        return cachedRoutes;
      } else {
        return { [selectedDay]: cachedRoutes[selectedDay] };
      }
    };

    const places = getFilteredPlaces();
    const visibleRoutes = getVisibleRoutes();

    if (places.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-8">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No map data available</p>
        </div>
      );
    }

    const centerLat = places.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / places.length;
    const centerLng = places.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / places.length;

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDay === 'all' ? 'Complete Trip Route' : `${selectedDay} Route`}
                </h3>
                <p className="text-sm text-gray-500">
                  {places.length} location{places.length > 1 ? 's' : ''} • Instant switching
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              {Object.entries(mapStyles).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setMapStyle(key)}
                  className={`map-style-btn px-3 py-1.5 rounded text-xs font-medium ${
                    mapStyle === key 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedDay('all')}
              className={`day-filter-btn px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                selectedDay === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              All Days
            </button>
            
            {allDays.map((day, idx) => {
              const dayPlaces = itinerary[day].filter(p => p.latitude && p.longitude);
              const color = getDayColor(idx);
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`day-filter-btn px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    selectedDay === day
                      ? 'text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border-2 hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: selectedDay === day ? color : 'white',
                    borderColor: selectedDay === day ? color : '#e5e7eb'
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: selectedDay === day ? 'white' : color 
                    }}
                  />
                  {day} ({dayPlaces.length})
                </button>
              );
            })}
          </div>

          {routesLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Loading optimized routes...</span>
            </div>
          )}

          {selectedDay !== 'all' && !routesLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Info className="w-4 h-4" />
                <span>Viewing {selectedDay} only</span>
              </div>
              <button
                onClick={() => setSelectedDay('all')}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                title="Show all days"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="map-container-wrapper">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url={mapStyles[mapStyle].url}
              attribution={mapStyles[mapStyle].attribution}
            />

            <MapController places={places} />

            {!routesLoading && Object.entries(visibleRoutes).map(([day, route]) => (
              route && route.coordinates && (
                <div key={day}>
                  <Polyline
                    positions={route.coordinates}
                    pathOptions={{
                      color: 'white',
                      weight: 8,
                      opacity: 0.8
                    }}
                  />
                  <Polyline
                    positions={route.coordinates}
                    pathOptions={{
                      color: route.color,
                      weight: 5,
                      opacity: 1
                    }}
                  />
                </div>
              )
            ))}

            {places.map((place, idx) => (
              <Marker
                key={`${place.day}-${idx}`}
                position={[parseFloat(place.latitude), parseFloat(place.longitude)]}
                icon={createMarkerIcon(
                  place.placeNum, 
                  place.color, 
                  place.isFirst, 
                  place.isLast
                )}
                zIndexOffset={place.isFirst ? 1000 : place.isLast ? 999 : 100}
              >
                <Popup>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-base pr-2">{place.name}</h4>
                      <span 
                        className="px-2 py-0.5 rounded text-white text-xs font-medium whitespace-nowrap"
                        style={{ backgroundColor: place.color }}
                      >
                        {place.day}
                      </span>
                    </div>
                    
                    {(place.isFirst || place.isLast) && (
                      <div className="mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white ${place.isFirst ? 'bg-green-500' : 'bg-red-500'}`}>
                          <Flag className="w-3 h-3" />
                          {place.isFirst ? 'Start' : 'End'}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{place.duration} hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{place.rating}/5</span>
                      </div>
                      <div className="pt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {place.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>🗺️ Routes cached for instant switching • OSRM optimized paths</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span>Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span>End</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">
            🤖 AI is planning your perfect trip...
          </p>
          {fromPlannedTrip && tripInputData && (
            <div className="mt-6 bg-white rounded-xl p-6 shadow-2xl max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-2">Planning your trip to:</p>
              <p className="text-2xl font-bold text-indigo-600 mb-4">{tripInputData.district}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">{tripInputData.days} days</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Budget</p>
                  <p className="text-sm font-bold text-gray-900">{tripInputData.budget}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Travel With</p>
                  <p className="text-sm font-bold text-gray-900">{tripInputData.travelWith}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Personalizing for {tripInputData.travelerType} travelers...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Failed to generate trip. Please try again.</p>
          <button 
            onClick={() => navigate('/user-dashboard')} 
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/user-dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={replanHandler}
                disabled={loading || saving}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Replan Trip
              </button>
              <button 
                onClick={saveTripHandler}
                disabled={loading || saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Your AI-Powered Trip to {tripData.district}
              </h1>
              <p className="text-gray-600 text-lg">
                Personalized for <span className="font-semibold text-indigo-600">{tripData.travelerType}</span>
              </p>
            </div>
            <button 
              onClick={() => setShowAIInfo(!showAIInfo)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              <TrendingUp className="w-4 h-4" />
              AI Features
            </button>
          </div>

          {showAIInfo && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6 border border-purple-200">
              <h3 className="font-semibold text-lg text-purple-900 mb-4 flex items-center gap-2">
                🤖 AI/ML Technologies Used
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(tripData.aiFeatures).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">{key.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-700 mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-purple-700 font-medium">
                Algorithm: {tripData.algorithm}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Duration</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tripData.days} Days</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Places</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tripData.stats.totalPlaces}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Total Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tripData.stats.totalDuration}hrs</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Budget</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tripData.budget}</p>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-pink-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Travel With</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tripData.travelWith}</p>
            </div>
          </div>
        </div>

        {tripData.weatherForecast && tripData.weatherForecast.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-500" />
              Weather Forecast
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {tripData.weatherForecast.map((weather) => (
                <div key={weather.day} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Day {weather.day}</p>
                  <div className="flex items-center justify-between mb-2">
                    {getWeatherIcon(weather.condition)}
                    <span className="text-2xl font-bold text-gray-900">{weather.temp}°C</span>
                  </div>
                  <p className="text-xs text-gray-600 capitalize">{weather.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Droplets className="w-3 h-3" />
                    <span>{weather.humidity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tripData.itinerary && <OptimizedTripMap itinerary={tripData.itinerary} />}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Itinerary</h2>
          
          {Object.entries(tripData.itinerary).map(([day, places]) => (
            <div key={day} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleDay(day)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 flex items-center justify-between hover:from-indigo-600 hover:to-purple-700 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {day.split(' ')[1]}
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold">{day}</h3>
                    <p className="text-indigo-100 text-sm">
                      {places.length} places • {places.reduce((sum, p) => sum + p.duration, 0)} hours
                    </p>
                  </div>
                </div>
                {expandedDays[day] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </button>

              {expandedDays[day] && (
                <div className="p-6 space-y-6">
                  {places.map((place, index) => (
                    <div key={index} className="border-l-4 border-indigo-400 pl-6 relative">
                      <div className="absolute left-0 top-6 transform -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white"></div>

                      <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{place.name}</h4>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                {place.duration} hours
                              </span>
                              <span className="flex items-center gap-1 text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500" />
                                {place.rating}/5
                              </span>
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                {place.type}
                              </span>
                              <span className="text-gray-500">⏰ {place.timing}</span>
                            </div>
                          </div>
                          
                          {place.weather && (
                            <div className="bg-white rounded-lg p-3 shadow-sm border ml-4">
                              <div className="flex items-center gap-2">
                                {getWeatherIcon(place.weather.condition)}
                                <div>
                                  <p className="text-xs text-gray-500">{place.weather.condition}</p>
                                  <p className="font-bold text-gray-900">{place.weather.temp}°C</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {place.explanation && (
                          <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-purple-900 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Why We Recommend This
                              </h5>
                            </div>
                            <ul className="space-y-2">
                              {place.explanation.reasons.map((reason, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {place.latitude && place.longitude && (
                          <button
                            onClick={() => window.open(`https://www.google.com/maps?q=${place.latitude},${place.longitude}`, '_blank')}
                            className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <Navigation className="w-4 h-4" />
                            View on Map
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={saveTripHandler}
            disabled={saving}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving Trip...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save This Trip
              </>
            )}
          </button>
          <button 
            onClick={replanHandler}
            disabled={loading || saving}
            className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Generate New Plan
          </button>
        </div>
      </main>
    </div>
  );
};

export default TripResultPage;
