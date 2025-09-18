import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ProfileSettings } from '../components/ProfileSettings';
import { EmployeeData } from '../components/EmployeeData';
import { DashboardOverview } from '../components/DashboardOverview';
import { EmployeeManagement } from '../components/EmployeeManagement';
import { OTPVerification } from '../components/OTPVerification';
import { EmailService } from '../lib/emailService';
import { Building2, MapPin, Users, TrendingUp, Plus, UserPlus, X, LockKeyhole, Lock, KeyRound } from 'lucide-react';

interface Plant {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

interface Manager {
  id: string;
  full_name: string;
  email: string;
  plant_id: string;
  created_at: string;
}

// Demo data storage helpers
const getDemoPlants = (): Plant[] => {
  try {
    return JSON.parse(localStorage.getItem('demoPlants') || '[]');
  } catch {
    return [];
  }
};

const setDemoPlants = (plants: Plant[]) => {
  localStorage.setItem('demoPlants', JSON.stringify(plants));
};

const getDemoManagers = (): Manager[] => {
  try {
    return JSON.parse(localStorage.getItem('demoManagers') || '[]');
  } catch {
    return [];
  }
};

const setDemoManagers = (managers: Manager[]) => {
  localStorage.setItem('demoManagers', JSON.stringify(managers));
};

const isDemoUser = (userId: string) => {
  return userId.startsWith('demo-');
};

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState('');
  
  // Password reset states
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedManagerForPasswordReset, setSelectedManagerForPasswordReset] = useState<Manager | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState('');

  // Form states
  const [plantForm, setPlantForm] = useState({ name: '', location: '' });
  const [managerForm, setManagerForm] = useState({ 
    full_name: '', 
    email: '', 
    password: '', 
    plant_id: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (profile && isDemoUser(profile.id)) {
        // Use demo data from localStorage
        setPlants(getDemoPlants());
        setManagers(getDemoManagers());
      } else {
        // Fetch from Supabase
        const { data: plantsData, error: plantsError } = await supabase
          .from('plants')
          .select('*')
          .order('created_at', { ascending: false });

        if (plantsError) throw plantsError;

        const { data: managersData, error: managersError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'manager')
          .order('created_at', { ascending: false });

        if (managersError) throw managersError;

        setPlants(plantsData || []);
        setManagers(managersData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantForm.name || !plantForm.location) return;

    try {
      const newPlant: Plant = {
        id: `plant-${Date.now()}`,
        name: plantForm.name,
        location: plantForm.location,
        created_at: new Date().toISOString(),
      };

      if (profile && isDemoUser(profile.id)) {
        // Save to demo data
        const updatedPlants = [newPlant, ...plants];
        setDemoPlants(updatedPlants);
        setPlants(updatedPlants);
      } else {
        // Save to Supabase
        const { data, error } = await supabase
          .from('plants')
          .insert({
            name: plantForm.name,
            location: plantForm.location,
          })
          .select()
          .single();

        if (error) throw error;
        setPlants([data, ...plants]);
      }

      setPlantForm({ name: '', location: '' });
      setShowAddPlant(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add plant');
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerForm.full_name || !managerForm.email || !managerForm.password || !managerForm.plant_id) return;

    await executeAddManager({
      full_name: managerForm.full_name,
      email: managerForm.email,
      plant_id: managerForm.plant_id,
      password: managerForm.password
    });
  };

  const executeAddManager = async (managerData: any) => {
    try {
      const newManager: Manager = {
        id: `manager-${Date.now()}`,
        full_name: managerData.full_name,
        email: managerData.email,
        plant_id: managerData.plant_id,
        created_at: new Date().toISOString(),
      };

      if (profile && isDemoUser(profile.id)) {
        // Save to demo data
        const updatedManagers = [newManager, ...managers];
        setDemoManagers(updatedManagers);
        setManagers(updatedManagers);

        // Also save manager credentials for login
        const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
        const newUser = {
          ...newManager,
          password: managerData.password,
          role: 'manager' as const,
        };
        const updatedUsers = [...existingUsers, newUser];
        localStorage.setItem('demoUsers', JSON.stringify(updatedUsers));
      } else {
        // Save to Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: managerData.email,
          password: managerData.password,
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Failed to create user');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: managerData.full_name,
            email: managerData.email,
            role: 'manager',
            plant_id: managerData.plant_id,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        setManagers([profileData, ...managers]);
      }

      setManagerForm({ full_name: '', email: '', password: '', plant_id: '' });
      setShowAddManager(false);
      setSelectedPlantId('');
    } catch (err: any) {
      setError(err.message || 'Failed to add manager');
    }
  };

  const handleSendOTPForPasswordReset = async () => {
    if (!selectedManagerForPasswordReset || !profile) return;
    
    // Validate passwords
    if (!newPassword || !confirmNewPassword) {
      setPasswordResetError('Please enter both password fields');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordResetError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordResetError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setPasswordResetLoading(true);
      setPasswordResetError('');
      setPasswordResetSuccess('');
      
      const result = await EmailService.sendOTPEmail(
        profile.email,
        selectedManagerForPasswordReset.id,
        profile.id
      );
      
      if (result.success) {
        setOtpSent(true);
        setPasswordResetSuccess(`OTP has been sent to your admin email: ${profile.email}`);
      } else {
        console.error('OTP sending failed:', result.error);
        setPasswordResetError(result.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setPasswordResetError(err.message || 'Failed to send OTP');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleVerifyOTPForPasswordReset = async (otp: string) => {
    if (!selectedManagerForPasswordReset || !profile) return;
    
    try {
      setPasswordResetLoading(true);
      setPasswordResetError('');
      
      // Query the otp_codes table to verify the OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('otp_code', otp)
        .eq('admin_id', profile.id)
        .eq('operation_type', 'password_reset')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (otpError || !otpData) {
        setPasswordResetError('Invalid or expired OTP');
        return;
      }
      
      // Check if the target_data matches the selected manager
      const targetData = otpData.target_data as any;
      if (targetData?.manager_id !== selectedManagerForPasswordReset.id) {
        setPasswordResetError('Invalid OTP for this manager');
        return;
      }
      
      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpData.id);
      
      if (updateError) {
        setPasswordResetError('Failed to verify OTP');
        return;
      }
      
      setOtpVerified(true);
      setPasswordResetSuccess('OTP verified successfully. You can now reset the password.');
    } catch (err: any) {
      setPasswordResetError(err.message || 'Failed to verify OTP');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleResetManagerPassword = async () => {
    if (!selectedManagerForPasswordReset || !newPassword) return;
    
    try {
      setPasswordResetLoading(true);
      setPasswordResetError('');
      
      if (profile && isDemoUser(profile.id)) {
        // Update demo user password in localStorage
        const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
        const updatedUsers = existingUsers.map((user: any) => {
          if (user.id === selectedManagerForPasswordReset.id) {
            return { ...user, password: newPassword };
          }
          return user;
        });
        localStorage.setItem('demoUsers', JSON.stringify(updatedUsers));
        
        setPasswordResetSuccess('Password reset successfully for demo user');
      } else {
        // For Supabase users, this would require a backend service with service_role key
        // to call supabase.auth.admin.updateUserById(managerId, { password: newPassword })
        // For now, we'll simulate success
        console.log('Note: Actual password reset for Supabase users requires backend service with service_role key');
        setPasswordResetSuccess('Password reset request processed (requires backend implementation for Supabase users)');
      }
      
      // Reset all state and close modal
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setSelectedManagerForPasswordReset(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setOtpSent(false);
        setOtpVerified(false);
        setPasswordResetError('');
        setPasswordResetSuccess('');
      }, 2000);
      
    } catch (err: any) {
      setPasswordResetError(err.message || 'Failed to reset password');
    } finally {
      setPasswordResetLoading(false);
    }
  };


  const getPlantName = (plantId: string) => {
    return plants.find(p => p.id === plantId)?.name || 'Unknown Plant';
  };

  const getManagersForPlant = (plantId: string) => {
    return managers.filter(m => m.plant_id === plantId);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview plants={plants} managers={managers} />;
      case 'plants':
        return renderPlantsSection();
      case 'users':
        return renderUsersSection();
      case 'profile':
        return <ProfileSettings />;
      case 'employees':
        return <EmployeeManagement />;
      default:
        return renderPlantsSection();
    }
  };

  const renderPlantsSection = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plants</p>
              <p className="text-2xl font-bold text-gray-900">{plants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Managers</p>
              <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">Coming in Phase 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plants Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manufacturing Plants</h2>
              <p className="mt-1 text-sm text-gray-600">Manage all plants in your organization</p>
            </div>
            <button
              onClick={() => setShowAddPlant(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Plant</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : plants.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plants found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first manufacturing plant.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {plants.map((plant) => (
                <div
                  key={plant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {plant.name}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {plant.location}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          Created {new Date(plant.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">
                            Managers: {getManagersForPlant(plant.id).length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedPlantId(plant.id);
                          setManagerForm({ ...managerForm, plant_id: plant.id });
                          setShowAddManager(true);
                        }}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Add Manager"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderUsersSection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plant Managers</h2>
            <p className="mt-1 text-sm text-gray-600">All managers across your organization</p>
          </div>
          <button
            onClick={() => setShowAddManager(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Manager</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {managers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No managers found</h3>
            <p className="mt-1 text-sm text-gray-500">Add managers to oversee your manufacturing plants.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {managers.map((manager) => (
              <div
                key={manager.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{manager.full_name}</h3>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                    <p className="text-xs text-gray-400">
                      Plant: {getPlantName(manager.plant_id)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedManagerForPasswordReset(manager);
                      setShowPasswordResetModal(true);
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setOtpSent(false);
                      setOtpVerified(false);
                      setPasswordResetError('');
                      setPasswordResetSuccess('');
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Reset Password"
                  >
                    <LockKeyhole className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <div className="flex lg:ml-64" style={{ paddingTop: '4rem' }}>
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto pt-6 lg:pt-8">
          <div className="p-4 lg:p-8">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Menu</span>
            </button>
          </div>
          
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {activeSection === 'dashboard' && 'Dashboard Overview'}
              {activeSection === 'plants' && 'Plants Management'}
              {activeSection === 'users' && 'User Management'}
              {activeSection === 'profile' && 'Profile Settings'}
              {activeSection === 'employees' && 'Employee Data'}
            </h1>
            <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
              {activeSection === 'plants' && 'Manage your manufacturing plants and operations.'}
              {activeSection === 'users' && 'Manage plant managers and user accounts.'}
              {activeSection === 'profile' && 'Update your profile information and preferences.'}
              {activeSection === 'employees' && 'View and manage employee information.'}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Dynamic Content */}
          {renderContent()}
          </div>
        </div>
      </div>

      {/* Add Plant Modal */}
      {showAddPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Add New Plant</h3>
              <button
                onClick={() => setShowAddPlant(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPlant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant Name
                </label>
                <input
                  type="text"
                  required
                  value={plantForm.name}
                  onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter plant name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={plantForm.location}
                  onChange={(e) => setPlantForm({ ...plantForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter plant location"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPlant(false)}
                  className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showAddManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Add New Manager</h3>
              <button
                onClick={() => {
                  setShowAddManager(false);
                  setSelectedPlantId('');
                  setManagerForm({ full_name: '', email: '', password: '', plant_id: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddManager} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={managerForm.full_name}
                  onChange={(e) => setManagerForm({ ...managerForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={managerForm.email}
                  onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={managerForm.password}
                  onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Plant
                </label>
                <select
                  required
                  value={managerForm.plant_id}
                  onChange={(e) => setManagerForm({ ...managerForm, plant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a plant</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name} - {plant.location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddManager(false);
                    setSelectedPlantId('');
                    setManagerForm({ full_name: '', email: '', password: '', plant_id: '' });
                  }}
                  className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && selectedManagerForPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900">Reset Manager Password</h3>
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setSelectedManagerForPasswordReset(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setOtpSent(false);
                  setOtpVerified(false);
                  setPasswordResetError('');
                  setPasswordResetSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Manager Info */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedManagerForPasswordReset.full_name}</h4>
                  <p className="text-sm text-gray-500">{selectedManagerForPasswordReset.email}</p>
                </div>
              </div>
            </div>
            
            {/* Step 1: Password Input */}
            {!otpSent && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSendOTPForPasswordReset}
                  disabled={passwordResetLoading || !newPassword || !confirmNewPassword}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordResetLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Send OTP to Manager</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Step 2: OTP Verification */}
            {otpSent && !otpVerified && (
              <OTPVerification
                onVerify={handleVerifyOTPForPasswordReset}
                onResend={handleSendOTPForPasswordReset}
                loading={passwordResetLoading}
                error={passwordResetError}
                success={passwordResetSuccess}
              />
            )}
            
            {/* Step 3: Confirm Reset */}
            {otpVerified && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-green-100 rounded-full">
                      <KeyRound className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h4 className="font-medium text-green-900 mb-1">OTP Verified Successfully</h4>
                  <p className="text-sm text-green-700">Ready to reset the manager's password</p>
                </div>
                
                <button
                  onClick={handleResetManagerPassword}
                  disabled={passwordResetLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordResetLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Error/Success Messages */}
            {passwordResetError && (
              <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {passwordResetError}
              </div>
            )}
            
            {passwordResetSuccess && !otpVerified && (
              <div className="mt-4 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                {passwordResetSuccess}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}