-- Get Tulsi Sharma's ID and insert customers assigned to her
DO $$
DECLARE
  emp_id INT;
  admin_id INT;
BEGIN
  SELECT id INTO emp_id FROM "User" WHERE email = 'rahul@aucrm.com';
  SELECT id INTO admin_id FROM "User" WHERE email = 'admin@aucrm.com';

  INSERT INTO "Customer" (name, email, phone, company, address, notes, "userId", "createdAt", "updatedAt") VALUES
    ('Amit Khanna',      'amit@nexustech.in',     '+91-98765-10001', 'Nexus Tech Pvt Ltd',      'Sector 62, Noida, Uttar Pradesh',         'Interested in CRM integration',         emp_id,   NOW(), NOW()),
    ('Shalini Verma',    'shalini@brightedge.in', '+91-98765-10002', 'BrightEdge Analytics',    'Koramangala, Bengaluru, Karnataka',       'Analytics firm, high data volume',      emp_id,   NOW(), NOW()),
    ('Farhan Qureshi',   'farhan@swiftlog.in',    '+91-98765-10003', 'SwiftLog Solutions',      'MIDC, Pune, Maharashtra',                 'Logistics startup, 50+ vehicles',       emp_id,   NOW(), NOW()),
    ('Geeta Nair',       'geeta@sunrisehospital.in','+91-98765-10004','Sunrise Hospital Group', 'MG Road, Kochi, Kerala',                  'Hospital chain, 4 branches',            emp_id,   NOW(), NOW()),
    ('Harish Patel',     'harish@greenleaf.in',   '+91-98765-10005', 'GreenLeaf Organics',      'Satellite, Ahmedabad, Gujarat',           'Organic food brand, D2C model',         emp_id,   NOW(), NOW()),
    ('Ishita Banerjee',  'ishita@pixelcraft.in',  '+91-98765-10006', 'PixelCraft Studios',      'Park Street, Kolkata, West Bengal',       'Creative agency, 20 person team',       emp_id,   NOW(), NOW()),
    ('Jayesh Mehta',     'jayesh@infracore.in',   '+91-98765-10007', 'InfraCore Builders',      'Prahlad Nagar, Ahmedabad, Gujarat',       'Real estate developer, 3 projects',     admin_id, NOW(), NOW()),
    ('Kavya Subramaniam','kavya@edgelearn.in',    '+91-98765-10008', 'EdgeLearn Academy',       'T Nagar, Chennai, Tamil Nadu',            'Online education platform, 10k users',  admin_id, NOW(), NOW());
END $$;
