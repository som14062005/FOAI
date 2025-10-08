import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, DollarSign, Users, Sparkles, LogOut,
  User, Brain, RefreshCw, MessageCircle, X, Navigation, Clock, Thermometer,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getDistance } from 'geolib';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './UserDashboardUI.css';

// ✅ Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ✅ Tamil Nadu Districts Data
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

// ✅ Enhanced Travel Info Component with Tailwind CSS (NO COST OR SMART TIPS)
const TravelInfoDisplay = ({ userLocation, destination, formData }) => {
  const [travelInfo, setTravelInfo] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLocation && destination) {
      setLoading(true);
      calculateTravelInfo();
      fetchWeather();
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
      distanceValue: distance
    });
    setLoading(false);
  };

  // ⭐ WEATHER API FUNCTION
  const fetchWeather = async () => {
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!API_KEY) {
      console.log('Weather API key not found in .env file');
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${destination.lat}&lon=${destination.lng}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity
      });
    } catch (error) {
      console.error('Weather API error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-10 mt-5 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl text-slate-600">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="font-medium">Loading travel information...</span>
      </div>
    );
  }

  if (!travelInfo) return null;

  return (
    <div className="relative mt-5 p-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-2xl text-white overflow-hidden shadow-xl shadow-indigo-500/30 animate-fadeIn">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <Navigation size={20} className="text-white" />
        </div>
        <div>
          <h4 className="text-xl font-semibold text-white">Travel Information</h4>
          <p className="text-sm text-white/80 mt-1">Distance and weather details for your journey</p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Distance Card */}
        <div className="group relative p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg border border-emerald-300/30">
              <span className="text-lg">📏</span>
            </div>
            <div className="flex-1">
              <span className="block text-xs font-medium text-white/70 uppercase tracking-wider">Distance</span>
              <span className="block text-lg font-bold text-white">{travelInfo.distance}</span>
            </div>
          </div>
        </div>

        {/* Time Card */}
        <div className="group relative p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg border border-blue-300/30">
              <Clock size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <span className="block text-xs font-medium text-white/70 uppercase tracking-wider">Estimated Travel Time</span>
              <span className="block text-lg font-bold text-white">{travelInfo.time}</span>
            </div>
          </div>
        </div>

        {/* Weather Card */}
        {weather && (
          <div className="group relative p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg border border-amber-300/30">
                <Thermometer size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-medium text-white/70 uppercase tracking-wider">Weather</span>
                <span className="block text-lg font-bold text-white">{weather.temp}°C</span>
                <span className="block text-xs text-white/60 capitalize mt-0.5">{weather.description}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Weather Details */}
      {weather && (
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">🌡️</span>
            <span className="text-sm font-medium text-white/90">Feels like {weather.feelsLike}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💧</span>
            <span className="text-sm font-medium text-white/90">{weather.humidity}% humidity</span>
          </div>
        </div>
      )}
    </div>
  );
};

const UserDashboardUI = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    budget: '',
    travelWith: ''
  });

  // ✅ NEW MAP STATES - Simplified for dropdown
  const [userLocation, setUserLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  // All existing states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  // ✅ Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Fallback to Chennai
          setUserLocation({ lat: 13.0827, lng: 80.2707 });
        }
      );
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserEmail(user.email || '');
      setUserName(user.name || '');
    }

    const profile = sessionStorage.getItem('userProfile');
    if (profile) {
      const parsedProfile = JSON.parse(profile);
      setUserProfile(parsedProfile);
      setChatMessages([{
        type: 'ai',
        message: `Hello! I'm your AI travel assistant. As a ${parsedProfile.userType} traveler, I can help you plan the perfect trip in Tamil Nadu. What would you like to know?`
      }]);
    }
  }, []);

  const userTypes = {
    foodie: { name: 'Foodie Explorer', color: '#f97316', icon: '🍽️' },
    nature: { name: 'Nature Lover', color: '#22c55e', icon: '🏔️' },
    culture: { name: 'Culture Seeker', color: '#8b5cf6', icon: '🏛️' },
    adventure: { name: 'Adventure Enthusiast', color: '#ef4444', icon: '🚀' },
    wellness: { name: 'Wellness Traveler', color: '#06b6d4', icon: '🧘‍♀️' },
    luxury: { name: 'Luxury Traveler', color: '#eab308', icon: '⭐' },
    social: { name: 'Social Explorer', color: '#ec4899', icon: '👥' },
    heritage: { name: 'Heritage Explorer', color: '#a855f7', icon: '🏛️' }
  };

  const budgetOptions = [
    { id: 'Limited', label: 'Limited', description: 'Stay conscious of costs', icon: '💰', range: '< ₹5,000' },
    { id: 'moderate', label: 'Moderate', description: 'Keep cost on the average side', icon: '💵', range: '₹5,000 - ₹15,000' },
    { id: 'luxury', label: 'Luxury', description: "Don't worry about cost", icon: '💎', range: '> ₹15,000' }
  ];

  const travelOptions = [
    { id: 'solo', label: 'Just Me', description: 'Solo adventure', icon: '🚶‍♂️' },
    { id: 'couple', label: 'A Couple', description: 'Two travelers in tandem', icon: '👫' },
    { id: 'family', label: 'Family', description: 'A group of fun loving souls', icon: '👨‍👩‍👧‍👦' }
  ];

  // ✅ Get AI Suggestions for selected district
  const getAISuggestions = async (destination) => {
    if (destination && userProfile) {
      try {
        const response = await fetch('http://localhost:3000/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Give me 3 quick travel tips for ${destination}, Tamil Nadu`,
            userProfile: userProfile,
            tripContext: formData
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const suggestions = result.message.split('\n').filter(line => line.trim()).slice(0, 3);
            setAiSuggestions(suggestions);
          }
        }
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
      }
    } else {
      setAiSuggestions([]);
    }
  };

  const optimizeWithAI = async () => {
    if (!userProfile || !formData.destination) {
      alert('Please complete your profile and select a destination first');
      return;
    }

    setAiOptimizing(true);
    
    try {
      const response = await fetch('http://localhost:3000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Optimize my trip plan: ${formData.days} days in ${formData.destination}, Tamil Nadu with ${formData.budget} budget, traveling ${formData.travelWith}. Give me specific suggestions for budget allocation and must-visit places.`,
          userProfile: userProfile,
          tripContext: formData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChatMessages(prev => [...prev, 
            { type: 'user', message: 'Optimize my trip plan' },
            { type: 'ai', message: result.message }
          ]);
          setShowAiChat(true);
        }
      }
    } catch (error) {
      console.error('Error optimizing with AI:', error);
      alert('AI optimization temporarily unavailable. Please try again.');
    } finally {
      setAiOptimizing(false);
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
          userProfile: userProfile,
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
      console.error('Error sending chat message:', error);
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        message: "I'm having trouble right now. Please try asking your question again!" 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.destination.trim()) {
      newErrors.destination = 'Please select a destination district';
    }
    if (!formData.days) {
      newErrors.days = 'Number of days is required';
    } else if (parseInt(formData.days) < 1 || parseInt(formData.days) > 30) {
      newErrors.days = 'Days must be between 1 and 30';
    }
    if (!formData.budget) {
      newErrors.budget = 'Budget selection is required';
    }
    if (!formData.travelWith) {
      newErrors.travelWith = 'Please select who you\'re traveling with';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // ✅ Handle district selection
    if (field === 'destination') {
      const selectedDistrict = TAMIL_NADU_DISTRICTS.find(district => district.name === value);
      if (selectedDistrict) {
        setDestinationLocation({ 
          lat: selectedDistrict.lat, 
          lng: selectedDistrict.lng 
        });
        getAISuggestions(value);
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    
    try {
      let enhancedTripData = { ...formData, userProfile: userProfile };
      
      if (userProfile) {
        const aiResponse = await fetch('http://localhost:3000/ai/generate-trip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enhancedTripData)
        });
        
        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          if (aiResult.success) {
            enhancedTripData.aiGeneratedItinerary = aiResult.data;
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/trip-results', { state: enhancedTripData });
      
    } catch (error) {
      console.error('Error with AI trip planning:', error);
      navigate('/trip-results', { state: { ...formData, userProfile: userProfile } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeQuiz = () => { navigate('/userquiz'); };
  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userProfile');
    navigate('/');
  };

  return (
    <div className="trip-planner-container">
      {/* Header */}
      <div className="enhanced-user-header">
        <div className="header-left">
          <div className="user-welcome">
            <div className="user-avatar">
              <User className="avatar-icon" />
            </div>
            <div className="welcome-text">
              <h2>Welcome back, {userName}!</h2>
            </div>
          </div>
        </div>

        <div className="header-center">
          {userProfile && userProfile.userType ? (
            <div className="user-profile-display">
              <div className="profile-badge">
                <div 
                  className="profile-icon"
                  style={{ backgroundColor: userTypes[userProfile.userType]?.color || '#667eea' }}
                >
                  <span className="profile-emoji">{userTypes[userProfile.userType]?.icon}</span>
                </div>
                <div className="profile-details">
                  <h3>{userTypes[userProfile.userType]?.name}</h3>
                  <p>Your travel personality</p>
                </div>
              </div>
              <button className="refresh-profile-btn" onClick={handleRetakeQuiz}>
                <RefreshCw className="refresh-icon" />
                Update Profile
              </button>
            </div>
          ) : (
            <div className="no-profile-display">
              <div className="no-profile-content">
                <Brain className="brain-icon" />
                <div className="no-profile-text">
                  <h3>Complete Your Profile</h3>
                  <p>Take our quiz for personalized recommendations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-right">
          {userProfile && (
            <button 
              onClick={() => setShowAiChat(!showAiChat)} 
              className="ai-chat-toggle"
              title="AI Travel Assistant"
            >
              <MessageCircle className="chat-icon" />
              AI Assistant
            </button>
          )}
          
          <button onClick={handleLogout} className="enhanced-logout-btn">
            <LogOut className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAiChat && (
        <div className="ai-chat-modal">
          <div className="chat-header">
            <h3>🤖 AI Travel Assistant</h3>
            <button onClick={() => setShowAiChat(false)} className="chat-close">
              <X className="close-icon" />
            </button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
            {isChatLoading && (
              <div className="message ai">
                <div className="message-content typing">AI is typing...</div>
              </div>
            )}
          </div>
          
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Ask about Tamil Nadu travel recommendations..."
              className="chat-input"
            />
            <button onClick={sendChatMessage} className="send-btn">Send</button>
          </div>
        </div>
      )}

      {/* Conditional Content - Same as before */}
      {!userProfile || !userProfile.userType ? (
        <div className="quiz-call-to-action">
          <div className="cta-content">
            <div className="cta-visual">
              <div className="floating-icons">
                <span className="float-icon">🗺️</span>
                <span className="float-icon">✈️</span>
                <span className="float-icon">🏖️</span>
                <span className="float-icon">🏔️</span>
              </div>
              <Brain className="main-brain-icon" />
            </div>
            <div className="cta-text">
              <h2>Unlock Personalized Trip Planning</h2>
              <p>Our AI will analyze your preferences to create perfect itineraries tailored just for you. It takes less than 2 minutes!</p>
              <div className="cta-features">
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span>Personalized Recommendations</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Smart Trip Planning</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌟</span>
                  <span>Curated Experiences</span>
                </div>
              </div>
              <button className="enhanced-quiz-btn" onClick={handleRetakeQuiz}>
                <Brain className="btn-brain-icon" />
                Discover My Travel Style
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="personalized-banner">
          <div className="banner-content">
            <div className="banner-left">
              <div className="personality-showcase">
                <div 
                  className="showcase-icon"
                  style={{ backgroundColor: userTypes[userProfile.userType]?.color }}
                >
                  <span>{userTypes[userProfile.userType]?.icon}</span>
                </div>
                <div className="showcase-text">
                  <h3>Perfect for a {userTypes[userProfile.userType]?.name}!</h3>
                  <p>Your trips are customized based on your unique travel personality</p>
                </div>
              </div>
            </div>
            <div className="banner-right">
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-number">AI</span>
                  <span className="stat-label">Powered</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Personalized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="trip-planner-header">
        <div className="header-content">
          <h1>Plan Your Perfect Tamil Nadu Adventure</h1>
          <p>Select your destination district and we'll create an amazing itinerary for you</p>
        </div>
      </div>

      <form className="trip-planner-form" onSubmit={handleSubmit}>
        {/* ✅ MODIFIED Destination Section with Dropdown */}
        <div className="form-section">
          <div className="section-header">
            <MapPin className="section-icon" />
            <h2>Which Tamil Nadu district would you like to explore?</h2>
          </div>
          <div className="input-group">
            {/* ✅ Custom Dropdown with Tailwind Styling */}
            <div className="relative">
              <select
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                className={`w-full px-4 py-4 text-lg bg-white border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer ${
                  errors.destination ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">🏛️ Select a Tamil Nadu District</option>
                {TAMIL_NADU_DISTRICTS.map((district, index) => (
                  <option key={index} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              
              {/* Custom Dropdown Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <ChevronDown size={20} className="text-gray-400" />
              </div>
            </div>
            
            {errors.destination && (
              <span className="error-message">{errors.destination}</span>
            )}
            
            {/* ✅ Map Section */}
            {destinationLocation && (
              <div className="mt-5">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <MapContainer
                    center={destinationLocation ? [destinationLocation.lat, destinationLocation.lng] : [11.1271, 78.6569]}
                    zoom={destinationLocation ? 10 : 7}
                    style={{ height: '300px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {userLocation && (
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>📱 Your Current Location</Popup>
                      </Marker>
                    )}
                    
                    {destinationLocation && (
                      <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
                        <Popup>🎯 {formData.destination}, Tamil Nadu</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                
                {/* ✅ Travel Information */}
                {userLocation && (
                  <TravelInfoDisplay
                    userLocation={userLocation}
                    destination={destinationLocation}
                    formData={formData}
                  />
                )}
              </div>
            )}
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                <h4>🤖 AI Quick Tips for {formData.destination}:</h4>
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <span className="suggestion-icon">💡</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rest of the form remains the same */}
        {/* Days Section */}
        <div className="form-section">
          <div className="section-header">
            <Calendar className="section-icon" />
            <h2>How many days are you planning your trip?</h2>
          </div>
          <div className="input-group">
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Enter number of days"
              value={formData.days}
              onChange={(e) => handleInputChange('days', e.target.value)}
              className={`days-input ${errors.days ? 'error' : ''}`}
            />
            {errors.days && (
              <span className="error-message">{errors.days}</span>
            )}
          </div>
        </div>

        {/* Budget Section */}
        <div className="form-section">
          <div className="section-header">
            <DollarSign className="section-icon" />
            <h2>What is Your Budget?</h2>
          </div>
          <div className="budget-options">
            {budgetOptions.map((option) => (
              <div
                key={option.id}
                className={`budget-card ${formData.budget === option.id ? 'selected' : ''}`}
                onClick={() => handleInputChange('budget', option.id)}
              >
                <div className="budget-icon">{option.icon}</div>
                <h3>{option.label}</h3>
                <p className="budget-description">{option.description}</p>
                <span className="budget-range">{option.range}</span>
              </div>
            ))}
          </div>
          {errors.budget && (
            <span className="error-message">{errors.budget}</span>
          )}
        </div>

        {/* Travel Companion Section */}
        <div className="form-section">
          <div className="section-header">
            <Users className="section-icon" />
            <h2>Who do you plan on traveling with on your next adventure?</h2>
          </div>
          <div className="travel-options">
            {travelOptions.map((option) => (
              <div
                key={option.id}
                className={`travel-card ${formData.travelWith === option.id ? 'selected' : ''}`}
                onClick={() => handleInputChange('travelWith', option.id)}
              >
                <div className="travel-icon">{option.icon}</div>
                <h3>{option.label}</h3>
                <p className="travel-description">{option.description}</p>
              </div>
            ))}
          </div>
          {errors.travelWith && (
            <span className="error-message">{errors.travelWith}</span>
          )}
        </div>

        {/* AI Optimization Section */}
        {userProfile && formData.destination && (
          <div className="ai-optimize-section">
            <button 
              type="button" 
              onClick={optimizeWithAI}
              className={`ai-optimize-btn ${aiOptimizing ? 'optimizing' : ''}`}
              disabled={aiOptimizing}
            >
              {aiOptimizing ? (
                <>
                  <div className="ai-spinner"></div>
                  AI Optimizing...
                </>
              ) : (
                <>
                  <Brain className="ai-icon" />
                  🚀 Optimize with AI
                </>
              )}
            </button>
            <p className="optimize-hint">Get AI-powered recommendations for your Tamil Nadu trip</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                {userProfile ? 'Creating AI-Enhanced Trip...' : 'Creating Your Trip...'}
              </>
            ) : (
              <>
                <Sparkles className="btn-icon" />
                {userProfile ? 'Plan My Tamil Nadu Trip' : 'Plan My Trip'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserDashboardUI;
