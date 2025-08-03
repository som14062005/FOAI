import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, DollarSign, Users, Sparkles, LogOut,
  User, Brain, RefreshCw, MessageCircle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserDashboardUI.css';

const UserDashboardUI = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState(''); // ✅ Add this state
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    budget: '',
    travelWith: ''
  });
  

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // AI-related states
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserEmail(user.email || '');
      setUserName(user.name || ''); // ✅ Set userName from sessionStorage
    }

    const profile = sessionStorage.getItem('userProfile');
    if (profile) {
      const parsedProfile = JSON.parse(profile);
      setUserProfile(parsedProfile);
      setChatMessages([{
        type: 'ai',
        message: `Hello! I'm your AI travel assistant. As a ${parsedProfile.userType} traveler, I can help you plan the perfect trip. What would you like to know?`
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
    {
      id: 'cheap',
      label: 'Cheap',
      description: 'Stay conscious of costs',
      icon: '💰',
      range: '< ₹5,000'
    },
    {
      id: 'moderate',
      label: 'Moderate',
      description: 'Keep cost on the average side',
      icon: '💵',
      range: '₹5,000 - ₹15,000'
    },
    {
      id: 'luxury',
      label: 'Luxury',
      description: "Don't worry about cost",
      icon: '💎',
      range: '> ₹15,000'
    }
  ];

  const travelOptions = [
    {
      id: 'solo',
      label: 'Just Me',
      description: 'Solo adventure',
      icon: '🚶‍♂️'
    },
    {
      id: 'couple',
      label: 'A Couple',
      description: 'Two travelers in tandem',
      icon: '👫'
    },
    {
      id: 'family',
      label: 'Family',
      description: 'A group of fun loving souls',
      icon: '👨‍👩‍👧‍👦'
    }
  ];
    

  // AI Functions
  const getAISuggestions = async (destination) => {
    if (destination.length > 3 && userProfile) {
      try {
        const response = await fetch('http://localhost:3000/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Give me 3 quick travel tips for ${destination}`,
            userProfile: userProfile,
            tripContext: formData
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Parse suggestions from AI response
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
      alert('Please complete your profile and enter a destination first');
      return;
    }

    setAiOptimizing(true);
    
    try {
      const response = await fetch('http://localhost:3000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Optimize my trip plan: ${formData.days} days in ${formData.destination} with ${formData.budget} budget, traveling ${formData.travelWith}. Give me specific suggestions for budget allocation and must-visit places.`,
          userProfile: userProfile,
          tripContext: formData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show AI optimization results
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
      newErrors.destination = 'Destination is required';
    } else if (formData.destination.length < 2) {
      newErrors.destination = 'Destination must be at least 2 characters';
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Get AI suggestions for destination
    if (field === 'destination') {
      getAISuggestions(value);
    }
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Enhanced AI trip planning
      let enhancedTripData = { ...formData, userProfile: userProfile };
      
      if (userProfile) {
        // Call AI service to enhance trip planning
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

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to trip results page with AI-enhanced data
      navigate('/trip-results', { state: enhancedTripData });
      
    } catch (error) {
      console.error('Error with AI trip planning:', error);
      // Fallback to regular trip planning
      navigate('/trip-results', { state: { ...formData, userProfile: userProfile } });
    } finally {
      setIsLoading(false);
    }
  };

    const handleRetakeQuiz = () => {
    navigate('/userquiz');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userProfile');
    navigate('/');
  };

  return (
    <div className="trip-planner-container">
      {/* Enhanced Header with better layout */}
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
          {/* User Profile Display with better styling */}
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
          {/* AI Chat Toggle */}
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
              placeholder="Ask about travel recommendations..."
              className="chat-input"
            />
            <button onClick={sendChatMessage} className="send-btn">Send</button>
          </div>
        </div>
      )}

      {/* Conditional Content Based on Profile Status */}
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

      {/* Main Header */}
      <div className="trip-planner-header">
        <div className="header-content">
          <h1>Plan Your Perfect Adventure</h1>
          <p>Tell us your preferences and we'll create an amazing itinerary for you</p>
        </div>
      </div>

      <form className="trip-planner-form" onSubmit={handleSubmit}>
        {/* Destination Section with AI Suggestions */}
        <div className="form-section">
          <div className="section-header">
            <MapPin className="section-icon" />
            <h2>What is destination of choice?</h2>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter destination (e.g., Las Vegas, NV, USA)"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className={`destination-input ${errors.destination ? 'error' : ''}`}
            />
            {errors.destination && (
              <span className="error-message">{errors.destination}</span>
            )}
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                <h4>🤖 AI Quick Tips:</h4>
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
            <p className="optimize-hint">Get AI-powered recommendations for your trip</p>
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
                {userProfile ? 'Plan My AI Trip' : 'Plan My Trip'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserDashboardUI;
