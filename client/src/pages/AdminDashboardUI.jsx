import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [allTrips, setAllTrips] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBudget, setFilterBudget] = useState('ALL');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{"name": "Admin User", "email": "admin@example.com"}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const tripsResponse = await fetch('http://localhost:3000/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trips = await tripsResponse.json();
      setAllTrips(Array.isArray(trips) ? trips : []);

      const uniqueUserIds = [...new Set(trips.map(t => t.userId).filter(Boolean))];

      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const profileRes = await fetch(`http://localhost:3000/classifier/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            return { userId, profile };
          }
        } catch (err) {
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      const profileMap = {};
      profiles.forEach(item => {
        if (item) profileMap[item.userId] = item.profile;
      });
      setUserProfiles(profileMap);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      alert('Error deleting trip');
    }
  };

  const calculateStats = () => {
    const uniqueUsers = new Set(allTrips.map(t => t.userId).filter(Boolean));
    const totalDays = allTrips.reduce((sum, t) => sum + (t.days || 0), 0);
    const avgDays = allTrips.length > 0 ? (totalDays / allTrips.length).toFixed(1) : 0;
    
    const budgetCount = allTrips.reduce((acc, trip) => {
      acc[trip.budget] = (acc[trip.budget] || 0) + 1;
      return acc;
    }, {});

    const districtCount = allTrips.reduce((acc, trip) => {
      acc[trip.district] = (acc[trip.district] || 0) + 1;
      return acc;
    }, {});

    const travelWithCount = allTrips.reduce((acc, trip) => {
      acc[trip.travelWith] = (acc[trip.travelWith] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTrips: allTrips.length,
      totalUsers: uniqueUsers.size,
      avgDays,
      budgetCount,
      districtCount,
      travelWithCount,
      profileCount: Object.keys(userProfiles).length
    };
  };

  const getFilteredTrips = () => {
    return allTrips.filter(trip => {
      const matchesSearch = searchTerm === '' || 
        trip.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.userId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBudget = filterBudget === 'ALL' || trip.budget === filterBudget;
      const matchesDistrict = filterDistrict === 'ALL' || trip.district === filterDistrict;
      
      return matchesSearch && matchesBudget && matchesDistrict;
    });
  };

  const stats = calculateStats();
  const filteredTrips = getFilteredTrips();
  const uniqueDistricts = [...new Set(allTrips.map(t => t.district))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-2xl font-bold">Travel Admin</h1>
              <p className="text-xs text-purple-200 mt-1">Dashboard v2.0</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Overview' },
            { id: 'trips', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', label: 'All Trips' },
            { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'User Profiles' },
            { id: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all transform ${
                activeTab === item.id 
                  ? 'bg-white text-indigo-900 shadow-lg scale-105' 
                  : 'hover:bg-white/10 hover:translate-x-1'
              }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {sidebarOpen && <span className="font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} p-3 bg-white/10 rounded-xl`}>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {currentUser?.name?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
                <p className="text-xs text-purple-200 truncate">{currentUser?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {activeTab === 'overview' && '📊 Dashboard Overview'}
                {activeTab === 'trips' && '✈️ Trip Management'}
                {activeTab === 'users' && '👥 User Profiles'}
                {activeTab === 'analytics' && '📈 Analytics'}
              </h2>
              <p className="text-gray-500 mt-1">Real-time travel data and insights</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-semibold">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600 font-semibold text-lg">Loading dashboard data...</p>
              </div>
            </div>
          )}

          {!loading && activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold mb-3">Total Trips</p>
                      <p className="text-6xl font-bold">{stats.totalTrips}</p>
                    </div>
                    <div className="bg-blue-400/30 p-4 rounded-2xl">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
                    </svg>
                    <span className="text-sm font-medium">All planned adventures</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-purple-100 text-sm font-semibold mb-3">Active Users</p>
                      <p className="text-6xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-purple-400/30 p-4 rounded-2xl">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-purple-100">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-sm font-medium">Unique travelers</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-green-100 text-sm font-semibold mb-3">Avg Duration</p>
                      <p className="text-6xl font-bold">{stats.avgDays}</p>
                    </div>
                    <div className="bg-green-400/30 p-4 rounded-2xl">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-green-100">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                    </svg>
                    <span className="text-sm font-medium">Days per trip</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-orange-100 text-sm font-semibold mb-3">User Profiles</p>
                      <p className="text-6xl font-bold">{stats.profileCount}</p>
                    </div>
                    <div className="bg-orange-400/30 p-4 rounded-2xl">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-100">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                    </svg>
                    <span className="text-sm font-medium">Classified</span>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Distribution */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Budget Distribution</h3>
                      <p className="text-gray-500 text-sm">Spending preferences breakdown</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(stats.budgetCount).map(([budget, count]) => (
                      <div key={budget}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-gray-800 text-lg">{budget}</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">{count}</span>
                            <span className="text-sm text-gray-500 ml-2">({((count / stats.totalTrips) * 100).toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-4 rounded-full transition-all duration-700 ${
                              budget === 'LIMITED' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              budget === 'MODERATE' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              'bg-gradient-to-r from-purple-400 to-purple-600'
                            }`}
                            style={{ width: `${(count / stats.totalTrips) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Travel Companions */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Travel Companions</h3>
                      <p className="text-gray-500 text-sm">Who's traveling together</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(stats.travelWithCount).map(([type, count]) => (
                      <div key={type} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all transform hover:scale-105">
                        <p className="text-4xl font-bold text-purple-700 mb-2">{count}</p>
                        <p className="text-sm text-gray-700 font-semibold">{type}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {((count / stats.totalTrips) * 100).toFixed(1)}% of trips
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Destinations */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">🏆 Top Destinations</h3>
                    <p className="text-gray-500 text-sm">Most popular travel locations</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(stats.districtCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([district, count], index) => (
                      <div key={district} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl font-bold text-blue-600">#{index + 1}</span>
                          <span className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg">
                            {count} trips
                          </span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{district}</p>
                        <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(stats.districtCount))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'trips' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">🔍 Filter Trips</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Search</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search district or user..."
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Budget Filter</label>
                    <select
                      value={filterBudget}
                      onChange={(e) => setFilterBudget(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-lg font-semibold"
                    >
                      <option value="ALL">All Budgets</option>
                      <option value="LIMITED">💰 Limited</option>
                      <option value="MODERATE">💵 Moderate</option>
                      <option value="LUXURY">💎 Luxury</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">District Filter</label>
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-lg font-semibold"
                    >
                      <option value="ALL">All Districts</option>
                      {uniqueDistricts.map(district => (
                        <option key={district} value={district}>📍 {district}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trips Table */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100">
                <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-white">All Trips</h3>
                      <p className="text-purple-100 mt-1">
                        Showing {filteredTrips.length} of {allTrips.length} trips
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <p className="text-3xl font-bold text-white">{filteredTrips.length}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">#</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">User</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">With</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTrips.map((trip, index) => (
                        <tr key={trip._id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg">
                              {trip.tripNumber || index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-mono bg-gray-200 px-3 py-2 rounded-lg text-gray-700 font-semibold">
                              {trip.userId ? trip.userId.slice(0, 10) + '...' : 'Anonymous'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {userProfiles[trip.userId] ? (
                              <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-purple-200 text-purple-900 shadow">
                                {userProfiles[trip.userId].travelerType}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Not set</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                              <span className="font-bold text-gray-800 text-lg">{trip.district}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-2xl font-bold text-gray-900">{trip.days}</span>
                            <span className="text-gray-500 text-sm ml-1">days</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold shadow ${
                              trip.budget === 'LIMITED' ? 'bg-green-200 text-green-900' :
                              trip.budget === 'MODERATE' ? 'bg-yellow-200 text-yellow-900' :
                              'bg-purple-200 text-purple-900'
                            }`}>
                              {trip.budget}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700 font-semibold">{trip.travelWith}</td>
                          <td className="px-6 py-5 text-xs text-gray-500">{formatDate(trip.createdAt)}</td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => deleteTrip(trip._id)}
                              className="px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredTrips.length === 0 && (
                    <div className="text-center py-20">
                      <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-bold text-2xl mb-2">No trips found</p>
                      <p className="text-gray-400">Try adjusting your search filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(userProfiles).map(([userId, profile]) => (
                <div key={userId} className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 hover:border-purple-400 hover:shadow-3xl transition-all transform hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                      {profile.travelerType[0]}
                    </div>
                    <div className="text-right">
                      <span className="block px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full text-xs font-black mb-2 shadow-lg">
                        {(profile.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">Confidence</span>
                    </div>
                  </div>

                  <h4 className="text-3xl font-black text-gray-900 mb-4">{profile.travelerType}</h4>
                  <p className="text-sm text-gray-600 mb-8 leading-relaxed">{profile.description}</p>

                  <div className="space-y-4 pt-6 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold">User ID:</span>
                      <span className="font-mono bg-gray-100 px-3 py-2 rounded-lg text-gray-800 font-semibold">{userId.slice(0, 12)}...</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold">Created:</span>
                      <span className="text-gray-700 font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold">Updated:</span>
                      <span className="text-gray-700 font-semibold">{new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:scale-105">
                    View Full Profile
                  </button>
                </div>
              ))}

              {Object.keys(userProfiles).length === 0 && (
                <div className="col-span-3 text-center py-20">
                  <svg className="w-32 h-32 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 font-bold text-3xl mb-3">No User Profiles Yet</p>
                  <p className="text-gray-400 text-lg">Profiles will appear once users complete their traveler classification</p>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl p-12 text-white">
                <div className="flex items-center mb-6">
                  <svg className="w-16 h-16 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h2 className="text-4xl font-black mb-2">Advanced Analytics</h2>
                    <p className="text-purple-100 text-lg">Deep insights and data visualization coming soon...</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-3">📅</span> Trip Duration Breakdown
                  </h3>
                  <div className="space-y-6">
                    {[
                      { range: '1-3 days', min: 1, max: 3, color: 'from-blue-400 to-blue-600' },
                      { range: '4-7 days', min: 4, max: 7, color: 'from-green-400 to-green-600' },
                      { range: '8+ days', min: 8, max: 999, color: 'from-purple-400 to-purple-600' }
                    ].map(({ range, min, max, color }) => {
                      const count = allTrips.filter(t => t.days >= min && t.days <= max).length;
                      return (
                        <div key={range}>
                          <div className="flex justify-between mb-3">
                            <span className="text-lg font-bold text-gray-800">{range}</span>
                            <span className="text-lg font-bold text-gray-900">{count} trips</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`bg-gradient-to-r ${color} h-4 rounded-full transition-all duration-700`}
                              style={{ width: `${(count / allTrips.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-3">🕐</span> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {allTrips.slice(0, 5).map((trip, index) => (
                      <div key={trip._id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-purple-50 hover:to-pink-50 transition-all transform hover:scale-105">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-800">{trip.district}</p>
                          <p className="text-sm text-gray-500 font-semibold">{trip.days} days • {trip.budget}</p>
                        </div>
                        <span className="text-xs text-gray-400 font-semibold">{new Date(trip.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
