import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, Navigation, ArrowLeft, Play, StopCircle, Clock, 
  MapPinned, Locate, Route, ChevronRight, CheckCircle2, 
  AlertCircle, Loader, Bell, Phone, Volume2, VolumeX
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { API_CONFIG } from '../config';

const LiveMapPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [allPlaces, setAllPlaces] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [heading, setHeading] = useState(0);
  const [watchId, setWatchId] = useState(null);
  
  // SMS notification states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [notifiedPlaces, setNotifiedPlaces] = useState(new Set());
  const [proximityThreshold, setProximityThreshold] = useState(500);

  // Voice guidance states
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  // Leaflet CSS setup
  useEffect(() => {
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/[email protected]/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container { font-family: 'Inter', -apple-system, sans-serif; z-index: 1; }
      .custom-marker-icon { background: transparent !important; border: none !important; }
      .leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
      .current-location-marker { animation: pulse 2s infinite; }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      .arrow-marker { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }
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

  // Load saved phone number
  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhoneNumber');
    const savedSmsEnabled = localStorage.getItem('smsAlertsEnabled') === 'true';
    const savedVoiceEnabled = localStorage.getItem('voiceGuidanceEnabled') !== 'false';
    
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setSmsEnabled(savedSmsEnabled);
    }
    setVoiceEnabled(savedVoiceEnabled);
  }, []);

  // ✅ FIXED: Get username correctly from sessionStorage
  const generateWelcomeMessage = () => {
    // ✅ Use 'username' (lowercase) as you saved it in sessionStorage
    const userName = sessionStorage.getItem('username') || 
                     sessionStorage.getItem('userName') || 
                     'friend';
    
    const destination = tripData.tripData.district;
    const firstPlace = allPlaces[0]?.name;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const welcomeMessage = `Hello ${userName}. Now time is ${timeString}. Your final destination is ${destination}. The next nearest planned spot is ${firstPlace} as per the plan. Let's go!`;
    
    return welcomeMessage;
  };
// Add this function before the return statement
const checkLocationPermission = async () => {
  console.log('🔍 Checking location status...');
  
  // Check if API exists
  if (!navigator.geolocation) {
    alert('❌ Geolocation API not available in this browser');
    return;
  }

  // Try to get permission state
  if (navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      alert(`📍 Location Permission: ${result.state}\n\n` +
            `Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                       navigator.userAgent.includes('Safari') ? 'Safari' : 
                       navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'}\n\n` +
            `HTTPS: ${window.location.protocol === 'https:'}\n` +
            `Origin: ${window.location.origin}`);
    } catch (error) {
      alert('❌ Cannot check permission state');
    }
  } else {
    alert('⚠️ Permission API not supported');
  }

  // Test geolocation
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      alert(`✅ Location Working!\n\nLat: ${pos.coords.latitude}\nLng: ${pos.coords.longitude}`);
    },
    (err) => {
      alert(`❌ Location Error\n\nCode: ${err.code}\nMessage: ${err.message}`);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

  // ✅ FIXED: Text-to-Speech with proper voice loading
  const speak = (text) => {
    if (!voiceEnabled) return;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // ✅ Function to select and speak with female voice
    const speakWithVoice = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        // Priority order for female voices
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Victoria') ||
          voice.name.includes('Fiona') ||
          voice.name.includes('Moira') ||
          voice.name.includes('Google UK English Female') ||
          voice.name.includes('Microsoft Zira') ||
          (voice.lang.startsWith('en-') && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman')
          ))
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('🔊 Using female voice:', femaleVoice.name);
        } else {
          const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('🔊 Using voice:', englishVoice.name);
          }
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
      console.log('🔊 Speaking:', text);
    };

    // ✅ FIXED: Ensure voices are loaded before speaking
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      // Voices not loaded yet, wait for them
      window.speechSynthesis.onvoiceschanged = () => {
        speakWithVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      // Voices already loaded
      speakWithVoice();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    localStorage.setItem('voiceGuidanceEnabled', newState.toString());
    
    if (!newState) {
      stopSpeaking();
    } else {
      speak('Voice guidance is now on');
    }
  };

  // Fetch trip data
  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
  try {
    setLoading(true);
    
    // ✅ Use dynamic API URL that works on mobile
    const baseURL = API_CONFIG.getBaseURL();
    const response = await axios.get(`${baseURL}/api/saved-trips/${tripId}`);
    
    if (response.data.success) {
      const trip = response.data.data;
      setTripData(trip);
      
      const places = [];
      if (trip.tripData.itinerary) {
        Object.entries(trip.tripData.itinerary).forEach(([day, dayPlaces], dayIdx) => {
          dayPlaces.forEach((place, placeIdx) => {
            if (place.latitude && place.longitude) {
              places.push({
                ...place,
                day: day,
                dayIndex: dayIdx,
                placeIndex: placeIdx,
                isFirst: placeIdx === 0 && dayIdx === 0,
                isLast: placeIdx === dayPlaces.length - 1 && dayIdx === Object.keys(trip.tripData.itinerary).length - 1
              });
            }
          });
        });
      }
      setAllPlaces(places);
      console.log('📍 Extracted places:', places);
      console.log('🔗 API URL used:', baseURL); // ✅ Debug log
    }
    setLoading(false);
  } catch (error) {
    console.error('Error fetching trip:', error);
    console.error('API URL:', API_CONFIG.getBaseURL()); // ✅ Debug log
    alert(`Failed to load trip data: ${error.message}`);
    setLoading(false);
  }
};

  // Location tracking
  useEffect(() => {
    if (navigationActive) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [navigationActive]);

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading: deviceHeading } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          if (deviceHeading !== null) {
            setHeading(deviceHeading);
          }
          console.log('📍 Location updated:', latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Fetch route
  useEffect(() => {
    if (currentLocation && allPlaces.length > 0 && navigationActive) {
      const currentDestination = allPlaces[currentPlaceIndex];
      if (currentDestination) {
        fetchRoute(currentLocation, {
          lat: parseFloat(currentDestination.latitude),
          lng: parseFloat(currentDestination.longitude)
        });
      }
    }
  }, [currentLocation, currentPlaceIndex, allPlaces, navigationActive]);

  const fetchRoute = async (from, to) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoordinates(coordinates);
        
        const distanceKm = (route.distance / 1000).toFixed(2);
        const durationMin = Math.round(route.duration / 60);
        setDistance(distanceKm);
        setEta(durationMin);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Send SMS notification
  const sendProximityAlert = async (place, distanceInMeters) => {
    if (!smsEnabled || !phoneNumber) return;
    if (notifiedPlaces.has(place.name)) return;

    try {
      const response = await axios.post('http://localhost:3000/api/sms/send-proximity-alert', {
        phoneNumber: phoneNumber,
        placeName: place.name,
        distance: Math.round(distanceInMeters),
        timing: place.timing || 'N/A',
        rating: place.rating || 'N/A'
      });

      if (response.data.success) {
        console.log('✅ SMS sent successfully for', place.name);
        setNotifiedPlaces(prev => new Set([...prev, place.name]));
        
        speak(`You are near ${place.name}. It is ${Math.round(distanceInMeters)} meters away.`);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Near ${place.name}`, {
            body: `You're ${Math.round(distanceInMeters)}m away! SMS alert sent.`,
            icon: '/map-icon.png'
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
    }
  };

  // Check proximity
  useEffect(() => {
    if (currentLocation && allPlaces.length > 0 && navigationActive && smsEnabled) {
      allPlaces.forEach((place) => {
        const distanceToPlace = haversineDistance(
          currentLocation.lat,
          currentLocation.lng,
          parseFloat(place.latitude),
          parseFloat(place.longitude)
        );

        if (distanceToPlace <= proximityThreshold && !notifiedPlaces.has(place.name)) {
          console.log(`📍 Near ${place.name} (${Math.round(distanceToPlace)}m)`);
          sendProximityAlert(place, distanceToPlace);
        }
      });
    }
  }, [currentLocation, allPlaces, navigationActive, smsEnabled]);

  // Check arrival
  useEffect(() => {
    if (currentLocation && allPlaces.length > 0 && navigationActive) {
      const currentDestination = allPlaces[currentPlaceIndex];
      if (currentDestination) {
        const dist = haversineDistance(
          currentLocation.lat,
          currentLocation.lng,
          parseFloat(currentDestination.latitude),
          parseFloat(currentDestination.longitude)
        );

        if (dist < 100) {
          handleArrival();
        }
      }
    }
  }, [currentLocation]);

  const handleArrival = () => {
    const currentPlace = allPlaces[currentPlaceIndex];
    
    speak(`You have reached ${currentPlace.name}. Enjoy your visit!`);
    
    alert(`✅ You've arrived at ${currentPlace.name}!`);
    
    if (currentPlaceIndex < allPlaces.length - 1) {
      setTimeout(() => {
        setCurrentPlaceIndex(prev => prev + 1);
        const nextPlace = allPlaces[currentPlaceIndex + 1];
        speak(`Next stop is ${nextPlace.name}`);
      }, 2000);
    } else {
      speak('Trip completed. Thank you for traveling with us. Have a great day!');
      alert('🎉 Trip completed!');
      setNavigationActive(false);
    }
  };

  const startNavigation = () => {
    if (!currentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setNavigationActive(true);
          
          setTimeout(() => {
            const welcomeMessage = generateWelcomeMessage();
            speak(welcomeMessage);
          }, 1000);
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setNavigationActive(true);
      
      setTimeout(() => {
        const welcomeMessage = generateWelcomeMessage();
        speak(welcomeMessage);
      }, 1000);
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // ✅ FIXED: Use correct username key
  const stopNavigation = () => {
    const userName = sessionStorage.getItem('username') || 
                     sessionStorage.getItem('userName') || 
                     'friend';
    stopSpeaking();
    speak(`Navigation stopped. Goodbye ${userName}. Have a nice day!`);
    
    setTimeout(() => {
      setNavigationActive(false);
      setCurrentPlaceIndex(0);
      setRouteCoordinates([]);
      setEta(null);
      setDistance(null);
      setNotifiedPlaces(new Set());
    }, 1000);
  };

  const savePhoneNumber = () => {
    if (phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    localStorage.setItem('userPhoneNumber', phoneNumber);
    localStorage.setItem('smsAlertsEnabled', 'true');
    setSmsEnabled(true);
    setShowPhoneInput(false);
    speak('S M S alerts are now on');
    alert('✅ SMS alerts enabled!');
  };

  const createArrowMarker = (heading) => {
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="arrow-marker" style="transform: rotate(${heading}deg);">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#4F46E5" opacity="0.3"/>
            <circle cx="20" cy="20" r="12" fill="#4F46E5"/>
            <path d="M20 8 L28 26 L20 22 L12 26 Z" fill="white"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createPlaceMarker = (index, isActive, isCompleted) => {
    const color = isCompleted ? '#10b981' : isActive ? '#ef4444' : '#6366f1';
    const label = isCompleted ? '✓' : index + 1;
    
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div style="position: relative;">
          <svg width="36" height="46" viewBox="0 0 36 46">
            <path d="M18 0C11.373 0 6 5.373 6 12c0 6.627 12 34 12 34s12-27.373 12-34c0-6.627-5.373-12-12-12z" 
                  fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="18" cy="12" r="8" fill="white"/>
            <text x="18" y="${isCompleted ? '16' : '17'}" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${label}</text>
          </svg>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 46],
      popupAnchor: [0, -46]
    });
  };

  const MapUpdater = () => {
    const map = useMap();
    useEffect(() => {
      if (currentLocation && navigationActive) {
        map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), {
          animate: true,
          duration: 0.5
        });
      }
    }, [currentLocation, map]);
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-semibold">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 font-semibold">Trip not found</p>
          <button onClick={() => navigate('/my-trips')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const currentDestination = allPlaces[currentPlaceIndex];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-md z-50 border-b-2 border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/recent')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">{tripData.tripData.district} Trip</h1>
              <p className="text-xs text-gray-600">{tripData.tripData.days} days • {allPlaces.length} places</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  voiceEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {isSpeaking && <span className="animate-pulse">●</span>}
              </button>

              <button
                onClick={() => setShowPhoneInput(!showPhoneInput)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  smsEnabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                SMS
              </button>

              {!navigationActive ? (
                <button onClick={startNavigation} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
                  <Play className="w-4 h-4" />
                  Start
                </button>
              ) : (
                <button onClick={stopNavigation} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg">
                  <StopCircle className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {showPhoneInput && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border-2 border-indigo-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                SMS Alert Settings
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Phone Number (with country code)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+917010176099"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-600 mb-1">Distance (m)</label>
                  <input
                    type="number"
                    value={proximityThreshold}
                    onChange={(e) => setProximityThreshold(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <button onClick={savePhoneNumber} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 You'll receive SMS alerts when within {proximityThreshold}m of any place
              </p>
            </div>
          )}
        </div>
      </header>

      {navigationActive && currentDestination && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Navigating to</p>
                  <h3 className="text-xl font-bold">{currentDestination.name}</h3>
                  <p className="text-sm text-indigo-100 flex items-center gap-2">
                    Place {currentPlaceIndex + 1} of {allPlaces.length}
                    {smsEnabled && (
                      <span className="inline-flex items-center gap-1 bg-green-500/30 px-2 py-0.5 rounded-full text-xs">
                        <Bell className="w-3 h-3" />
                        SMS
                      </span>
                    )}
                    {voiceEnabled && (
                      <span className="inline-flex items-center gap-1 bg-blue-500/30 px-2 py-0.5 rounded-full text-xs">
                        {isSpeaking ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                        Voice
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {eta && distance && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-sm text-indigo-100">Distance</p>
                    <p className="text-2xl font-bold">{distance} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-indigo-100">ETA</p>
                    <p className="text-2xl font-bold">{eta} min</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <MapContainer
          center={
            currentLocation 
              ? [currentLocation.lat, currentLocation.lng]
              : allPlaces.length > 0 
                ? [parseFloat(allPlaces[0].latitude), parseFloat(allPlaces[0].longitude)]
                : [13.0827, 80.2707]
          }
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          <MapUpdater />

          {currentLocation && navigationActive && (
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createArrowMarker(heading)} zIndexOffset={1000}>
              <Popup>
                <div className="p-2 text-center">
                  <p className="font-semibold text-indigo-600">Your Location</p>
                  <p className="text-xs text-gray-600">Live tracking active</p>
                  {smsEnabled && <p className="text-xs text-green-600 mt-1">✓ SMS enabled</p>}
                  {voiceEnabled && <p className="text-xs text-blue-600 mt-1">🔊 Voice ON</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {routeCoordinates.length > 0 && navigationActive && (
            <>
              <Polyline positions={routeCoordinates} pathOptions={{ color: 'white', weight: 8, opacity: 0.8 }} />
              <Polyline positions={routeCoordinates} pathOptions={{ color: '#4F46E5', weight: 5, opacity: 1, dashArray: '10, 10' }} />
            </>
          )}

          {allPlaces.map((place, index) => {
            const isActive = index === currentPlaceIndex && navigationActive;
            const isCompleted = index < currentPlaceIndex && navigationActive;
            
            return (
              <Marker
                key={index}
                position={[parseFloat(place.latitude), parseFloat(place.longitude)]}
                icon={createPlaceMarker(index, isActive, isCompleted)}
                zIndexOffset={isActive ? 500 : 100}
              >
                <Popup>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{place.name}</h4>
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{place.day}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {place.duration}hrs
                      </span>
                      <span>⭐ {place.rating}/5</span>
                    </div>
                    {place.timing && <p className="text-xs text-gray-500 mt-2">⏰ {place.timing}</p>}
                    {smsEnabled && !notifiedPlaces.has(place.name) && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        SMS alert within {proximityThreshold}m
                      </p>
                    )}
                    {notifiedPlaces.has(place.name) && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        SMS sent
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          <button
            onClick={() => {
              if (currentLocation && mapRef.current) {
                mapRef.current.setView([currentLocation.lat, currentLocation.lng], 16);
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50"
          >
            <Locate className="w-6 h-6 text-indigo-600" />
          </button>

          {navigationActive && currentPlaceIndex < allPlaces.length - 1 && (
            <button
              onClick={() => {
                setCurrentPlaceIndex(prev => Math.min(prev + 1, allPlaces.length - 1));
                const nextPlace = allPlaces[currentPlaceIndex + 1];
                speak(`Going to ${nextPlace.name}`);
              }}
              className="bg-indigo-600 p-3 rounded-full shadow-lg hover:bg-indigo-700 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {navigationActive && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-6 py-3 z-[1000]">
            <div className="flex items-center gap-3">
              <MapPinned className="w-5 h-5 text-indigo-600" />
              <div className="text-sm">
                <span className="font-bold text-indigo-600">{currentPlaceIndex + 1}</span>
                <span className="text-gray-600"> / {allPlaces.length}</span>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${((currentPlaceIndex + 1) / allPlaces.length) * 100}%` }}
                />
              </div>
              {smsEnabled && <Bell className="w-4 h-4 text-green-600" />}
              {voiceEnabled && isSpeaking && <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t-2 shadow-lg z-40 max-h-48 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Route className="w-4 h-4" />
            Trip Places
            {smsEnabled && (
              <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {notifiedPlaces.size} SMS sent
              </span>
            )}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allPlaces.map((place, index) => {
              const isActive = index === currentPlaceIndex && navigationActive;
              const isCompleted = index < currentPlaceIndex && navigationActive;
              const hasNotification = notifiedPlaces.has(place.name);
              
              return (
                <button
                  key={index}
                  onClick={() => { 
                    if (navigationActive) {
                      setCurrentPlaceIndex(index);
                      speak(`Going to ${place.name}`);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                    isCompleted ? 'bg-green-50 border-green-500 text-green-700' :
                    isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' :
                    'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-bold">{index + 1}</span>}
                    <span className="text-sm font-medium whitespace-nowrap">{place.name}</span>
                    {hasNotification && <Bell className="w-3 h-3 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapPage;
