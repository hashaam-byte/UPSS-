'use client'
import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Shield
} from 'lucide-react';

const CreateSchoolPage = () => {
  const [formData, setFormData] = useState({
    // School details
    schoolName: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    
    // Admin details
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    confirmPassword: '',
    
    // Settings
    maxStudents: 1000,
    maxTeachers: 100,
    allowStudentRegistration: false,
    requireEmailVerification: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Auto-generate slug from school name
    if (name === 'schoolName') {
      const slug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
    }
    
    // Clear errors when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const errors = [];
    
    // School validation
    if (!formData.schoolName.trim()) errors.push('School name is required');
    if (!formData.slug.trim()) errors.push('School slug is required');
    if (!formData.address.trim()) errors.push('School address is required');
    if (!formData.phone.trim()) errors.push('School phone is required');
    if (!formData.email.trim()) errors.push('School email is required');
    
    // Admin validation
    if (!formData.adminFirstName.trim()) errors.push('Admin first name is required');
    if (!formData.adminLastName.trim()) errors.push('Admin last name is required');
    if (!formData.adminEmail.trim()) errors.push('Admin email is required');
    if (!formData.adminPassword) errors.push('Admin password is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Invalid school email format');
    }
    if (formData.adminEmail && !emailRegex.test(formData.adminEmail)) {
      errors.push('Invalid admin email format');
    }
    
    // Password validation
    if (formData.adminPassword.length < 8) {
      errors.push('Admin password must be at least 8 characters');
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    // Slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (formData.slug && !slugRegex.test(formData.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/protected/headadmin/schools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create school');
        return;
      }
      
      setSuccess('School created successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = `/protected/headadmin/schools/${data.school.id}`;
      }, 2000);
      
    } catch (error) {
      console.error('Create school error:', error);
      setError('Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-3 hover:bg-blue-100/50 rounded-xl transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Create New School
              </h1>
              <p className="text-gray-600 text-lg mt-2">Add a new school to the platform with admin access</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center text-green-700 shadow-lg">
            <CheckCircle className="w-5 h-5 mr-3" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center text-red-700 shadow-lg">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* School Information */}
          <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">School Information</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="St. Mary's Secondary School"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="st-marys-secondary"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500 mt-1">Used for URLs (lowercase, no spaces)</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="123 Education Street, Lagos, Nigeria"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="+234 801 234 5678"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="info@stmarys.edu.ng"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="https://stmarys.edu.ng"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    min="1"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Teachers
                  </label>
                  <input
                    type="number"
                    name="maxTeachers"
                    value={formData.maxTeachers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    min="1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* School Settings */}
              <div className="mt-8 pt-6 border-t border-gray-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">School Settings</h3>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl border border-blue-200/50 hover:border-blue-300/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowStudentRegistration"
                      checked={formData.allowStudentRegistration}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Allow student self-registration</span>
                  </label>
                  
                  <label className="flex items-center p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200/50 hover:border-emerald-300/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="requireEmailVerification"
                      checked={formData.requireEmailVerification}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Require email verification for new users</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">School Admin Information</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="John"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="admin@stmarys.edu.ng"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="+234 801 234 5678"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      placeholder="Min 8 characters"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      placeholder="Confirm password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300/50 text-gray-700 rounded-xl hover:bg-gray-50/50 hover:border-gray-400/50 transition-all duration-200 font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10">Creating School...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Create School</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSchoolPage;