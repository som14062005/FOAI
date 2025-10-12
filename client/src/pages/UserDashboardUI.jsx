import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, DollarSign, Users, Sparkles, LogOut,
  User, Brain, RefreshCw, MessageCircle, X, Navigation, Clock, Thermometer,
  ChevronDown, BookOpen, Send, Star, TrendingUp, Zap, Wind, Droplets, Eye,
  Sunrise, Sunset, Gauge, Cloud, CloudRain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import { getDistance } from 'geolib';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Tamil Nadu Districts Data
const TAMIL_NADU_DISTRICTS = [
  { name: "Ariyalur", lat: 11.1401, lng: 79.0677 },
  { name: "Chengalpattu", lat: 12.6919, lng: 79.9758 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { name: "Cuddalore", lat: 11.7480, lng: 79.7714 },
  { name: "Dharmapuri", lat: 12.1275, lng: 78.1589 },
  { name: "Dindigul", lat: 10.3673, lng: 77.9803 },
  { name: "Erode", lat: 11.3410, lng: 77.7172 },
  { name: "Kallakurichi", lat: 11.7401, lng: 78.9597 },
  { name: "Kancheepuram", lat: 12.8342, lng: 79.7036 },
  { name: "Karur", lat: 10.9571, lng: 78.0766 },
  { name: "Krishnagiri", lat: 12.5186, lng: 78.2137 },
  { name: "Madurai", lat: 9.9252, lng: 78.1198 },
  { name: "Mayiladuthurai", lat: 11.1085, lng: 79.6505 },
  { name: "Nagapattinam", lat: 10.7672, lng: 79.8449 },
  { name: "Kanyakumari", lat: 8.0883, lng: 77.5385 },
  { name: "Namakkal", lat: 11.2189, lng: 78.1677 },
  { name: "Perambalur", lat: 11.2342, lng: 78.8808 },
  { name: "Pudukottai", lat: 10.3833, lng: 78.8201 },
  { name: "Ramanathapuram", lat: 9.3639, lng: 78.8363 },
  { name: "Ranipet", lat: 12.9244, lng: 79.3377 },
  { name: "Salem", lat: 11.6643, lng: 78.1460 },
  { name: "Sivaganga", lat: 9.8438, lng: 78.4804 },
  { name: "Tenkasi", lat: 8.9606, lng: 77.3152 },
  { name: "Thanjavur", lat: 10.7870, lng: 79.1378 },
  { name: "Theni", lat: 10.0104, lng: 77.4977 },
  { name: "Thiruvallur", lat: 13.1167, lng: 79.9167 },
  { name: "Thiruvarur", lat: 10.7735, lng: 79.6370 },
  { name: "Thoothukudi", lat: 8.7642, lng: 78.1348 },
  { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 },
  { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
  { name: "Tirupathur", lat: 12.4980, lng: 78.5675 },
  { name: "Tiruppur", lat: 11.1085, lng: 77.3411 },
  { name: "Tiruvannamalai", lat: 12.2306, lng: 79.0747 },
  { name: "The Nilgiris", lat: 11.4102, lng: 76.6950 },
  { name: "Vellore", lat: 12.9165, lng: 79.1325 },
  { name: "Viluppuram", lat: 11.9401, lng: 79.4861 },
  { name: "Virudhunagar", lat: 9.5681, lng: 77.9624 }
];

// Routing Machine Component
const RoutingMachine = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false,
      lineOptions: {
        styles: [
          { 
            color: '#6366f1', 
            opacity: 0.8, 
            weight: 6 
          }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      createMarker: function() { return null; },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      }),
      formatter: new L.Routing.Formatter({
        units: 'metric',
        unitNames: {
          meters: 'meters',
          kilometers: 'km',
          yards: 'yd',
          miles: 'mi',
          hours: 'h',
          minutes: 'min',
          seconds: 's'
        }
      }),
      containerClassName: 'leaflet-routing-container-custom'
    }).addTo(map);

    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end]);

  return null;
};

// District Boundary Component
const DistrictBoundary = ({ districtName }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!districtName) return;

    const fetchDistrictBoundary = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(districtName)}+district+Tamil+Nadu+India&polygon_geojson=1&format=jsonv2`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].geojson) {
          setGeoJsonData(data[0].geojson);
        }
      } catch (error) {
        console.error('Error fetching district boundary:', error);
      }
    };

    fetchDistrictBoundary();
  }, [districtName]);

  if (!geoJsonData) return null;

  const boundaryStyle = {
    color: '#000000',
    weight: 3,
    opacity: 1,
    fillColor: '#6366f1',
    fillOpacity: 0.1
  };

  return <GeoJSON data={geoJsonData} style={boundaryStyle} />;
};

const TravelInfoDisplay = ({ userLocation, destination }) => {
  const [travelInfo, setTravelInfo] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (userLocation && destination) {
      setLoading(true);
      calculateTravelInfo();
      fetchWeather();
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [userLocation, destination]);

  const calculateTravelInfo = () => {
    const distance = getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lng },
      { latitude: destination.lat, longitude: destination.lng }
    );
    
    const distanceKm = (distance / 1000).toFixed(1);
    const estimatedHours = distance / 1000 / 50;
    const hours = Math.floor(estimatedHours);
    const minutes = Math.round((estimatedHours - hours) * 60);
    
    setTravelInfo({
      distance: `${distanceKm} km`,
      time: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    });
    setLoading(false);
  };

  const fetchWeather = async () => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!API_KEY) {
      console.warn('OpenWeather API key not found');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${destination.lat}&lon=${destination.lng}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      
      setWeather({
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        windDeg: data.wind.deg,
        clouds: data.clouds.all,
        visibility: (data.visibility / 1000).toFixed(1),
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });
    } catch (error) {
      console.error('Weather API error:', error);
    }
  };

  if (loading || !travelInfo) return null;

  return (
    <div 
      className={`mt-6 transform transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Travel Info Section */}
      <div className="p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-3xl text-white shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl animate-pulse-slow">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Travel Information</h4>
            <p className="text-sm opacity-90">Distance and route details (Road Route)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/30 
                       transform transition-all duration-500 ease-out hover:scale-105 hover:bg-white/20">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm opacity-80">Straight Distance</span>
            </div>
            <div className="text-3xl font-bold">{travelInfo.distance}</div>
            <div className="text-xs mt-1 opacity-80">Actual road distance may vary</div>
          </div>
          
          <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/30 
                       transform transition-all duration-500 ease-out hover:scale-105 hover:bg-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm opacity-80">Estimated Time</span>
            </div>
            <div className="text-3xl font-bold">{travelInfo.time}</div>
            <div className="text-xs mt-1 opacity-80">By car (avg 50 km/h)</div>
          </div>
        </div>
      </div>

      {/* Weather Section */}
      {weather && (
        <div className="p-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Weather Forecast</h4>
              <p className="text-sm opacity-90">Current conditions at destination</p>
            </div>
          </div>

          {/* Main Weather Display */}
          <div className="bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/30 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-6xl font-bold mb-2">{weather.temp}°C</div>
                <div className="text-xl capitalize mb-1">{weather.description}</div>
                <div className="text-sm opacity-90">
                  Feels like {weather.feelsLike}°C
                </div>
              </div>
              <div className="text-7xl">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                  alt={weather.description}
                  className="w-28 h-28"
                />
              </div>
            </div>
          </div>

          {/* Detailed Weather Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs opacity-80">High/Low</span>
              </div>
              <div className="text-lg font-bold">{weather.tempMax}° / {weather.tempMin}°</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4" />
                <span className="text-xs opacity-80">Humidity</span>
              </div>
              <div className="text-lg font-bold">{weather.humidity}%</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4" />
                <span className="text-xs opacity-80">Wind Speed</span>
              </div>
              <div className="text-lg font-bold">{weather.windSpeed} m/s</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-xs opacity-80">Visibility</span>
              </div>
              <div className="text-lg font-bold">{weather.visibility} km</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4" />
                <span className="text-xs opacity-80">Pressure</span>
              </div>
              <div className="text-lg font-bold">{weather.pressure} hPa</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-4 h-4" />
                <span className="text-xs opacity-80">Cloudiness</span>
              </div>
              <div className="text-lg font-bold">{weather.clouds}%</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Sunrise className="w-4 h-4" />
                <span className="text-xs opacity-80">Sunrise</span>
              </div>
              <div className="text-sm font-bold">{weather.sunrise}</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Sunset className="w-4 h-4" />
                <span className="text-xs opacity-80">Sunset</span>
              </div>
              <div className="text-sm font-bold">{weather.sunset}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserDashboardUI = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    budget: '',
    travelWith: ''
  });

  const [userLocation, setUserLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setUserLocation({ lat: 13.0827, lng: 80.2707 })
      );
    }
  }, []);

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    setUserName(username || 'Traveler');

    const profileStr = sessionStorage.getItem('userProfile');
    if (profileStr) {
      try {
        setUserProfile(JSON.parse(profileStr));
      } catch (error) {
        console.error('Error parsing profile:', error);
      }
    }
  }, []);

  const userTypes = {
    foodie: { name: 'Foodie Explorer', color: 'from-orange-400 to-orange-600', icon: '🍽️', bg: 'bg-orange-500' },
    nature: { name: 'Nature Lover', color: 'from-green-400 to-green-600', icon: '🏔️', bg: 'bg-green-500' },
    culture: { name: 'Culture Seeker', color: 'from-purple-400 to-purple-600', icon: '🏛️', bg: 'bg-purple-500' },
    adventure: { name: 'Adventure Enthusiast', color: 'from-red-400 to-red-600', icon: '🚀', bg: 'bg-red-500' },
    wellness: { name: 'Wellness Traveler', color: 'from-cyan-400 to-cyan-600', icon: '🧘‍♀️', bg: 'bg-cyan-500' },
    luxury: { name: 'Luxury Traveler', color: 'from-yellow-400 to-yellow-600', icon: '⭐', bg: 'bg-yellow-500' },
    social: { name: 'Social Explorer', color: 'from-pink-400 to-pink-600', icon: '👥', bg: 'bg-pink-500' },
    heritage: { name: 'Heritage Explorer', color: 'from-violet-400 to-violet-600', icon: '🏛️', bg: 'bg-violet-500' }
  };

  const budgetOptions = [
    { id: 'LIMITED', label: 'Limited', icon: '💰', range: '< ₹5,000', color: 'from-green-400 to-green-600' },
    { id: 'MODERATE', label: 'Moderate', icon: '💵', range: '₹5,000 - ₹15,000', color: 'from-blue-400 to-blue-600' },
    { id: 'LUXURY', label: 'Luxury', icon: '💎', range: '> ₹15,000', color: 'from-purple-400 to-purple-600' }
  ];

  const travelOptions = [
    { id: 'SOLO', label: 'Just Me', icon: '🚶‍♂️', color: 'from-teal-400 to-teal-600' },
    { id: 'COUPLE', label: 'A Couple', icon: '👫', color: 'from-pink-400 to-pink-600' },
    { id: 'FAMILY', label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'from-amber-400 to-amber-600' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'destination') {
      const selectedDistrict = TAMIL_NADU_DISTRICTS.find(d => d.name === value);
      if (selectedDistrict) {
        setDestinationLocation({ lat: selectedDistrict.lat, lng: selectedDistrict.lng });
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.destination.trim()) newErrors.destination = 'Please select a destination';
    if (!formData.days || parseInt(formData.days) < 1 || parseInt(formData.days) > 15) 
      newErrors.days = 'Days must be between 1 and 15';
    if (!formData.budget) newErrors.budget = 'Budget selection is required';
    if (!formData.travelWith) newErrors.travelWith = 'Please select travel companions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('Please log in again.');
        setIsLoading(false);
        return;
      }
      
      const selectedDistrict = TAMIL_NADU_DISTRICTS.find(d => d.name === formData.destination);
      
      const response = await fetch('http://localhost:3000/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          district: formData.destination,
          days: parseInt(formData.days),
          budget: formData.budget,
          travelWith: formData.travelWith
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message);
      
      navigate('/result', { 
        state: { 
          userId,
          tripId: result._id,
          tripNumber: result.tripNumber,
          district: formData.destination,
          days: parseInt(formData.days),
          budget: formData.budget,
          travelWith: formData.travelWith,
          userProfile,
          savedTrip: result,
          destinationCoordinates: selectedDistrict,
          userLocation
        } 
      });
    } catch (error) {
      alert(`Failed to save trip: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:3000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userProfile,
          tripContext: formData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatMessages(prev => [...prev, { type: 'ai', message: result.message }]);
        }
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        message: "I'm having trouble right now!" 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://www.tamilnadutourism.tn.gov.in/img/pages/large-desktop/thanjavur-1655294212_8d67c2fdaa46899ddda7.webp"
          alt="Tourism Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Add custom CSS for animations */}
        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .shimmer-effect {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }

          .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }

          .button-scale {
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .button-scale:active {
            transform: scale(0.96);
          }

          .smooth-transition {
            transition: all 0.3s ease-in-out;
          }

          /* Hide default routing machine container */
          .leaflet-routing-container-custom {
            display: none !important;
          }

          /* Style the routing line */
          .leaflet-routing-container {
            display: none;
          }
        `}</style>

        {/* Header */}
        <header className="glass-effect border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className={`max-w-7xl mx-auto px-4 py-4 transform transition-all duration-700 ${
            isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl 
                              flex items-center justify-center text-white font-bold text-xl shadow-lg
                              hover-lift animate-float">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Welcome, {userName}! 
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </h2>
                  <p className="text-sm text-gray-600">Plan your perfect Tamil Nadu adventure</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {userProfile && (
                  <button 
                    onClick={() => setShowAiChat(!showAiChat)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                             text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 smooth-transition 
                             hover-lift button-scale shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">AI Assistant</span>
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    sessionStorage.clear();
                    navigate('/');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl 
                           hover:bg-gray-50 smooth-transition hover-lift button-scale shadow-md border border-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* AI Chat Modal - Enhanced */}
        {showAiChat && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in-up"
              onClick={() => setShowAiChat(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[600px] flex flex-col shadow-2xl 
                            pointer-events-auto transform animate-fade-in-up border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 
                              text-white rounded-t-3xl">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Brain className="w-6 h-6" />
                    </div>
                    AI Travel Assistant
                  </h3>
                  <button 
                    onClick={() => setShowAiChat(false)} 
                    className="p-2 hover:bg-white/20 rounded-xl smooth-transition button-scale"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse-slow" />
                      <p className="text-lg font-medium">Ask me anything about Tamil Nadu!</p>
                      <p className="text-sm">I'm here to help plan your perfect trip</p>
                    </div>
                  )}
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex animate-fade-in-up ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-md smooth-transition hover-lift ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm' 
                          : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start animate-fade-in-up">
                      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
                        <div className="flex gap-1.5">
                          {[0, 100, 200].map((delay, i) => (
                            <div 
                              key={i}
                              className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t bg-white flex gap-3 rounded-b-3xl">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask about Tamil Nadu travel..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 
                             focus:border-indigo-500 smooth-transition"
                  />
                  <button 
                    onClick={sendChatMessage}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                             hover:from-indigo-700 hover:to-purple-700 smooth-transition button-scale shadow-lg 
                             flex items-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Profile Banner - Enhanced */}
          {!userProfile || !userProfile.userType ? (
            <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 
                           rounded-3xl p-8 text-white mb-8 shadow-2xl transform transition-all duration-700 ${
              isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="absolute inset-0 shimmer-effect opacity-30"></div>
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="p-6 bg-white/20 backdrop-blur-sm rounded-3xl animate-float">
                  <Brain className="w-20 h-20" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-3 flex items-center gap-3 justify-center md:justify-start">
                    Unlock Personalized Trip Planning
                    <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse-slow" />
                  </h2>
                  <p className="text-lg opacity-95 mb-8">Take our 2-minute quiz to get AI-powered recommendations</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button 
                      onClick={() => navigate('/userquiz')}
                      className="group px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-gray-50 
                               smooth-transition hover-lift button-scale shadow-2xl flex items-center justify-center gap-3"
                    >
                      <Brain className="w-5 h-5 group-hover:scale-110 smooth-transition" />
                      Discover My Travel Style
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </button>
                    
                    <button 
                      onClick={() => navigate('/recent')}
                      className="px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold 
                               hover:bg-white/30 smooth-transition border-2 border-white/40 hover-lift button-scale 
                               flex items-center justify-center gap-3"
                    >
                      <BookOpen className="w-5 h-5" />
                      View Recent Plans
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`glass-effect rounded-3xl p-6 mb-8 shadow-xl border border-gray-200 
                           transform transition-all duration-700 hover-lift ${
              isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 bg-gradient-to-br ${userTypes[userProfile.userType]?.color} 
                              rounded-3xl flex items-center justify-center text-4xl shadow-lg animate-float`}>
                  {userTypes[userProfile.userType]?.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {userTypes[userProfile.userType]?.name}
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  </h3>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    Your personalized travel personality
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trip Planning Form - Enhanced */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <div className="glass-effect rounded-3xl p-8 shadow-xl border border-gray-200 hover-lift smooth-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Where do you want to go?</h2>
              </div>
              
              <div className="relative">
                <select
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 
                           focus:border-indigo-500 appearance-none text-lg font-medium smooth-transition 
                           hover:border-gray-300 bg-white"
                >
                  <option value="">🏛️ Select a Tamil Nadu District</option>
                  {TAMIL_NADU_DISTRICTS.map((district, index) => (
                    <option key={index} value={district.name}>{district.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.destination && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-2 animate-fade-in-up">
                  <X className="w-4 h-4" />
                  {errors.destination}
                </p>
              )}
              
              {destinationLocation && userLocation && (
                <div className="mt-6 animate-fade-in-up">
                  <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 hover-lift">
                    <MapContainer
                      center={[
                        (userLocation.lat + destinationLocation.lat) / 2,
                        (userLocation.lng + destinationLocation.lng) / 2
                      ]}
                      zoom={8}
                      style={{ height: '500px', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      
                      {/* District Boundary */}
                      <DistrictBoundary districtName={formData.destination} />
                      
                      {/* User Location Marker */}
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-blue-600">📍 Your Location</p>
                            <p className="text-xs text-gray-600">Starting point</p>
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Destination Marker */}
                      <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-purple-600">🎯 {formData.destination}</p>
                            <p className="text-xs text-gray-600">Your destination</p>
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Road Routing */}
                      <RoutingMachine start={userLocation} end={destinationLocation} />
                    </MapContainer>
                  </div>
                  
                  <TravelInfoDisplay userLocation={userLocation} destination={destinationLocation} />
                </div>
              )}
            </div>

            {/* Days */}
            <div className="glass-effect rounded-3xl p-8 shadow-xl border border-gray-200 hover-lift smooth-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">How many days?</h2>
              </div>
              <input
                type="number"
                min="1"
                max="15"
                placeholder="Enter number of days (1-15)"
                value={formData.days}
                onChange={(e) => handleInputChange('days', e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 
                         focus:border-indigo-500 text-lg font-medium smooth-transition hover:border-gray-300 bg-white"
              />
              {errors.days && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-2 animate-fade-in-up">
                  <X className="w-4 h-4" />
                  {errors.days}
                </p>
              )}
            </div>

            {/* Budget */}
            <div className="glass-effect rounded-3xl p-8 shadow-xl border border-gray-200 hover-lift smooth-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-2xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">What's your budget?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetOptions.map((option, idx) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleInputChange('budget', option.id)}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className={`p-6 rounded-2xl border-2 smooth-transition button-scale animate-fade-in-up
                              ${formData.budget === option.id 
                                ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105' 
                                : 'border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white'
                              }`}
                  >
                    <div className="text-5xl mb-3">{option.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{option.label}</h3>
                    <p className="text-sm text-gray-600 font-medium">{option.range}</p>
                  </button>
                ))}
              </div>
              {errors.budget && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-2 animate-fade-in-up">
                  <X className="w-4 h-4" />
                  {errors.budget}
                </p>
              )}
            </div>

            {/* Travel With */}
            <div className="glass-effect rounded-3xl p-8 shadow-xl border border-gray-200 hover-lift smooth-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Who's traveling?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {travelOptions.map((option, idx) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleInputChange('travelWith', option.id)}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className={`p-6 rounded-2xl border-2 smooth-transition button-scale animate-fade-in-up
                              ${formData.travelWith === option.id 
                                ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105' 
                                : 'border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white'
                              }`}
                  >
                    <div className="text-5xl mb-3">{option.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900">{option.label}</h3>
                  </button>
                ))}
              </div>
              {errors.travelWith && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-2 animate-fade-in-up">
                  <X className="w-4 h-4" />
                  {errors.travelWith}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                       text-white rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-pink-700 smooth-transition 
                       hover-lift button-scale disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 
                       flex items-center justify-center gap-3 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 shimmer-effect"></div>
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Your Trip...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 smooth-transition" />
                  Plan My Tamil Nadu Trip
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 smooth-transition"></span>
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default UserDashboardUI;
