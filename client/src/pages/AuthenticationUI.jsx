import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Shield, Mail, Lock, Building, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ✅ Import your 4 local images
import bg1 from '../assets/images/bg1.jpg';
import bg2 from '../assets/images/bg2.jpg';
import bg3 from '../assets/images/bg3.jpg';
import bg4 from '../assets/images/bg4.jpg';

const AuthenticationUI = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // ✅ 8 Background Images (4 local + 4 online)
  const backgroundImages = [
    bg1,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    bg4,
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',
    bg2,
    'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1920&q=80',
    bg3,
    bg2,
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80',
  ];

  // ✅ Rotate background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    zipCode: '',
    adminCode: '',
    department: '',
    employeeId: '',
    organizationName: '',
    adminLevel: 'manager',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      alert('Email and password are required');
      setIsLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        const { token, user } = data;

        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('userId', user.id || user._id);
        sessionStorage.setItem('username', user.name || user.firstName);

        console.log("🔑 Login Successful!");
        console.log("User ID:", user.id || user._id);
        console.log("Username:", user.name || user.firstName);
        console.log("Token:", token);

        if (user.role === 'admin') {
          alert('Admin login successful!');
          navigate('/admin-dashboard');
        } else if (user.role === 'user') {
          alert('User login successful!');
          navigate('/user-dashboard');
        } else {
          alert('Unknown role. Please contact support.');
        }
      } else {
        const response = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        console.log("📝 Registration Successful!");
        console.log("User ID:", data.user?.id || data.user?._id);
        console.log("Username:", data.user?.name || data.user?.firstName);

        alert(`${isAdmin ? "Admin" : "User"} registration successful! Please login.`);
        setIsLogin(true);
        resetForm();
      }
    } catch (error) {
      alert(error.message || 'Something went wrong.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
      address: '',
      city: '',
      zipCode: '',
      adminCode: '',
      department: '',
      employeeId: '',
      organizationName: '',
      adminLevel: 'manager',
    });
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const toggleUserType = () => {
    setIsAdmin(!isAdmin);
    resetForm();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* ✅ 8 Background Images - Zoomed Out */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentBgIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1)', // ✅ Normal scale (not zoomed)
          }}
        />
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* ✅ Fully Glass Transparent Form */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        
        {/* ✅ Glass Transparent Header (No Blue) */}
        <div className="backdrop-blur-md bg-white/10 p-6 text-white border-b border-white/20">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {isAdmin ? (
              <Shield className="w-8 h-8" />
            ) : (
              <User className="w-8 h-8" />
            )}
            <h1 className="text-2xl font-bold">
              {isAdmin ? 'Admin' : 'User'} {isLogin ? 'Login' : 'Registration'}
            </h1>
          </div>
          
          {/* Demo Credentials */}
          {isLogin && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 text-sm border border-white/20">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p>Admin: admin@example.com / admin123</p>
              <p>User: user@example.com / user123</p>
            </div>
          )}
          
          {/* User Type Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              type="button"
              onClick={toggleUserType}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all backdrop-blur-sm ${
                !isAdmin 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <User className="w-4 h-4" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={toggleUserType}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all backdrop-blur-sm ${
                isAdmin 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
          
          {/* Login/Register Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 flex border border-white/20">
              <button
                type="button"
                onClick={toggleAuthMode}
                className={`px-4 py-2 rounded-md transition-all ${
                  isLogin 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={toggleAuthMode}
                className={`px-4 py-2 rounded-md transition-all ${
                  !isLogin 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-white/70" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors text-white placeholder-white/60"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-white/70" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors text-white placeholder-white/60"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/70 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors text-white placeholder-white/60"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-white/70 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* User Registration Fields */}
          {!isLogin && !isAdmin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="10001"
                  />
                </div>
              </div>
            </>
          )}

          {/* Admin Registration Fields */}
          {!isLogin && isAdmin && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Admin Access Code</label>
                <input
                  type="text"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                  placeholder="Enter admin access code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
                    placeholder="IT Department"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Admin Level</label>
                <select
                  name="adminLevel"
                  value={formData.adminLevel}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 text-white"
                >
                  <option value="manager" className="bg-gray-900">Manager</option>
                  <option value="senior" className="bg-gray-900">Senior Admin</option>
                  <option value="super" className="bg-gray-900">Super Admin</option>
                </select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              isLoading
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-white/30 backdrop-blur-md hover:bg-white/40 transform hover:scale-105 shadow-lg border border-white/40'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `${isLogin ? 'Login' : 'Register'} as ${isAdmin ? 'Admin' : 'User'}`
            )}
          </button>

          {isLogin && (
            <div className="text-center">
              <button
                type="button"
                className="text-white hover:text-white/80 text-sm font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        {/* Custom Scrollbar */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthenticationUI;
