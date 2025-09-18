import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Building2, MapPin, Users, DollarSign, Clock, Upload } from 'lucide-react';
import { CSVUpload } from '../components/CSVUpload';

interface Plant {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export function ManagerDashboard() {
  const { profile } = useAuth();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (profile?.plant_id) {
      fetchPlant();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchPlant = async () => {
    if (!profile?.plant_id) return;

    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('id', profile.plant_id)
        .single();

      if (error) throw error;

      setPlant(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load plant information');
      console.error('Error fetching plant:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <div className="flex" style={{ paddingTop: '4rem' }}>
        <Sidebar
          activeSection={"dashboard"}
          onSectionChange={() => {}}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Manager Panel"
        />
        
        <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto py-2 lg:py-4 px-4 sm:px-6 lg:px-8 lg:ml-64">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
            Welcome back, {profile?.full_name}. Manage your plant's payroll operations.
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !plant ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Plant Assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to assign you to a manufacturing plant.
            </p>
          </div>
        ) : (
          <>
            {/* Plant Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 lg:mb-8 p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">{plant.name}</h2>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm lg:text-base">{plant.location}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Established {new Date(plant.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                    <p className="text-xs text-gray-500">Phase 2 Feature</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                    <p className="text-xs text-gray-500">Phase 2 Feature</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                    <p className="text-xs text-gray-500">Phase 2 Feature</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Plant Status</p>
                    <p className="text-lg font-bold text-green-600">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => setShowCSVUpload(true)}
                  className="p-4 border-2 border-dashed border-blue-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Import Employees</p>
                  <p className="text-xs text-gray-500 mt-1">Upload CSV file</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Process Payroll</p>
                  <p className="text-xs text-gray-500 mt-1">Coming in Phase 2</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">View Reports</p>
                  <p className="text-xs text-gray-500 mt-1">Coming in Phase 2</p>
                </button>
              </div>
            </div>

            {/* CSV Upload Modal */}
            {showCSVUpload && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <CSVUpload 
                    onSuccess={() => {
                      setShowCSVUpload(false);
                      // Optionally refresh data or show success message
                    }}
                    onError={(error) => {
                      console.error('CSV upload error:', error);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}