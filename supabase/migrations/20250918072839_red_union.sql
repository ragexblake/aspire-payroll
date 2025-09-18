@@ .. @@
 CREATE POLICY "Enable update for managers"
   ON employees
   FOR UPDATE
   TO authenticated
   USING (auth.uid() = manager_id);
+
+-- Insert sample employee data
+-- Note: This uses placeholder UUIDs - in production, use actual plant_id and manager_id values
+INSERT INTO employees (employee_id, full_name, email, phone, department, position, hire_date, salary, plant_id, manager_id) VALUES
+  ('EMP001', 'John Smith', 'john.smith@company.com', '(555) 123-4567', 'Production', 'Production Supervisor', '2023-01-15', 65000, 
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', '(555) 234-5678', 'Quality Control', 'QC Inspector', '2023-03-20', 55000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP003', 'Michael Brown', 'michael.brown@company.com', '(555) 345-6789', 'Production', 'Machine Operator', '2023-02-10', 45000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP004', 'Emily Davis', 'emily.davis@company.com', '(555) 456-7890', 'Maintenance', 'Maintenance Technician', '2023-04-05', 52000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP005', 'Robert Wilson', 'robert.wilson@company.com', '(555) 567-8901', 'Quality Control', 'QC Manager', '2022-11-15', 72000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP006', 'Lisa Anderson', 'lisa.anderson@company.com', '(555) 678-9012', 'Production', 'Assembly Worker', '2023-05-12', 42000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP007', 'David Martinez', 'david.martinez@company.com', '(555) 789-0123', 'Maintenance', 'Electrical Technician', '2023-01-30', 58000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1)),
+  
+  ('EMP008', 'Jennifer Taylor', 'jennifer.taylor@company.com', '(555) 890-1234', 'Production', 'Line Lead', '2022-12-08', 48000,
+   (SELECT id FROM plants LIMIT 1), 
+   (SELECT id FROM user_profiles WHERE role = 'manager' LIMIT 1));
+
+-- Add more sample employees for different managers if multiple exist
+INSERT INTO employees (employee_id, full_name, email, phone, department, position, hire_date, salary, plant_id, manager_id)
+SELECT 
+  'EMP' || LPAD((ROW_NUMBER() OVER() + 8)::text, 3, '0'),
+  CASE (ROW_NUMBER() OVER() % 6)
+    WHEN 1 THEN 'Alex Thompson'
+    WHEN 2 THEN 'Maria Garcia'
+    WHEN 3 THEN 'James Wilson'
+    WHEN 4 THEN 'Linda Chen'
+    WHEN 5 THEN 'Carlos Rodriguez'
+    ELSE 'Amanda White'
+  END,
+  CASE (ROW_NUMBER() OVER() % 6)
+    WHEN 1 THEN 'alex.thompson@company.com'
+    WHEN 2 THEN 'maria.garcia@company.com'
+    WHEN 3 THEN 'james.wilson@company.com'
+    WHEN 4 THEN 'linda.chen@company.com'
+    WHEN 5 THEN 'carlos.rodriguez@company.com'
+    ELSE 'amanda.white@company.com'
+  END,
+  '(555) ' || LPAD((900 + ROW_NUMBER() OVER())::text, 3, '0') || '-' || LPAD((1000 + ROW_NUMBER() OVER())::text, 4, '0'),
+  CASE (ROW_NUMBER() OVER() % 4)
+    WHEN 1 THEN 'Production'
+    WHEN 2 THEN 'Quality Control'
+    WHEN 3 THEN 'Maintenance'
+    ELSE 'Administration'
+  END,
+  CASE (ROW_NUMBER() OVER() % 4)
+    WHEN 1 THEN 'Production Worker'
+    WHEN 2 THEN 'Quality Inspector'
+    WHEN 3 THEN 'Maintenance Worker'
+    ELSE 'Administrative Assistant'
+  END,
+  '2023-' || LPAD((ROW_NUMBER() OVER() % 12 + 1)::text, 2, '0') || '-' || LPAD((ROW_NUMBER() OVER() % 28 + 1)::text, 2, '0'),
+  40000 + (ROW_NUMBER() OVER() % 5) * 5000,
+  p.id,
+  m.id
+FROM 
+  plants p,
+  user_profiles m
+WHERE 
+  m.role = 'manager' 
+  AND m.plant_id = p.id
+  AND (SELECT COUNT(*) FROM user_profiles WHERE role = 'manager') > 1
+LIMIT 12;