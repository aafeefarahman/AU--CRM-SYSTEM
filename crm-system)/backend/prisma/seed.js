require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Admin ──────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aucrm.com' },
    update: {},
    create: { email: 'admin@aucrm.com', password: adminPwd, name: 'Arjun Sharma', role: 'ADMIN' },
  });

  // ── Employees ──────────────────────────────────────────
  const employeeData = [
    { name: 'Rahul Mehta',     email: 'rahul@aucrm.com' },
    { name: 'Priya Iyer',      email: 'priya@aucrm.com' },
    { name: 'Sneha Reddy',     email: 'sneha@aucrm.com' },
    { name: 'Vikram Nair',     email: 'vikram@aucrm.com' },
    { name: 'Ananya Gupta',    email: 'ananya@aucrm.com' },
    { name: 'Karan Malhotra',  email: 'karan@aucrm.com' },
    { name: 'Divya Pillai',    email: 'divya@aucrm.com' },
    { name: 'Rohan Joshi',     email: 'rohan@aucrm.com' },
    { name: 'Meera Bose',      email: 'meera@aucrm.com' },
    { name: 'Aditya Verma',    email: 'aditya@aucrm.com' },
    { name: 'Pooja Desai',     email: 'pooja@aucrm.com' },
  ];

  const empPwd = await bcrypt.hash('Emp@123', 12);
  const employees = await Promise.all(
    employeeData.map((e) =>
      prisma.user.upsert({
        where: { email: e.email },
        update: {},
        create: { email: e.email, password: empPwd, name: e.name, role: 'EMPLOYEE' },
      })
    )
  );

  const [emp1, emp2, emp3, emp4, emp5] = employees;

  // ── Customers ──────────────────────────────────────────
  const customerData = [
    { name: 'Rajesh Kumar',    email: 'rajesh@technova.in',    phone: '+91-98201-11001', company: 'TechNova Solutions',    address: 'Whitefield, Bengaluru, Karnataka',      notes: 'Key enterprise client. Interested in ERP.',  userId: admin.id },
    { name: 'Sunita Agarwal',  email: 'sunita@finedge.in',     phone: '+91-98201-11002', company: 'FinEdge Pvt Ltd',        address: 'Bandra Kurla Complex, Mumbai, Maharashtra', notes: 'Fintech startup, high growth potential.',    userId: admin.id },
    { name: 'Manoj Tiwari',    email: 'manoj@healthplus.in',   phone: '+91-98201-11003', company: 'HealthPlus Clinics',     address: 'Connaught Place, New Delhi',            notes: 'Healthcare chain, 12 locations.',            userId: admin.id },
    { name: 'Kavitha Nambiar', email: 'kavitha@greenbuild.in', phone: '+91-98201-11004', company: 'GreenBuild Infra',       address: 'Jubilee Hills, Hyderabad, Telangana',   notes: 'Infrastructure firm, large project pipeline.', userId: emp1.id },
    { name: 'Deepak Singhania',email: 'deepak@retailmart.in',  phone: '+91-98201-11005', company: 'RetailMart India',       address: 'Anna Nagar, Chennai, Tamil Nadu',       notes: 'Retail chain with 30+ outlets.',             userId: emp1.id },
    { name: 'Nisha Kapoor',    email: 'nisha@eduspark.in',     phone: '+91-98201-11006', company: 'EduSpark Technologies',  address: 'Koregaon Park, Pune, Maharashtra',      notes: 'EdTech company, B2B focus.',                 userId: emp2.id },
    { name: 'Suresh Pillai',   email: 'suresh@logixpro.in',   phone: '+91-98201-11007', company: 'LogixPro Logistics',     address: 'Salt Lake, Kolkata, West Bengal',       notes: 'Logistics firm, pan-India operations.',      userId: emp2.id },
    { name: 'Anita Bhatt',     email: 'anita@agritech.in',    phone: '+91-98201-11008', company: 'AgriTech Ventures',      address: 'Navrangpura, Ahmedabad, Gujarat',       notes: 'AgriTech startup, Series A funded.',         userId: emp3.id },
    { name: 'Ravi Shankar',    email: 'ravi@mediapulse.in',   phone: '+91-98201-11009', company: 'MediaPulse Digital',     address: 'Indiranagar, Bengaluru, Karnataka',     notes: 'Digital media agency.',                     userId: emp3.id },
    { name: 'Lakshmi Menon',   email: 'lakshmi@cloudnine.in', phone: '+91-98201-11010', company: 'CloudNine Systems',      address: 'Hitech City, Hyderabad, Telangana',     notes: 'Cloud services provider.',                  userId: emp4.id },
  ];

  const customers = [];
  for (let i = 0; i < customerData.length; i++) {
    const c = await prisma.customer.upsert({
      where: { id: i + 1 },
      update: {},
      create: customerData[i],
    });
    customers.push(c);
  }

  // ── Leads ──────────────────────────────────────────────
  const leadData = [
    { title: 'ERP Implementation Suite',        value: 1500000, status: 'PROPOSAL',     source: 'Website',        customerId: customers[0].id, userId: admin.id },
    { title: 'Cloud Infrastructure Migration',  value: 3200000, status: 'NEGOTIATION',  source: 'Referral',       customerId: customers[0].id, userId: admin.id },
    { title: 'Payment Gateway Integration',     value: 450000,  status: 'WON',          source: 'Cold Call',      customerId: customers[1].id, userId: admin.id, closedAt: new Date() },
    { title: 'Hospital Management System',      value: 2800000, status: 'QUALIFIED',    source: 'Trade Show',     customerId: customers[2].id, userId: admin.id },
    { title: 'Smart Building Automation',       value: 5500000, status: 'NEW',          source: 'LinkedIn',       customerId: customers[3].id, userId: emp1.id },
    { title: 'Retail POS & Inventory System',   value: 750000,  status: 'CONTACTED',    source: 'Email Campaign', customerId: customers[4].id, userId: emp1.id },
    { title: 'LMS Platform Development',        value: 980000,  status: 'PROPOSAL',     source: 'Referral',       customerId: customers[5].id, userId: emp2.id },
    { title: 'Fleet Management Software',       value: 1200000, status: 'QUALIFIED',    source: 'Website',        customerId: customers[6].id, userId: emp2.id },
    { title: 'Precision Farming Dashboard',     value: 620000,  status: 'NEW',          source: 'Trade Show',     customerId: customers[7].id, userId: emp3.id },
    { title: 'OTT Streaming Platform',          value: 4100000, status: 'NEGOTIATION',  source: 'LinkedIn',       customerId: customers[8].id, userId: emp3.id },
  ];

  const leads = [];
  for (let i = 0; i < leadData.length; i++) {
    const l = await prisma.lead.upsert({
      where: { id: i + 1 },
      update: {},
      create: leadData[i],
    });
    leads.push(l);
  }

  // ── Activities ─────────────────────────────────────────
  const activityData = [
    { type: 'CALL',    subject: 'Initial requirements discussion',      notes: 'Discussed ERP modules needed. Budget approved at board level.',         customerId: customers[0].id, leadId: leads[0].id, userId: admin.id,  completedAt: new Date(Date.now() - 3 * 86400000) },
    { type: 'EMAIL',   subject: 'Sent detailed proposal document',      notes: 'Proposal includes 3 pricing tiers. Awaiting feedback.',                 customerId: customers[0].id, leadId: leads[0].id, userId: admin.id,  completedAt: new Date(Date.now() - 1 * 86400000) },
    { type: 'MEETING', subject: 'Product demo with technical team',     notes: 'Demo scheduled via Google Meet. CTO and 3 engineers attending.',        customerId: customers[1].id, leadId: leads[1].id, userId: admin.id,  dueAt: new Date(Date.now() + 2 * 86400000) },
    { type: 'NOTE',    subject: 'Client requested case studies',        notes: 'Need to share 2 healthcare and 1 fintech case study by Friday.',        customerId: customers[2].id, userId: admin.id,                       completedAt: new Date() },
    { type: 'TASK',    subject: 'Prepare MSA and SOW draft',            notes: 'Legal team to review before sending to client.',                        customerId: customers[3].id, leadId: leads[4].id, userId: emp1.id,   dueAt: new Date(Date.now() + 5 * 86400000) },
    { type: 'CALL',    subject: 'Follow-up on POS demo feedback',       notes: 'Client happy with demo. Wants custom reporting module added.',          customerId: customers[4].id, leadId: leads[5].id, userId: emp1.id,   completedAt: new Date(Date.now() - 2 * 86400000) },
    { type: 'EMAIL',   subject: 'LMS feature list confirmation',        notes: 'Confirmed 12 core features. Timeline set to 6 months.',                 customerId: customers[5].id, leadId: leads[6].id, userId: emp2.id,   completedAt: new Date(Date.now() - 1 * 86400000) },
    { type: 'MEETING', subject: 'Fleet software onboarding session',    notes: 'Onboarding 5 fleet managers. Training material prepared.',              customerId: customers[6].id, leadId: leads[7].id, userId: emp2.id,   dueAt: new Date(Date.now() + 3 * 86400000) },
    { type: 'TASK',    subject: 'AgriTech pilot deployment plan',       notes: 'Pilot for 3 districts in Gujarat. Coordinate with field team.',         customerId: customers[7].id, leadId: leads[8].id, userId: emp3.id,   dueAt: new Date(Date.now() + 7 * 86400000) },
    { type: 'CALL',    subject: 'OTT platform architecture review',     notes: 'Reviewed CDN strategy and encoding pipeline. Very technical call.',     customerId: customers[8].id, leadId: leads[9].id, userId: emp3.id,   completedAt: new Date(Date.now() - 4 * 86400000) },
  ];

  for (const a of activityData) {
    await prisma.activity.create({ data: a });
  }

  console.log('✅ Indian seed data created successfully');
  console.log('Admin:    admin@aucrm.com  / Admin@123');
  console.log('Employee: rahul@aucrm.com  / Emp@123  (and 10 more employees)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
