import React from 'react';
import { Building2, Users, TrendingUp, DollarSign, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardOverviewProps {
  plants: any[];
  managers: any[];
}

export function DashboardOverview({ plants, managers }: DashboardOverviewProps) {
  const totalPlants = plants.length;
  const totalManagers = managers.length;
  const plantsWithManagers = plants.filter(plant => 
    managers.some(manager => manager.plant_id === plant.id)
  ).length;
  const plantsWithoutManagers = totalPlants - plantsWithManagers;

  return (
    <>
      {/* Welcome Section removed */}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plants</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlants}</p>
              <p className="text-xs text-green-600 mt-1">
                {plantsWithManagers} with managers
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Plant Managers</p>
              <p className="text-2xl font-bold text-gray-900">{totalManagers}</p>
              <p className="text-xs text-gray-500 mt-1">
                Active users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500 mt-1">
                Phase 2 Feature
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-lg font-bold text-green-600">Operational</p>
              <p className="text-xs text-gray-500 mt-1">
                All systems running
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Plant Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plant Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Plants with Managers</span>
              </div>
              <span className="text-lg font-bold text-green-600">{plantsWithManagers}</span>
            </div>
            
            {plantsWithoutManagers > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Plants without Managers</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{plantsWithoutManagers}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Total Manufacturing Plants</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{totalPlants}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {totalPlants > 0 ? (
              <>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-blue-100 rounded">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Plants Created</p>
                    <p className="text-xs text-gray-500">{totalPlants} manufacturing plants added</p>
                  </div>
                </div>
                
                {totalManagers > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-1 bg-green-100 rounded">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Managers Assigned</p>
                      <p className="text-xs text-gray-500">{totalManagers} plant managers added</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400">Start by adding your first plant</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-blue-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Building2 className="mx-auto h-8 w-8 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Add New Plant</p>
            <p className="text-xs text-gray-500 mt-1">Create manufacturing facility</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-green-200 rounded-lg text-center hover:border-green-300 hover:bg-green-50 transition-colors">
            <Users className="mx-auto h-8 w-8 text-green-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Add Manager</p>
            <p className="text-xs text-gray-500 mt-1">Assign plant manager</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-purple-200 rounded-lg text-center hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <TrendingUp className="mx-auto h-8 w-8 text-purple-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">View Reports</p>
            <p className="text-xs text-gray-500 mt-1">Coming in Phase 2</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-yellow-200 rounded-lg text-center hover:border-yellow-300 hover:bg-yellow-50 transition-colors">
            <DollarSign className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Process Payroll</p>
            <p className="text-xs text-gray-500 mt-1">Coming in Phase 2</p>
          </button>
        </div>
      </div>
    </>
  );
}