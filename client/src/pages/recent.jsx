import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin, Calendar, DollarSign, Users, Clock, Heart, Trash2, 
  Eye, ArrowLeft, Search, RefreshCw, Loader, Tag,
  TrendingUp, Sparkles, BookOpen, Archive, Star, Package, 
  BarChart3, Grid, List, Navigation
} from 'lucide-react';
import TripQRCode from '../components/TripQRCode';

const MyTripsPage = () => {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem('userId');

  const [savedTrips, setSavedTrips] = useState([]);
  const [basicTrips, setBasicTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '',
    district: '',
    budget: '',
    sortBy: 'createdAt',
    order: 'desc'
  });

  const [stats, setStats] = useState({
    totalTrips: 0,
    totalSaved: 0,
    totalPlanned: 0,
    totalDays: 0,
    totalPlaces: 0,
    mostVisited: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setProfileLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:3000/classifier/profile/${userId}`
        );
        
        setUserProfile({
          userType: response.data.travelerType,
          confidence: response.data.confidence,
          description: response.data.description,
          userId: response.data.userId
        });
        
        console.log('👤 User profile loaded from API:', response.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        const profileStr = sessionStorage.getItem('userProfile');
        if (profileStr) {
          try {
            const parsedProfile = JSON.parse(profileStr);
            setUserProfile(parsedProfile);
            console.log('👤 Using cached profile from sessionStorage');
          } catch (error) {
            console.error('Error parsing cached profile:', error);
          }
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAllTrips();
    } else {
      navigate('/login');
    }
  }, [userId]);

  const fetchAllTrips = async () => {
    setLoading(true);
    setError(null);

    try {
      const savedResponse = await axios.get(
        `http://localhost:3000/api/saved-trips/user/${userId}`
      );

      const tripsResponse = await axios.get('http://localhost:3000/trips');

      if (savedResponse.data.success) {
        setSavedTrips(savedResponse.data.data.trips);
      }

      const userBasicTrips = tripsResponse.data.filter(
        trip => trip.userId === userId
      );
      setBasicTrips(userBasicTrips);

      calculateStats(savedResponse.data.data.trips, userBasicTrips);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (saved, basic) => {
    const totalSaved = saved.length;
    const totalPlanned = basic.length;
    const totalTrips = totalSaved + totalPlanned;

    const totalDays = [
      ...saved.map(t => t.tripData.days),
      ...basic.map(t => t.days)
    ].reduce((sum, days) => sum + days, 0);

    const totalPlaces = saved.reduce(
      (sum, t) => sum + (t.tripData.stats?.totalPlaces || 0),
      0
    );

    const districts = [
      ...saved.map(t => t.tripData.district),
      ...basic.map(t => t.district)
    ];
    const districtCount = districts.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const mostVisited = Object.keys(districtCount).length > 0
      ? Object.entries(districtCount).sort((a, b) => b[1] - a[1])[0][0]
      : 'None';

    setStats({
      totalTrips,
      totalSaved,
      totalPlanned,
      totalDays,
      totalPlaces,
      mostVisited
    });
  };

  const handleDeleteSavedTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this saved trip?')) return;

    try {
      await axios.delete(`http://localhost:3000/api/saved-trips/${tripId}`);
      fetchAllTrips();
    } catch (err) {
      alert('Failed to delete trip');
    }
  };

  const handleToggleFavorite = async (tripId, currentFavorite) => {
    try {
      await axios.patch(`http://localhost:3000/api/saved-trips/${tripId}`, {
        favorite: !currentFavorite
      });
      fetchAllTrips();
    } catch (err) {
      alert('Failed to update favorite status');
    }
  };

  const handleViewTrip = (tripId) => {
    navigate(`/trip-details/${tripId}`);
  };

  const handleGenerateItinerary = async (trip) => {
    if (!userProfile || !userProfile.userType) {
      alert('Please complete your traveler profile first before generating an itinerary.');
      navigate('/userquiz');
      return;
    }

    const tripInputData = {
      userId: userId,
      district: trip.district,
      days: trip.days,
      budget: trip.budget,
      travelWith: trip.travelWith,
      travelerType: trip.travelerType || userProfile.userType
    };

    navigate('/result', { 
      state: { 
        tripInputData: tripInputData,
        fromPlannedTrip: true,
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        userProfile: userProfile
      } 
    });
  };

  const getBudgetColor = (budget) => {
    switch (budget) {
      case 'LIMITED': return 'bg-green-100 text-green-700 border-green-300';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LUXURY': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getBudgetIcon = (budget) => {
    switch (budget) {
      case 'LIMITED': return '💰';
      case 'MODERATE': return '💵';
      case 'LUXURY': return '💎';
      default: return '💳';
    }
  };

  const getTravelIcon = (travelWith) => {
    switch (travelWith) {
      case 'SOLO': return '🚶‍♂️';
      case 'COUPLE': return '👫';
      case 'FAMILY': return '👨‍👩‍👧‍👦';
      default: return '✈️';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredTrips = () => {
    let allTrips = [];

    if (activeTab === 'all' || activeTab === 'saved') {
      allTrips = [...allTrips, ...savedTrips.map(t => ({ ...t, type: 'saved' }))];
    }
    
    if (activeTab === 'all' || activeTab === 'planned') {
      allTrips = [...allTrips, ...basicTrips.map(t => ({ ...t, type: 'planned' }))];
    }

    if (filters.search) {
      allTrips = allTrips.filter(trip => {
        const district = trip.tripData?.district || trip.district;
        return district?.toLowerCase().includes(filters.search.toLowerCase());
      });
    }

    if (filters.budget) {
      allTrips = allTrips.filter(trip => {
        const budget = trip.tripData?.budget || trip.budget;
        return budget === filters.budget;
      });
    }

    allTrips.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return filters.order === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return allTrips;
  };

  const filteredTrips = getFilteredTrips();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-semibold">
            {profileLoading ? 'Loading your profile...' : 'Loading your amazing trips...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Gathering all your adventures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-xl sticky top-0 z-50 border-b-4 border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/user-dashboard')}
                className="p-3 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-8 h-8 text-indigo-600" />
                  My Trip Collection
                </h1>
                <p className="text-gray-600 mt-1">
                  {stats.totalTrips} total trip{stats.totalTrips !== 1 ? 's' : ''} • {stats.totalDays} days planned
                  {userProfile && userProfile.userType && (
                    <span className="ml-2 text-indigo-600 font-semibold">
                      • 🍽️ {userProfile.userType} Traveler
                      <span className="text-xs text-gray-500 ml-1">
                        ({(userProfile.confidence * 100).toFixed(0)}% confidence)
                      </span>
                    </span>
                  )}
                </p>
                {userProfile && userProfile.description && (
                  <p className="text-sm text-gray-500 italic mt-1">
                    "{userProfile.description}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllTrips}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/user-dashboard')}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Plan New Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Archive className="w-6 h-6" />
              </div>
              <BarChart3 className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-blue-100 text-sm font-semibold mb-1">Total Trips</p>
            <p className="text-4xl font-bold">{stats.totalTrips}</p>
            <p className="text-blue-100 text-xs mt-2">
              {stats.totalSaved} saved, {stats.totalPlanned} planned
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <TrendingUp className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-green-100 text-sm font-semibold mb-1">Total Days</p>
            <p className="text-4xl font-bold">{stats.totalDays}</p>
            <p className="text-green-100 text-xs mt-2">Days of adventure planned</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <Star className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-purple-100 text-sm font-semibold mb-1">Places to Visit</p>
            <p className="text-4xl font-bold">{stats.totalPlaces}</p>
            <p className="text-purple-100 text-xs mt-2">Destinations curated</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <Heart className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-pink-100 text-sm font-semibold mb-1">Favorite Destination</p>
            <p className="text-2xl font-bold truncate">{stats.mostVisited}</p>
            <p className="text-pink-100 text-xs mt-2">Most visited district</p>
          </div>
        </div>

        {/* Profile Banner */}
        {userProfile && userProfile.userType && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  🍽️
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{userProfile.userType} Traveler</h3>
                  <p className="text-indigo-100 text-sm">{userProfile.description}</p>
                  <p className="text-indigo-200 text-xs mt-2">
                    AI Confidence: {(userProfile.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/userquiz')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors"
              >
                Update Profile
              </button>
            </div>
          </div>
        )}

        {/* Tabs & Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  All Trips ({stats.totalTrips})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'saved'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Saved ({stats.totalSaved})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('planned')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'planned'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Planned ({stats.totalPlanned})
                </span>
              </button>
            </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search District
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="e.g., Chennai, Madurai..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget Filter
              </label>
              <select
                value={filters.budget}
                onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Budgets</option>
                <option value="LIMITED">💰 Limited</option>
                <option value="MODERATE">💵 Moderate</option>
                <option value="LUXURY">💎 Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.order}
                onChange={(e) => setFilters({ ...filters, order: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {!loading && filteredTrips.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border-2 border-gray-100">
            <div className="bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No Trips Found</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Start planning your perfect Tamil Nadu adventure and create unforgettable memories!
            </p>
            <button
              onClick={() => navigate('/user-dashboard')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Plan Your First Trip
            </button>
          </div>
        )}

        {/* Trips Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const isSaved = trip.type === 'saved';
              const district = trip.tripData?.district || trip.district;
              const days = trip.tripData?.days || trip.days;
              const budget = trip.tripData?.budget || trip.budget;
              const travelWith = trip.tripData?.travelWith || trip.travelWith;
              const travelerType = trip.tripData?.travelerType || trip.travelerType;

              return (
                <div
                  key={trip._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`p-6 text-white relative overflow-hidden ${
                    isSaved
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  }`}>
                    <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isSaved ? 'bg-green-400/30' : 'bg-blue-400/30'
                            }`}>
                              {isSaved ? '✓ SAVED' : '📝 PLANNED'}
                            </span>
                            {trip.tripNumber && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20">
                                #{trip.tripNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <MapPin className="w-6 h-6" />
                            {district}
                          </h3>
                          {isSaved && trip.thumbnail?.firstPlace && (
                            <p className="text-white/90 text-sm">
                              Starting at: {trip.thumbnail.firstPlace}
                            </p>
                          )}
                        </div>
                        {isSaved && (
                          <button
                            onClick={() => handleToggleFavorite(trip._id, trip.favorite)}
                            className={`p-2 rounded-full transition-all ${
                              trip.favorite
                                ? 'bg-red-500 text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            <Heart
                              className="w-5 h-5"
                              fill={trip.favorite ? 'currentColor' : 'none'}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Duration</p>
                          <p className="text-lg font-bold text-gray-900">{days} Days</p>
                        </div>
                      </div>

                      {isSaved && trip.tripData.stats && (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Places</p>
                              <p className="text-lg font-bold text-gray-900">
                                {trip.tripData.stats.totalPlaces}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200 col-span-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Total Time</p>
                              <p className="text-lg font-bold text-gray-900">
                                {trip.tripData.stats.totalDuration} hours
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getBudgetColor(budget)}`}>
                        {getBudgetIcon(budget)} {budget}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-100 text-pink-700 border-2 border-pink-300">
                        {getTravelIcon(travelWith)} {travelWith}
                      </span>
                      {travelerType && (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 border-2 border-indigo-300">
                          ✨ {travelerType}
                        </span>
                      )}
                    </div>

                    {isSaved && trip.tags && trip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {trip.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-6 pb-6 border-b border-gray-200">
                      <p className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Created: {formatDate(trip.createdAt)}
                      </p>
                      {isSaved && (
                        <p className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3" />
                          Saved: {formatDate(trip.savedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {isSaved ? (
                        <>
                          <button
                            onClick={() => navigate(`/live-map/${trip._id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
                          >
                            <Navigation className="w-4 h-4" />
                            Map
                          </button>

                          <TripQRCode 
                            tripId={trip._id} 
                            tripName={district}
                          />

                          <button
                            onClick={() => handleViewTrip(trip._id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSavedTrip(trip._id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors border-2 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerateItinerary(trip)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Itinerary
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredTrips.map((trip) => {
              const isSaved = trip.type === 'saved';
              const district = trip.tripData?.district || trip.district;
              const days = trip.tripData?.days || trip.days;
              const budget = trip.tripData?.budget || trip.budget;
              const travelWith = trip.tripData?.travelWith || trip.travelWith;
              const travelerType = trip.tripData?.travelerType || trip.travelerType;

              return (
                <div
                  key={trip._id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-4 rounded-xl ${isSaved ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <MapPin className={`w-8 h-8 ${isSaved ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{district}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isSaved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isSaved ? 'SAVED' : 'PLANNED'}
                          </span>
                          {trip.tripNumber && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                              #{trip.tripNumber}
                            </span>
                          )}
                          {travelerType && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              ✨ {travelerType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {days} Days
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {budget}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {travelWith}
                          </span>
                          {isSaved && trip.tripData.stats && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {trip.tripData.stats.totalPlaces} Places
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isSaved ? (
                        <>
                          <button
                            onClick={() => navigate(`/live-map/${trip._id}`)}
                            className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <Navigation className="w-4 h-4" />
                            Map
                          </button>

                          <TripQRCode 
                            tripId={trip._id} 
                            tripName={district}
                          />

                          <button
                            onClick={() => handleToggleFavorite(trip._id, trip.favorite)}
                            className={`p-3 rounded-xl transition-all ${
                              trip.favorite
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className="w-5 h-5" fill={trip.favorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => handleViewTrip(trip._id)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteSavedTrip(trip._id)}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerateItinerary(trip)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTripsPage;
