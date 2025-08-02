import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign, Users, Sparkles, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserDashboardUI.css';

const UserDashboardUI = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    budget: '',
    travelWith: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user info from session storage
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
  }, []);

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

  const validateForm = () => {
    const newErrors = {};

    // Destination validation
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (formData.destination.length < 2) {
      newErrors.destination = 'Destination must be at least 2 characters';
    }

    // Days validation
    if (!formData.days) {
      newErrors.days = 'Number of days is required';
    } else if (parseInt(formData.days) < 1 || parseInt(formData.days) > 30) {
      newErrors.days = 'Days must be between 1 and 30';
    }

    // Budget validation
    if (!formData.budget) {
      newErrors.budget = 'Budget selection is required';
    }

    // Travel companion validation
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
    
    // Clear error for this field when user starts typing
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
      // Simulate API call for trip planning
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Trip planning data:', formData);
      
      // For demo purposes, show success message
      alert(`Trip planned successfully for ${formData.destination}! 
      Duration: ${formData.days} days
      Budget: ${formData.budget}
      Travel with: ${formData.travelWith}`);
      
      // Reset form after successful submission
      setFormData({
        destination: '',
        days: '',
        budget: '',
        travelWith: ''
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error planning trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userEmail');
    
    // Navigate back to login
    navigate('/');
  };

  return (
    <div className="trip-planner-container">
      {/* Header with user info and logout */}
      <div className="user-header">
        <div className="user-info">
          <User className="user-icon" />
          <span className="user-email">Welcome, {userEmail}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut className="logout-icon" />
          Logout
        </button>
      </div>

      <div className="trip-planner-header">
        <div className="header-content">
          <Sparkles className="header-icon" />
          <h1>Plan Your Perfect Adventure</h1>
          <p>Tell us your preferences and we'll create an amazing itinerary for you</p>
        </div>
      </div>

      <form className="trip-planner-form" onSubmit={handleSubmit}>
        {/* Destination Section */}
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
                Creating Your Trip...
              </>
            ) : (
              <>
                <Sparkles className="btn-icon" />
                Plan My Trip
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserDashboardUI;
