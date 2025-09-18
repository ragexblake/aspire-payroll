import React from 'react';
import { Database, Users, AlertCircle } from 'lucide-react';

export function EmployeeData() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Employee Data</h1>
        <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
          View and manage employee information across all plants.
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-base lg:text-lg font-medium text-blue-900">Coming in Phase 2</h3>
            <p className="text-sm lg:text-base text-blue-700 mt-1">
              Employee data management features will be available in the next phase of development.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">Across all plants</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Records</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">Up to date</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">Various roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Features</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Employee Directory</h4>
            <p className="text-sm text-gray-600">
              Complete employee database with contact information, roles, and department assignments.
            </p>
          </div>
          
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Payroll Records</h4>
            <p className="text-sm text-gray-600">
              Historical payroll data, salary information, and payment tracking.
            </p>
          </div>
          
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Time Tracking</h4>
            <p className="text-sm text-gray-600">
              Employee time sheets, attendance records, and overtime calculations.
            </p>
          </div>
          
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Reports & Analytics</h4>
            <p className="text-sm text-gray-600">
              Comprehensive reporting tools for HR and payroll analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}