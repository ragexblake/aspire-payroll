import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CSVUploadProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface EmployeeData {
  employee_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  salary?: string;
}

export function CSVUpload({ onSuccess, onError }: CSVUploadProps) {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeeData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const parseCSV = (csvText: string): EmployeeData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: EmployeeData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: EmployeeData = {
        employee_id: values[headers.indexOf('employee_id')] || '',
        full_name: values[headers.indexOf('full_name')] || '',
        email: values[headers.indexOf('email')] || undefined,
        phone: values[headers.indexOf('phone')] || undefined,
        department: values[headers.indexOf('department')] || undefined,
        position: values[headers.indexOf('position')] || undefined,
        hire_date: values[headers.indexOf('hire_date')] || undefined,
        salary: values[headers.indexOf('salary')] || undefined,
      };
      
      if (row.employee_id && row.full_name) {
        data.push(row);
      }
    }
    
    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsed = parseCSV(csvText);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
      } catch (err) {
        setError('Invalid CSV format. Please check your file.');
        console.error('CSV parsing error:', err);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !profile?.plant_id) return;
    
    setUploading(true);
    setError('');
    
    try {
      const csvText = await file.text();
      const employees = parseCSV(csvText);
      
      // Prepare data for insertion
      const employeeRecords = employees.map(emp => ({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        email: emp.email || null,
        phone: emp.phone || null,
        department: emp.department || null,
        position: emp.position || null,
        hire_date: emp.hire_date ? new Date(emp.hire_date).toISOString().split('T')[0] : null,
        salary: emp.salary ? parseFloat(emp.salary) : null,
        plant_id: profile.plant_id,
        manager_id: profile.id,
        created_at: new Date().toISOString()
      }));
      
      // Check if this is a demo user
      const isDemoUser = profile.id.startsWith('demo-');
      
      if (isDemoUser) {
        // Save to localStorage for demo users
        const existingEmployees = JSON.parse(localStorage.getItem('demoEmployees') || '[]');
        const newEmployees = employeeRecords.map(emp => ({
          ...emp,
          id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        const updatedEmployees = [...existingEmployees, ...newEmployees];
        localStorage.setItem('demoEmployees', JSON.stringify(updatedEmployees));
      } else {
        // Save to Supabase for real users
        const { error } = await supabase
          .from('employees')
          .insert(employeeRecords);
        
        if (error) throw error;
      }
      
      onSuccess?.();
      setFile(null);
      setPreview([]);
      
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload employees';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview([]);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Import Employee Data</h3>
        {file && (
          <button
            onClick={resetUpload}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Upload CSV file</p>
            <p className="text-xs text-gray-500">
              CSV should include: employee_id, full_name, email, phone, department, position, hire_date, salary
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-gray-400">({preview.length} rows preview)</span>
          </div>
          
          {preview.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 border-b">
                Preview (first 5 rows)
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((emp, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-3 py-2">{emp.employee_id}</td>
                        <td className="px-3 py-2">{emp.full_name}</td>
                        <td className="px-3 py-2">{emp.email || '-'}</td>
                        <td className="px-3 py-2">{emp.department || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={uploading || preview.length === 0}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Import {preview.length} Employees</span>
                </>
              )}
            </button>
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
