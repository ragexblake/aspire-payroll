import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Building2, MapPin, Users, DollarSign, Clock, Upload, Search, Download, Filter, X } from 'lucide-react';
import { CSVUpload } from '../components/CSVUpload';

interface Plant {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  salary: number | null;
  plant_id: string;
  manager_id: string;
  created_at: string;
}

// Demo data storage helpers for manager-specific employees
const getDemoEmployees = (managerId: string): Employee[] => {
  try {
    const allEmployees = JSON.parse(localStorage.getItem('demoEmployees') || '[]');
    return allEmployees.filter((emp: Employee) => emp.manager_id === managerId);
  } catch {
    return [];
  }
};

const setDemoEmployees = (employees: Employee[]) => {
  try {
    const existingEmployees = JSON.parse(localStorage.getItem('demoEmployees') || '[]');
    // Remove existing employees from this manager and add new ones
    const managerId = employees[0]?.manager_id;
    const otherEmployees = existingEmployees.filter((emp: Employee) => emp.manager_id !== managerId);
    const updatedEmployees = [...otherEmployees, ...employees];
    localStorage.setItem('demoEmployees', JSON.stringify(updatedEmployees));
  } catch (error) {
    console.error('Error saving demo employees:', error);
  }
};

const initializeSampleData = (managerId: string, plantId: string) => {
  const existingEmployees = getDemoEmployees(managerId);
  
  // Only add sample data if no employees exist for this manager
  if (existingEmployees.length === 0) {
    const sampleEmployees: Employee[] = [
      {
        id: `emp-${managerId}-1`,
        employee_id: 'EMP001',
        full_name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '(555) 123-4567',
        department: 'Production',
        position: 'Production Supervisor',
        hire_date: '2023-01-15',
        salary: 65000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-2`,
        employee_id: 'EMP002',
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '(555) 234-5678',
        department: 'Quality Control',
        position: 'QC Inspector',
        hire_date: '2023-03-20',
        salary: 55000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-3`,
        employee_id: 'EMP003',
        full_name: 'Michael Brown',
        email: 'michael.brown@company.com',
        phone: '(555) 345-6789',
        department: 'Production',
        position: 'Machine Operator',
        hire_date: '2023-02-10',
        salary: 45000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-4`,
        employee_id: 'EMP004',
        full_name: 'Emily Davis',
        email: 'emily.davis@company.com',
        phone: '(555) 456-7890',
        department: 'Maintenance',
        position: 'Maintenance Technician',
        hire_date: '2023-04-05',
        salary: 52000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-5`,
        employee_id: 'EMP005',
        full_name: 'Robert Wilson',
        email: 'robert.wilson@company.com',
        phone: '(555) 567-8901',
        department: 'Quality Control',
        position: 'QC Manager',
        hire_date: '2022-11-15',
        salary: 72000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-6`,
        employee_id: 'EMP006',
        full_name: 'Lisa Anderson',
        email: 'lisa.anderson@company.com',
        phone: '(555) 678-9012',
        department: 'Production',
        position: 'Assembly Worker',
        hire_date: '2023-05-12',
        salary: 42000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-7`,
        employee_id: 'EMP007',
        full_name: 'David Martinez',
        email: 'david.martinez@company.com',
        phone: '(555) 789-0123',
        department: 'Maintenance',
        position: 'Electrical Technician',
        hire_date: '2023-01-30',
        salary: 58000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      },
      {
        id: `emp-${managerId}-8`,
        employee_id: 'EMP008',
        full_name: 'Jennifer Taylor',
        email: 'jennifer.taylor@company.com',
        phone: '(555) 890-1234',
        department: 'Production',
        position: 'Line Lead',
        hire_date: '2022-12-08',
        salary: 48000,
        plant_id: plantId,
        manager_id: managerId,
        created_at: new Date().toISOString()
      }
    ];
    
    // Add sample employees to localStorage
    const existingAllEmployees = JSON.parse(localStorage.getItem('demoEmployees') || '[]');
    const updatedAllEmployees = [...existingAllEmployees, ...sampleEmployees];
    localStorage.setItem('demoEmployees', JSON.stringify(updatedAllEmployees));
    
    return sampleEmployees;
  }
  
  return existingEmployees;
};

const addDemoEmployee = (employee: Employee) => {
  try {
    const existingEmployees = JSON.parse(localStorage.getItem('demoEmployees') || '[]');
    const updatedEmployees = [...existingEmployees, employee];
    localStorage.setItem('demoEmployees', JSON.stringify(updatedEmployees));
  } catch (error) {
    console.error('Error adding demo employee:', error);
  }
};

const isDemoUser = (userId: string) => {
  return userId.startsWith('demo-');
};

export function ManagerDashboard() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [plant, setPlant] = useState<Plant | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  
  // Employee management states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Add employee form state
  const [employeeForm, setEmployeeForm] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
    salary: ''
  });
  const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);
  const [addEmployeeError, setAddEmployeeError] = useState('');

  useEffect(() => {
    if (profile?.plant_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.plant_id || !profile?.id) return;

    try {
      setLoading(true);
      
      if (isDemoUser(profile.id)) {
        // Use demo data from localStorage
        const demoPlants = JSON.parse(localStorage.getItem('demoPlants') || '[]');
        const managerPlant = demoPlants.find((p: Plant) => p.id === profile.plant_id);
        setPlant(managerPlant || null);
        
        // Initialize sample data if needed, then get employees
        const managerEmployees = initializeSampleData(profile.id, profile.plant_id);
        setEmployees(managerEmployees);
      } else {
        // Fetch plant data from Supabase
        const { data: plantData, error: plantError } = await supabase
          .from('plants')
          .select('*')
          .eq('id', profile.plant_id)
          .maybeSingle();

        if (plantError && plantError.code !== 'PGRST116') {
          throw plantError;
        }
        setPlant(plantData);

        // Fetch employees imported by this manager
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*')
          .or(`manager_id.eq.${profile.id},plant_id.eq.${profile.plant_id}`)
          .order('created_at', { ascending: false });

        if (employeesError && employeesError.code !== 'PGRST116') {
          console.log('Employee fetch error:', employeesError);
          // If table doesn't exist, fall back to empty array
          setEmployees([]);
        } else {
          setEmployees(employeesData || []);
        }
      }
    } catch (err: any) {
      console.log('Fetch data error:', err);
      // Don't show error for missing tables, just use empty data
      if (err.message?.includes('Could not find the table')) {
        setEmployees([]);
        setError('');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUploadSuccess = () => {
    setShowCSVUpload(false);
    fetchData(); // Refresh employee data
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.plant_id || !profile?.id) return;
    
    setAddEmployeeLoading(true);
    setAddEmployeeError('');
    
    try {
      // Validate required fields
      if (!employeeForm.employee_id || !employeeForm.full_name) {
        throw new Error('Employee ID and Full Name are required');
      }
      
      // Check for duplicate employee ID
      const existingEmployee = employees.find(emp => emp.employee_id === employeeForm.employee_id);
      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }
      
      const newEmployee: Employee = {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employeeForm.employee_id,
        full_name: employeeForm.full_name,
        email: employeeForm.email || null,
        phone: employeeForm.phone || null,
        department: employeeForm.department || null,
        position: employeeForm.position || null,
        hire_date: employeeForm.hire_date || null,
        salary: employeeForm.salary ? parseFloat(employeeForm.salary) : null,
        plant_id: profile.plant_id,
        manager_id: profile.id,
        created_at: new Date().toISOString()
      };
      
      if (isDemoUser(profile.id)) {
        // Save to localStorage for demo users
        addDemoEmployee(newEmployee);
        setEmployees([newEmployee, ...employees]);
      } else {
        // Save to Supabase for real users
        const { data, error } = await supabase
          .from('employees')
          .insert({
            employee_id: newEmployee.employee_id,
            full_name: newEmployee.full_name,
            email: newEmployee.email,
            phone: newEmployee.phone,
            department: newEmployee.department,
            position: newEmployee.position,
            hire_date: newEmployee.hire_date,
            salary: newEmployee.salary,
            plant_id: newEmployee.plant_id,
            manager_id: newEmployee.manager_id
          })
          .select()
          .single();
        
        if (error) throw error;
        setEmployees([data, ...employees]);
      }
      
      // Reset form and close modal
      setEmployeeForm({
        employee_id: '',
        full_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hire_date: '',
        salary: ''
      });
      setShowAddEmployee(false);
      
    } catch (err: any) {
      setAddEmployeeError(err.message || 'Failed to add employee');
    } finally {
      setAddEmployeeLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Position',
      'Hire Date',
      'Salary'
    ];
    
    const csvData = filteredEmployees.map(emp => [
      emp.employee_id,
      emp.full_name,
      emp.email || '',
      emp.phone || '',
      emp.department || '',
      emp.position || '',
      emp.hire_date || '',
      emp.salary?.toString() || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plant?.name || 'plant'}_employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter employees based on search and department
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || emp.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  const renderDashboard = () => (
    <>
      {/* Plant Info Card */}
      {plant && (
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
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              <p className="text-xs text-gray-500">Imported by you</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                ${employees.reduce((sum, emp) => sum + (emp.salary || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Monthly estimate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Filter className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              <p className="text-xs text-gray-500">Active departments</p>
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
          
          <button 
            onClick={() => setShowAddEmployee(true)}
            className="p-4 border-2 border-dashed border-green-200 rounded-lg text-center hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <Users className="mx-auto h-8 w-8 text-green-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Add Employee</p>
            <p className="text-xs text-gray-500 mt-1">Add single employee</p>
          </button>
          
          <button 
            onClick={() => setActiveSection('employees')}
            className="p-4 border-2 border-dashed border-purple-200 rounded-lg text-center hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Users className="mx-auto h-8 w-8 text-purple-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">View Employees</p>
            <p className="text-xs text-gray-500 mt-1">Manage employee data</p>
          </button>
          
          <button 
            onClick={exportToCSV}
            disabled={employees.length === 0}
            className="p-4 border-2 border-dashed border-yellow-200 rounded-lg text-center hover:border-yellow-300 hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Export Data</p>
            <p className="text-xs text-gray-500 mt-1">Download CSV</p>
          </button>
        </div>
      </div>
    </>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCSVUpload(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button
              onClick={() => setShowAddEmployee(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Users className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredEmployees.length === 0}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Directory ({filteredEmployees.length} of {employees.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {employees.length === 0 ? (
                      <div>
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No employees found</p>
                        <p className="text-sm text-gray-500 mb-4">Import your first batch of employees to get started.</p>
                        <button
                          onClick={() => setShowCSVUpload(true)}
                          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Import Employees</span>
                        </button>
                        <button
                          onClick={() => setShowAddEmployee(true)}
                          className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-2"
                        >
                          <Users className="h-4 w-4" />
                          <span>Add Employee</span>
                        </button>
                      </div>
                    ) : (
                      'No employees match your search criteria'
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.position || 'No position'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{employee.email || '-'}</div>
                      <div>{employee.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.salary ? `$${employee.salary.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'employees':
        return renderEmployees();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <div className="flex h-screen">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Manager Panel"
        />
        
        <div className="flex-1 h-full overflow-y-auto pt-16 lg:ml-64">
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
                {activeSection === 'employees' ? 'Employee Management' : 'Manager Dashboard'}
              </h1>
              <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
                {activeSection === 'employees' 
                  ? `Manage employees for ${plant?.name || 'your plant'}`
                  : `Welcome back, ${profile?.full_name}. Manage your plant's operations.`
                }
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
              renderContent()
            )}
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Employees</h3>
              <button
                onClick={() => setShowCSVUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <CSVUpload 
                onSuccess={handleCSVUploadSuccess}
                onError={(error) => {
                  console.error('CSV upload error:', error);
                  setError(error);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Employee</h3>
              <button
                onClick={() => {
                  setShowAddEmployee(false);
                  setAddEmployeeError('');
                  setEmployeeForm({
                    employee_id: '',
                    full_name: '',
                    email: '',
                    phone: '',
                    department: '',
                    position: '',
                    hire_date: '',
                    salary: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.employee_id}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., EMP001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.full_name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
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
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="employee@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Production, Quality Control"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Machine Operator, Supervisor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={employeeForm.hire_date}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              
              {addEmployeeError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {addEmployeeError}
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmployee(false);
                    setAddEmployeeError('');
                    setEmployeeForm({
                      employee_id: '',
                      full_name: '',
                      email: '',
                      phone: '',
                      department: '',
                      position: '',
                      hire_date: '',
                      salary: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEmployeeLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addEmployeeLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Add Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}