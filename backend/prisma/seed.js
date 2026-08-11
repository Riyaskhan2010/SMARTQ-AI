// SmartQ AI - Database Seed
// Demo data for Chennai hackathon prototype

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SmartQ AI database...');

  // ── Clean existing data ──────────────────────────────────────
  await prisma.recommendation.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.visitHistory.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.token.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.counterService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.department.deleteMany();
  // Canteen cleanup
  await prisma.canteenOrderItem.deleteMany();
  await prisma.canteenOrder.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.canteenCounter.deleteMany();
  await prisma.canteenOrg.deleteMany();
  //
  await prisma.organization.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleaned existing data');

  // ── Sectors ──────────────────────────────────────────────────
  const sectors = await Promise.all([
    prisma.sector.create({ data: { id: uuidv4(), name: 'Hospital', slug: 'hospital', icon: 'hospital', description: 'Medical and healthcare services' } }),
    prisma.sector.create({ data: { id: uuidv4(), name: 'College', slug: 'college', icon: 'graduation-cap', description: 'Educational institution services' } }),
    prisma.sector.create({ data: { id: uuidv4(), name: 'Government Office', slug: 'government', icon: 'landmark', description: 'Government and civic services' } }),
    prisma.sector.create({ data: { id: uuidv4(), name: 'Bank', slug: 'bank', icon: 'banknote', description: 'Banking and financial services' } }),
    prisma.sector.create({ data: { id: uuidv4(), name: 'Post Office', slug: 'post', icon: 'mail', description: 'Postal and financial services' } }),
  ]);
  const [hospitalSector, collegeSector, govSector, bankSector, postSector] = sectors;
  console.log('  ✓ Sectors created');

  // ── Users ────────────────────────────────────────────────────
  const hash = (p) => bcrypt.hashSync(p, 10);

  const demoUser = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Demo User', email: 'demo.user@smartq.ai',
    phone: '+91 98765 43210', passwordHash: hash('demo123'),
    role: 'USER', language: 'en', isDemo: true
  }});
  const demoAdmin = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Demo Admin', email: 'demo.admin@smartq.ai',
    phone: '+91 98765 43211', passwordHash: hash('demo123'),
    role: 'ADMIN', language: 'en', isDemo: true
  }});
  const demoStaff1 = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Staff - Counter 1', email: 'demo.staff@smartq.ai',
    phone: '+91 98765 43212', passwordHash: hash('demo123'),
    role: 'STAFF', language: 'en', isDemo: true
  }});
  const demoStaff2 = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Staff - Counter 2', email: 'staff2@smartq.ai',
    phone: '+91 98765 43213', passwordHash: hash('demo123'),
    role: 'STAFF', language: 'en', isDemo: true
  }});
  const demoStaff3 = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Staff - Counter 3', email: 'staff3@smartq.ai',
    phone: '+91 98765 43214', passwordHash: hash('demo123'),
    role: 'STAFF', language: 'en', isDemo: true
  }});
  const regularUser = await prisma.user.create({ data: {
    id: uuidv4(), name: 'Arun Kumar', email: 'arun@example.com',
    phone: '+91 99001 23456', passwordHash: hash('pass123'),
    role: 'USER', language: 'en'
  }});
  console.log('  ✓ Users created');

  // ── Organizations (Chennai Demo) ──────────────────────────────
  const govHosp = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Rajiv Gandhi Government General Hospital',
    shortName: 'RGGGH', sectorId: hospitalSector.id,
    address: 'Park Town, Chennai - 600003',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600003',
    phone: '044-2530 5000', email: 'info@rgggh.tn.gov.in',
    latitude: 13.0799, longitude: 80.2740,
    description: 'Premier government hospital in Chennai providing free medical services.',
    isDemo: true, openTime: '08:00', closeTime: '20:00'
  }});

  const privHosp = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Apollo Hospitals Chennai',
    shortName: 'Apollo', sectorId: hospitalSector.id,
    address: '21, Greams Lane, Off Greams Road, Chennai - 600006',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600006',
    phone: '044-2829 3333', email: 'info@apollohospitals.com',
    latitude: 13.0569, longitude: 80.2425,
    description: 'Leading private multi-specialty hospital.',
    isDemo: true, openTime: '24:00', closeTime: '24:00'
  }});

  const passportOffice = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Regional Passport Office Chennai',
    shortName: 'RPO Chennai', sectorId: govSector.id,
    address: 'Shastri Bhavan, 26, Haddows Road, Chennai - 600006',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600006',
    phone: '044-2827 5131',
    latitude: 13.0604, longitude: 80.2495,
    description: 'Official passport services for Tamil Nadu region.',
    isDemo: true, openTime: '09:30', closeTime: '17:00'
  }});

  const rtoOffice = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Regional Transport Office - Chennai (Central)',
    shortName: 'RTO Central', sectorId: govSector.id,
    address: 'Ezhilagam, Chepauk, Chennai - 600005',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600005',
    phone: '044-2536 0871',
    latitude: 13.0620, longitude: 80.2788,
    description: 'Vehicle registration and driving license services.',
    isDemo: true, openTime: '09:00', closeTime: '17:30'
  }});

  const collectorate = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Chennai District Collectorate',
    shortName: 'Collectorate', sectorId: govSector.id,
    address: 'Rajaji Salai, Chennai - 600001',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600001',
    phone: '044-2539 3333',
    latitude: 13.0839, longitude: 80.2833,
    description: 'District administration and citizen services.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  const postOffice = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Chennai GPO (General Post Office)',
    shortName: 'Chennai GPO', sectorId: postSector.id,
    address: 'Rajaji Salai, Chennai - 600001',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600001',
    phone: '044-2534 8370',
    latitude: 13.0828, longitude: 80.2786,
    description: 'General postal services and financial services.',
    isDemo: true, openTime: '08:00', closeTime: '20:00'
  }});

  const college = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Anna University Chennai',
    shortName: 'Anna University', sectorId: collegeSector.id,
    address: 'Sardar Patel Road, Guindy, Chennai - 600025',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600025',
    phone: '044-2235 7004',
    latitude: 13.0080, longitude: 80.2359,
    description: 'Premier technical university in Tamil Nadu.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  const bank = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'State Bank of India - Anna Salai Branch',
    shortName: 'SBI Anna Salai', sectorId: bankSector.id,
    address: '84, Anna Salai, Chennai - 600002',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600002',
    phone: '044-2852 3416',
    latitude: 13.0676, longitude: 80.2617,
    description: 'Full-service SBI branch for retail and corporate banking.',
    isDemo: true, openTime: '10:00', closeTime: '16:00'
  }});

  // ── Additional colleges for staff demo ────────────────────────
  const srmCollege = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'SRM Institute of Science and Technology',
    shortName: 'SRM College', sectorId: collegeSector.id,
    address: 'SRM Nagar, Kattankulathur, Chennai - 603203',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '603203',
    phone: '044-2745 5510',
    latitude: 12.8231, longitude: 80.0444,
    description: 'Leading deemed university with multiple campuses.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  const velTech = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute',
    shortName: 'Vel Tech University', sectorId: collegeSector.id,
    address: 'No. 42, Avadi-Vel Tech Road, Chennai - 600062',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600062',
    phone: '044-2684 0802',
    latitude: 13.1308, longitude: 80.0878,
    description: 'Technical university focused on research and innovation.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  const crescent = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'B.S. Abdur Rahman Crescent Institute of Science & Technology',
    shortName: 'Crescent University', sectorId: collegeSector.id,
    address: 'Seethakathi Estate, GST Road, Chennai - 600048',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600048',
    phone: '044-2275 0301',
    latitude: 12.9259, longitude: 80.1371,
    description: 'Deemed university offering engineering and management programs.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  // ── VAO Office ────────────────────────────────────────────────
  const vaoOffice = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Village Administrative Office - Mylapore',
    shortName: 'VAO Mylapore', sectorId: govSector.id,
    address: 'Mylapore, Chennai - 600004',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600004',
    phone: '044-2498 0001',
    latitude: 13.0336, longitude: 80.2673,
    description: 'Village-level administrative services and certificates.',
    isDemo: true, openTime: '09:00', closeTime: '17:00'
  }});

  // ── Chennai Bank Demo ─────────────────────────────────────────
  const bankDemo = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Chennai Demo Bank - T Nagar Branch',
    shortName: 'Chennai Bank Demo', sectorId: bankSector.id,
    address: '24, Usman Road, T. Nagar, Chennai - 600017',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600017',
    phone: '044-2434 0001',
    latitude: 13.0418, longitude: 80.2341,
    description: 'Full-service retail banking branch. [DEMO]',
    isDemo: true, openTime: '10:00', closeTime: '16:00'
  }});

  // ── Chennai Central Post Office ───────────────────────────────
  const postCentral = await prisma.organization.create({ data: {
    id: uuidv4(), name: 'Chennai Central Post Office',
    shortName: 'Chennai Central PO', sectorId: postSector.id,
    address: 'Anna Salai, Chennai - 600002',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600002',
    phone: '044-2852 0001',
    latitude: 13.0826, longitude: 80.2750,
    description: 'Main post office serving central Chennai.',
    isDemo: true, openTime: '08:00', closeTime: '20:00'
  }});

  console.log('  ✓ Organizations created');

  // ── Departments ───────────────────────────────────────────────
  const govHospOP = await prisma.department.create({ data: { id: uuidv4(), organizationId: govHosp.id, name: 'Outpatient Department (OPD)', description: 'General outpatient services' } });
  const govHospLab = await prisma.department.create({ data: { id: uuidv4(), organizationId: govHosp.id, name: 'Laboratory Services', description: 'Blood tests and diagnostics' } });
  const privHospConsult = await prisma.department.create({ data: { id: uuidv4(), organizationId: privHosp.id, name: 'Consultation', description: 'Specialist consultations' } });
  const privHospRegistration = await prisma.department.create({ data: { id: uuidv4(), organizationId: privHosp.id, name: 'Registration & Billing', description: 'New patient registration' } });
  const passportDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: passportOffice.id, name: 'Passport Services', description: 'New, renewal, tatkal applications' } });
  const rtoDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: rtoOffice.id, name: 'Driving License', description: 'DL and learner license services' } });
  const rtoVehicleDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: rtoOffice.id, name: 'Vehicle Registration', description: 'New registration and transfer' } });
  const collectorateDept     = await prisma.department.create({ data: { id: uuidv4(), organizationId: collectorate.id, name: 'Revenue Services', description: 'Income, caste, residence certificates' } });
  const collectorateLand     = await prisma.department.create({ data: { id: uuidv4(), organizationId: collectorate.id, name: 'Land Services', description: 'Patta, chitta, land document enquiry' } });
  const collectorateCivil    = await prisma.department.create({ data: { id: uuidv4(), organizationId: collectorate.id, name: 'Civil Registration', description: 'Birth, death, legal heir certificates' } });
  const collectoratePublic   = await prisma.department.create({ data: { id: uuidv4(), organizationId: collectorate.id, name: 'Public Services', description: 'Grievances, petitions, application status' } });
  const postOfficeFinance = await prisma.department.create({ data: { id: uuidv4(), organizationId: postOffice.id, name: 'Postal & Financial Services', description: 'Parcel, money order, savings' } });
  const collegeAdmin = await prisma.department.create({ data: { id: uuidv4(), organizationId: college.id, name: 'Admission Office', description: 'Admissions and enrollment' } });
  const collegeExam = await prisma.department.create({ data: { id: uuidv4(), organizationId: college.id, name: 'Exam Cell', description: 'Exam schedules, hall tickets' } });
  const bankDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: bank.id, name: 'General Banking', description: 'Account operations and loans' } });

  // New college departments
  const srmAdmission = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Admission Office', description: 'Admissions, enrollment, fees' } });
  const srmFees      = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Fees & Accounts', description: 'Fee payment, receipts and scholarships' } });
  const srmExam      = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Exam Cell', description: 'Exam registration, hall tickets, results' } });
  const srmCerts     = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Certificates', description: 'Bonafide, TC, completion, study certificates' } });
  const srmCanteen   = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Canteen', description: 'Food ordering — SmartQ Canteen' } });
  const srmStudents  = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Student Services', description: 'ID card, hostel, transport, records' } });
  const srmPlacement = await prisma.department.create({ data: { id: uuidv4(), organizationId: srmCollege.id, name: 'Placement Cell', description: 'Placement registration, internship verification' } });

  const vtAdmission  = await prisma.department.create({ data: { id: uuidv4(), organizationId: velTech.id, name: 'Admission Office', description: 'Admissions and counselling' } });
  const vtFees       = await prisma.department.create({ data: { id: uuidv4(), organizationId: velTech.id, name: 'Fees & Accounts', description: 'Fee payment and receipts' } });
  const vtStudents   = await prisma.department.create({ data: { id: uuidv4(), organizationId: velTech.id, name: 'Student Affairs', description: 'Student welfare and support' } });
  const vtExam       = await prisma.department.create({ data: { id: uuidv4(), organizationId: velTech.id, name: 'Exam Cell', description: 'Hall tickets and results' } });
  const vtCerts      = await prisma.department.create({ data: { id: uuidv4(), organizationId: velTech.id, name: 'Certificates', description: 'Bonafide, TC, study certificates' } });

  const crescentAdm  = await prisma.department.create({ data: { id: uuidv4(), organizationId: crescent.id, name: 'Admission Office', description: 'Admissions and enrollment' } });
  const crescentFees = await prisma.department.create({ data: { id: uuidv4(), organizationId: crescent.id, name: 'Fees & Accounts', description: 'Fee payment and scholarship' } });
  const crescentExam = await prisma.department.create({ data: { id: uuidv4(), organizationId: crescent.id, name: 'Exam Cell', description: 'Exam hall tickets and certificates' } });
  const crescentCerts= await prisma.department.create({ data: { id: uuidv4(), organizationId: crescent.id, name: 'Certificates', description: 'Bonafide and other certificates' } });
  const crescentStudents = await prisma.department.create({ data: { id: uuidv4(), organizationId: crescent.id, name: 'Student Services', description: 'ID card, hostel and transport' } });

  // VAO departments
  const vaoDept      = await prisma.department.create({ data: { id: uuidv4(), organizationId: vaoOffice.id, name: 'Revenue Services', description: 'Income, caste, residence certs' } });
  const vaoLand      = await prisma.department.create({ data: { id: uuidv4(), organizationId: vaoOffice.id, name: 'Land & Property', description: 'Chitta, adangal, land enquiries' } });

  // Chennai Bank Demo departments
  const bankDemoDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: bankDemo.id, name: 'General Banking', description: 'Account, cash, loans' } });
  const bankDemoLoan = await prisma.department.create({ data: { id: uuidv4(), organizationId: bankDemo.id, name: 'Loan Services', description: 'Home, personal, vehicle loans' } });

  // Central Post Office departments
  const postCentralDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: postCentral.id, name: 'Postal Services', description: 'Parcel, speed post, registered post' } });
  const postCentralFin  = await prisma.department.create({ data: { id: uuidv4(), organizationId: postCentral.id, name: 'Financial Services', description: 'Savings, money order, insurance' } });

  console.log('  ✓ Departments created');

  // ── Services ──────────────────────────────────────────────────
  const svcGeneralOP = await prisma.service.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'General OP', description: 'General outpatient consultation', avgServiceTime: 8, maxTokensPerDay: 300, fee: null } });
  const svcFollowUp  = await prisma.service.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Follow-up / Monthly Check-up', description: 'Follow-up for existing patients', avgServiceTime: 5, maxTokensPerDay: 150, fee: null } });
  const svcLab       = await prisma.service.create({ data: { id: uuidv4(), departmentId: govHospLab.id, name: 'Lab Sample Collection', description: 'Blood, urine, and other samples', avgServiceTime: 4, maxTokensPerDay: 200, fee: null } });
  const svcPrivNew   = await prisma.service.create({ data: { id: uuidv4(), departmentId: privHospConsult.id, name: 'New Patient Consultation', description: 'First-time specialist consultation', avgServiceTime: 15, maxTokensPerDay: 80, fee: 500.0 } });
  const svcPrivFU    = await prisma.service.create({ data: { id: uuidv4(), departmentId: privHospConsult.id, name: 'Follow-up Consultation', description: 'Follow-up with specialist', avgServiceTime: 10, maxTokensPerDay: 60, fee: 250.0 } });
  const svcPrivReg   = await prisma.service.create({ data: { id: uuidv4(), departmentId: privHospRegistration.id, name: 'Patient Registration', description: 'New patient registration and ID', avgServiceTime: 8, maxTokensPerDay: 100, fee: 100.0 } });
  const svcPassNew   = await prisma.service.create({ data: { id: uuidv4(), departmentId: passportDept.id, name: 'New Passport', description: 'Fresh passport application', avgServiceTime: 20, maxTokensPerDay: 50, fee: null } });
  const svcPassRenew = await prisma.service.create({ data: { id: uuidv4(), departmentId: passportDept.id, name: 'Passport Renewal', description: 'Renew expiring passport', avgServiceTime: 15, maxTokensPerDay: 60, fee: null } });
  const svcPassTatkal= await prisma.service.create({ data: { id: uuidv4(), departmentId: passportDept.id, name: 'Tatkal Passport', description: 'Urgent passport application', avgServiceTime: 20, maxTokensPerDay: 20, fee: null } });
  const svcDLNew     = await prisma.service.create({ data: { id: uuidv4(), departmentId: rtoDept.id, name: 'New Driving License', description: 'New DL application', avgServiceTime: 20, maxTokensPerDay: 60, fee: null } });
  const svcDLRenew   = await prisma.service.create({ data: { id: uuidv4(), departmentId: rtoDept.id, name: 'DL Renewal', description: 'Renew expired DL', avgServiceTime: 15, maxTokensPerDay: 80, fee: null } });
  const svcVehicle   = await prisma.service.create({ data: { id: uuidv4(), departmentId: rtoVehicleDept.id, name: 'Vehicle Registration', description: 'New vehicle registration', avgServiceTime: 25, maxTokensPerDay: 40, fee: null } });
  // Collectorate — Revenue, Land, Civil Registration, Public Services
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Income Certificate',     description: 'Annual income certificate',                 avgServiceTime: 10, maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Community Certificate',  description: 'Caste/community certificate',               avgServiceTime: 10, maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Nativity Certificate',   description: 'Nativity/place of origin certificate',     avgServiceTime: 10, maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Residence Certificate',  description: 'Residence address certificate',            avgServiceTime: 8,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateLand.id, name: 'Patta Transfer',         description: 'Transfer of land patta ownership',         avgServiceTime: 20, maxTokensPerDay: 30 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateLand.id, name: 'Land Document Enquiry',  description: 'Land record enquiry and verification',     avgServiceTime: 15, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateLand.id, name: 'Chitta / Adangal',       description: 'Land ownership records',                   avgServiceTime: 12, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateLand.id, name: 'Property Enquiry',       description: 'General property-related queries',         avgServiceTime: 12, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateCivil.id, name: 'Birth Certificate',     description: 'Apply for birth certificate',              avgServiceTime: 10, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateCivil.id, name: 'Death Certificate',     description: 'Apply for death certificate',              avgServiceTime: 10, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateCivil.id, name: 'Legal Heir Certificate',description: 'Certificate for legal heir status',        avgServiceTime: 15, maxTokensPerDay: 30 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectoratePublic.id, name: 'Grievance / Petition', description: 'Submit public grievance or petition',      avgServiceTime: 15, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectoratePublic.id, name: 'Application Status',   description: 'Check status of submitted application',   avgServiceTime: 6,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: collectoratePublic.id, name: 'Document Submission',  description: 'Submit documents for various services',   avgServiceTime: 8,  maxTokensPerDay: 60 } });
  const svcPostParcel= await prisma.service.create({ data: { id: uuidv4(), departmentId: postOfficeFinance.id, name: 'Parcel / Speed Post', description: 'Send parcels and speed post', avgServiceTime: 5, maxTokensPerDay: 200, fee: null } });
  const svcPostSavings=await prisma.service.create({ data: { id: uuidv4(), departmentId: postOfficeFinance.id, name: 'Savings Account', description: 'Post office savings services', avgServiceTime: 10, maxTokensPerDay: 80, fee: null } });
  const svcAdmission = await prisma.service.create({ data: { id: uuidv4(), departmentId: collegeAdmin.id, name: 'Admission Enquiry', description: 'Course and admission information', avgServiceTime: 12, maxTokensPerDay: 60, fee: null } });
  const svcExamHall  = await prisma.service.create({ data: { id: uuidv4(), departmentId: collegeExam.id, name: 'Hall Ticket Collection', description: 'Collect exam hall tickets', avgServiceTime: 4, maxTokensPerDay: 200, fee: null } });
  const svcBankAcct  = await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Account Services', description: 'Deposits, withdrawals, account queries', avgServiceTime: 8, maxTokensPerDay: 150, fee: null } });
  const svcBankLoan  = await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Loan Services', description: 'Home, personal, vehicle loans', avgServiceTime: 20, maxTokensPerDay: 30, fee: null } });

  // SRM services — full spec
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Admission Enquiry',        description: 'Course info and admission queries',     avgServiceTime: 12, maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Document Submission',      description: 'Submit admission documents',             avgServiceTime: 10, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Course / Dept Enquiry',    description: 'Course and department information',      avgServiceTime: 8,  maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Application Status',       description: 'Check admission application status',     avgServiceTime: 6,  maxTokensPerDay: 120 } });

  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmFees.id, name: 'Fee Payment',                   description: 'Pay semester fees',                      avgServiceTime: 8,  maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmFees.id, name: 'Fee Receipt',                   description: 'Collect fee receipt',                    avgServiceTime: 5,  maxTokensPerDay: 120 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmFees.id, name: 'Scholarship / Concession',      description: 'Apply or enquire about scholarships',    avgServiceTime: 12, maxTokensPerDay: 40 } });

  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmExam.id, name: 'Hall Ticket Collection',        description: 'Collect exam hall tickets',              avgServiceTime: 4,  maxTokensPerDay: 200 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmExam.id, name: 'Exam Registration',             description: 'Register for upcoming exams',            avgServiceTime: 8,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmExam.id, name: 'Exam Enquiry',                  description: 'Exam schedule and result queries',        avgServiceTime: 6,  maxTokensPerDay: 100 } });

  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmCerts.id, name: 'Bonafide Certificate',         description: 'Student bonafide certificate',           avgServiceTime: 6,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmCerts.id, name: 'Transfer Certificate',         description: 'TC for college transfer',                avgServiceTime: 8,  maxTokensPerDay: 30 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmCerts.id, name: 'Course Completion Certificate',description: 'Degree completion certificate',          avgServiceTime: 10, maxTokensPerDay: 20 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmCerts.id, name: 'Study Certificate',            description: 'Certificate of study / enrollment',      avgServiceTime: 6,  maxTokensPerDay: 60 } });

  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmStudents.id, name: 'ID Card',                   description: 'New or duplicate student ID card',       avgServiceTime: 5,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmStudents.id, name: 'Hostel Enquiry',             description: 'Hostel allocation and queries',          avgServiceTime: 10, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmStudents.id, name: 'Transport / Bus Pass',       description: 'College transport and bus pass',         avgServiceTime: 8,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmStudents.id, name: 'Student Record Update',      description: 'Update personal or academic record',     avgServiceTime: 10, maxTokensPerDay: 40 } });

  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmPlacement.id, name: 'Placement Registration',   description: 'Register for campus placement',          avgServiceTime: 12, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmPlacement.id, name: 'Placement Enquiry',        description: 'Placement drives and company info',      avgServiceTime: 8,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: srmPlacement.id, name: 'Internship Verification',  description: 'Verify and submit internship documents', avgServiceTime: 10, maxTokensPerDay: 40 } });

  // Vel Tech services
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtAdmission.id, name: 'Admission Enquiry',        description: 'Admissions and counselling info',         avgServiceTime: 12, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtAdmission.id, name: 'Document Submission',      description: 'Submit admission documents',              avgServiceTime: 10, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtAdmission.id, name: 'Application Status',       description: 'Check admission application status',      avgServiceTime: 6,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtFees.id,      name: 'Fee Payment',              description: 'Pay semester fees',                       avgServiceTime: 8,  maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtFees.id,      name: 'Scholarship Enquiry',      description: 'Scholarship and concession info',         avgServiceTime: 10, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtStudents.id,  name: 'Student Support',          description: 'General student welfare queries',          avgServiceTime: 10, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtStudents.id,  name: 'ID Card',                  description: 'Student ID card issuance',                avgServiceTime: 5,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtStudents.id,  name: 'Hostel Enquiry',           description: 'Hostel allocation and queries',            avgServiceTime: 10, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtExam.id,      name: 'Hall Ticket Collection',   description: 'Collect exam hall ticket',                avgServiceTime: 4,  maxTokensPerDay: 150 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtExam.id,      name: 'Exam Registration',        description: 'Register for upcoming exams',             avgServiceTime: 8,  maxTokensPerDay: 70 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtCerts.id,     name: 'Bonafide Certificate',     description: 'Student bonafide certificate',            avgServiceTime: 6,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtCerts.id,     name: 'Transfer Certificate',     description: 'TC for college transfer',                 avgServiceTime: 8,  maxTokensPerDay: 20 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vtCerts.id,     name: 'Study Certificate',        description: 'Certificate of study / enrollment',       avgServiceTime: 6,  maxTokensPerDay: 50 } });

  // Crescent services
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentAdm.id,       name: 'Admission Enquiry',     description: 'Course and admission information',    avgServiceTime: 12, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentAdm.id,       name: 'Document Submission',   description: 'Submit admission documents',          avgServiceTime: 10, maxTokensPerDay: 40 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentFees.id,      name: 'Fee Payment',           description: 'Pay semester fees',                   avgServiceTime: 8,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentFees.id,      name: 'Scholarship Enquiry',   description: 'Scholarship and concession info',     avgServiceTime: 10, maxTokensPerDay: 30 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentExam.id,      name: 'Hall Ticket Collection',description: 'Collect exam hall tickets',           avgServiceTime: 4,  maxTokensPerDay: 150 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentExam.id,      name: 'Exam Registration',     description: 'Register for upcoming exams',         avgServiceTime: 8,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentCerts.id,     name: 'Bonafide Certificate',  description: 'Student bonafide certificate',        avgServiceTime: 6,  maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentCerts.id,     name: 'Transfer Certificate',  description: 'TC for college transfer',             avgServiceTime: 8,  maxTokensPerDay: 20 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentStudents.id,  name: 'ID Card',               description: 'Student ID card issuance',            avgServiceTime: 5,  maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentStudents.id,  name: 'Hostel Enquiry',        description: 'Hostel allocation queries',           avgServiceTime: 10, maxTokensPerDay: 30 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: crescentStudents.id,  name: 'Transport / Bus Pass',  description: 'College transport enquiry',           avgServiceTime: 8,  maxTokensPerDay: 40 } });

  // VAO services — Revenue + Land
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoDept.id, name: 'Income Certificate',      description: 'Annual income certificate',             avgServiceTime: 10, maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoDept.id, name: 'Community Certificate',   description: 'Caste/community certificate',           avgServiceTime: 10, maxTokensPerDay: 80 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoDept.id, name: 'Nativity Certificate',    description: 'Place of birth/nativity certificate',   avgServiceTime: 10, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoDept.id, name: 'Residence Certificate',   description: 'Address/residence certificate',         avgServiceTime: 8,  maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoLand.id, name: 'Chitta / Adangal',        description: 'Land ownership document service',       avgServiceTime: 12, maxTokensPerDay: 50 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: vaoLand.id, name: 'Land Document Enquiry',   description: 'Land record enquiry and verification',  avgServiceTime: 15, maxTokensPerDay: 40 } });

  // Chennai Bank Demo services
  await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Account Enquiry', description: 'Balance, statement, account queries', avgServiceTime: 8, maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Cash Services', description: 'Deposits and withdrawals', avgServiceTime: 6, maxTokensPerDay: 120 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Customer Support', description: 'General banking support', avgServiceTime: 10, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDemoLoan.id, name: 'Loan Enquiry', description: 'Home, personal, vehicle loan info', avgServiceTime: 20, maxTokensPerDay: 30 } });

  // Central Post Office services
  await prisma.service.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Parcel / Speed Post', description: 'Send parcels and speed post', avgServiceTime: 5, maxTokensPerDay: 200 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Registered Post', description: 'Send registered mail', avgServiceTime: 5, maxTokensPerDay: 150 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Customer Enquiry', description: 'Track and general queries', avgServiceTime: 5, maxTokensPerDay: 100 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: postCentralFin.id,  name: 'Savings Account', description: 'Post office savings', avgServiceTime: 10, maxTokensPerDay: 60 } });
  await prisma.service.create({ data: { id: uuidv4(), departmentId: postCentralFin.id,  name: 'Money Order', description: 'Send and receive money orders', avgServiceTime: 7, maxTokensPerDay: 80 } });

  console.log('  ✓ Services created');

  // ── Counters for Gov Hospital OPD ─────────────────────────────
  const ctr1 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  const ctr2 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  const ctr3 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Counter 3', number: 3, status: 'OPEN' } });
  const ctr4 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Counter 4', number: 4, status: 'CLOSED' } });
  const ctr5 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospOP.id, name: 'Counter 5', number: 5, status: 'CLOSED' } });

  // Lab counters
  const ctrLab1 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospLab.id, name: 'Lab Counter 1', number: 1, status: 'OPEN' } });
  const ctrLab2 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: govHospLab.id, name: 'Lab Counter 2', number: 2, status: 'OPEN' } });

  // Private hospital counters
  const ctrPriv1 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: privHospConsult.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  const ctrPriv2 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: privHospConsult.id, name: 'Counter 2', number: 2, status: 'OPEN' } });

  // Passport counters
  const ctrPass1 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: passportDept.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  const ctrPass2 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: passportDept.id, name: 'Counter 2', number: 2, status: 'OPEN' } });

  // Bank counters
  const ctrBank1 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  const ctrBank2 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  const ctrBank3 = await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Counter 3', number: 3, status: 'CLOSED' } });

  // SRM College counters — all departments
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmAdmission.id, name: 'Counter 3', number: 3, status: 'CLOSED' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmFees.id,      name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmFees.id,      name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmExam.id,      name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmExam.id,      name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmCerts.id,     name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmStudents.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmStudents.id,  name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: srmPlacement.id, name: 'Counter 1', number: 1, status: 'OPEN' } });

  // Vel Tech counters
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtAdmission.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtAdmission.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtFees.id,      name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtStudents.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtExam.id,      name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vtCerts.id,     name: 'Counter 1', number: 1, status: 'OPEN' } });

  // Crescent counters
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: crescentAdm.id,      name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: crescentFees.id,     name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: crescentExam.id,     name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: crescentCerts.id,    name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: crescentStudents.id, name: 'Counter 1', number: 1, status: 'OPEN' } });

  // VAO counters — Revenue + Land
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vaoDept.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vaoDept.id,  name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: vaoLand.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });

  // Collectorate counters — all 4 departments
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: collectorateDept.id,   name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: collectorateDept.id,   name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: collectorateLand.id,   name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: collectorateCivil.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: collectoratePublic.id, name: 'Counter 1', number: 1, status: 'OPEN' } });

  // Chennai Bank Demo counters
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDemoDept.id, name: 'Counter 3', number: 3, status: 'CLOSED' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: bankDemoLoan.id, name: 'Counter 1', number: 1, status: 'OPEN' } });

  // Central Post Office counters
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Counter 1', number: 1, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Counter 2', number: 2, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: postCentralDept.id, name: 'Counter 3', number: 3, status: 'OPEN' } });
  await prisma.counter.create({ data: { id: uuidv4(), departmentId: postCentralFin.id,  name: 'Counter 1', number: 1, status: 'OPEN' } });

  console.log('  ✓ Counters created');

  // ── Counter–Service Mappings ──────────────────────────────────
  await prisma.counterService.createMany({ data: [
    { counterId: ctr1.id, serviceId: svcGeneralOP.id },
    { counterId: ctr1.id, serviceId: svcFollowUp.id },
    { counterId: ctr2.id, serviceId: svcGeneralOP.id },
    { counterId: ctr2.id, serviceId: svcFollowUp.id },
    { counterId: ctr3.id, serviceId: svcGeneralOP.id },
    { counterId: ctr3.id, serviceId: svcFollowUp.id },
    { counterId: ctr4.id, serviceId: svcGeneralOP.id },
    { counterId: ctr5.id, serviceId: svcGeneralOP.id },
    { counterId: ctrLab1.id, serviceId: svcLab.id },
    { counterId: ctrLab2.id, serviceId: svcLab.id },
    { counterId: ctrPriv1.id, serviceId: svcPrivNew.id },
    { counterId: ctrPriv1.id, serviceId: svcPrivFU.id },
    { counterId: ctrPriv2.id, serviceId: svcPrivNew.id },
    { counterId: ctrPriv2.id, serviceId: svcPrivFU.id },
    { counterId: ctrPass1.id, serviceId: svcPassNew.id },
    { counterId: ctrPass1.id, serviceId: svcPassRenew.id },
    { counterId: ctrPass2.id, serviceId: svcPassTatkal.id },
    { counterId: ctrBank1.id, serviceId: svcBankAcct.id },
    { counterId: ctrBank2.id, serviceId: svcBankAcct.id },
    { counterId: ctrBank3.id, serviceId: svcBankLoan.id },
  ]});
  console.log('  ✓ Counter-service mappings created');

  // ── Staff ─────────────────────────────────────────────────────
  // ── Staff — no counter pre-assigned; staff selects via the setup flow ─
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff1.id, organizationId: govHosp.id, counterId: null, employeeId: 'EMP001', designation: 'Registration Clerk' } });
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff2.id, organizationId: govHosp.id, counterId: null, employeeId: 'EMP002', designation: 'Registration Clerk' } });
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff3.id, organizationId: govHosp.id, counterId: null, employeeId: 'EMP003', designation: 'Registration Clerk' } });
  console.log('  ✓ Staff created');

  // ── Queue & Tokens for Gov Hospital OPD (DEMO SCENARIO) ───────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const opQueue = await prisma.queue.create({ data: {
    id: uuidv4(), departmentId: govHospOP.id,
    date: today, tokenPrefix: 'A', lastNumber: 105, isActive: true
  }});

  // Helper – creates a booked-at offset from now
  const bookedAt = (minAgo) => { const d = new Date(); d.setMinutes(d.getMinutes() - minAgo); return d; };

  // Tokens A098–A101: completed
  const completedTokens = [
    { num: 'A098', pos: 1, status: 'COMPLETED', counterId: ctr1.id, wait: 8 },
    { num: 'A099', pos: 2, status: 'COMPLETED', counterId: ctr2.id, wait: 7 },
    { num: 'A100', pos: 3, status: 'COMPLETED', counterId: ctr3.id, wait: 9 },
    { num: 'A101', pos: 4, status: 'COMPLETED', counterId: ctr1.id, wait: 6 },
  ];
  for (let i = 0; i < completedTokens.length; i++) {
    const t = completedTokens[i];
    const started = bookedAt(40 - i * 8);
    const completed = new Date(started); completed.setMinutes(completed.getMinutes() + t.wait);
    await prisma.token.create({ data: {
      id: uuidv4(), queueId: opQueue.id,
      userId: (i % 2 === 0) ? demoUser.id : regularUser.id,
      serviceId: svcGeneralOP.id, counterId: t.counterId,
      tokenNumber: t.num, status: t.status, position: t.pos,
      bookedAt: bookedAt(50 - i * 8),
      startedAt: started, completedAt: completed,
      actualWait: t.wait, estimatedWait: t.wait + 2
    }});
  }

  // Tokens A102–A104: currently serving at counters 1–3
  const servingToken1 = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: regularUser.id,
    serviceId: svcGeneralOP.id, counterId: ctr1.id,
    tokenNumber: 'A102', status: 'SERVING', position: 5,
    notes: 'Arun Kumar',
    bookedAt: bookedAt(35), calledAt: bookedAt(3), startedAt: bookedAt(2),
    estimatedWait: 0
  }});
  const servingToken2 = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: null,
    serviceId: svcGeneralOP.id, counterId: ctr2.id,
    tokenNumber: 'A103', status: 'SERVING', position: 6,
    notes: 'Priya Sharma',
    bookedAt: bookedAt(30), calledAt: bookedAt(4), startedAt: bookedAt(3),
    estimatedWait: 0
  }});
  const servingToken3 = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: null,
    serviceId: svcFollowUp.id, counterId: ctr3.id,
    tokenNumber: 'A104', status: 'SERVING', position: 7,
    notes: 'Mohamed Ali',
    bookedAt: bookedAt(28), calledAt: bookedAt(5), startedAt: bookedAt(4),
    estimatedWait: 0
  }});

  // Token A105: demo user's current token (WAITING)
  const demoToken = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: demoUser.id,
    serviceId: svcGeneralOP.id, counterId: null,
    tokenNumber: 'A105', status: 'WAITING', position: 8,
    bookedAt: bookedAt(5), estimatedWait: 32
  }});

  // Tokens A106–A118: additional waiting tokens with demo names
  const demoNames = [
    'Rahul Verma', 'Priya Sharma', 'Arun Kumar', 'Sarah Thomas',
    'Karthik Raja', 'Deepa Nair', 'Vikram Singh', 'Meera Patel',
    'Suresh Babu', 'Kavitha Devi', 'Anand Kumar', 'Fatima Sheikh', 'Ravi Chandran'
  ];
  const waitingNames = ['A106','A107','A108','A109','A110','A111','A112','A113','A114','A115','A116','A117','A118'];
  const waitServices = [svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id, svcGeneralOP.id, svcFollowUp.id,
    svcGeneralOP.id, svcGeneralOP.id, svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id,
    svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id];
  const waitFollowUp = [false, true, false, false, true, false, false, false, true, false, false, true, false];
  for (let i = 0; i < waitingNames.length; i++) {
    await prisma.token.create({ data: {
      id: uuidv4(), queueId: opQueue.id, userId: null,
      serviceId: waitServices[i], counterId: null,
      tokenNumber: waitingNames[i], status: 'WAITING',
      position: 9 + i,
      notes: demoNames[i],
      isFollowUp: waitFollowUp[i],
      bookedAt: bookedAt(4 - i * 0.3),
      estimatedWait: 32 + (i + 1) * 8
    }});
  }
  console.log('  ✓ Queue and tokens created (demo scenario)');

  // ── Visit History ─────────────────────────────────────────────
  const pastDate1 = new Date(); pastDate1.setDate(pastDate1.getDate() - 54); // ~June 15
  const pastDate2 = new Date(); pastDate2.setDate(pastDate2.getDate() - 29); // ~July 10
  await prisma.visitHistory.create({ data: {
    id: uuidv4(), userId: demoUser.id, tokenId: null,
    organizationName: 'Rajiv Gandhi Government General Hospital',
    serviceName: 'General OP', visitDate: pastDate1,
    status: 'COMPLETED', waitTime: 28, notes: 'Routine check-up'
  }});
  await prisma.visitHistory.create({ data: {
    id: uuidv4(), userId: demoUser.id, tokenId: null,
    organizationName: 'Rajiv Gandhi Government General Hospital',
    serviceName: 'General OP', visitDate: pastDate2,
    status: 'COMPLETED', waitTime: 35, notes: 'Follow-up visit'
  }});
  console.log('  ✓ Visit history created');

  // ── Upcoming Appointment ──────────────────────────────────────
  const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 12);
  await prisma.appointment.create({ data: {
    id: uuidv4(), userId: demoUser.id, serviceId: svcFollowUp.id,
    scheduledDate: futureDate, scheduledTime: '10:30',
    status: 'BOOKED', isFollowUp: true, prevVisitDate: pastDate2,
    notes: 'Monthly follow-up consultation'
  }});
  console.log('  ✓ Upcoming appointment created');

  // ── Notifications ─────────────────────────────────────────────
  await prisma.notification.createMany({ data: [
    { id: uuidv4(), userId: demoUser.id, type: 'TOKEN_BOOKED', title: 'Token Booked', message: 'Your token A105 has been booked for General OP.', isRead: false },
    { id: uuidv4(), userId: demoUser.id, type: 'ETA_UPDATED', title: 'Queue Updated', message: 'Your estimated waiting time is 32 minutes. 7 people ahead.', isRead: false },
    { id: uuidv4(), userId: demoUser.id, type: 'SYSTEM', title: 'Welcome to SmartQ AI', message: 'Track your queue, plan your visit, and get AI-powered predictions.', isRead: true },
  ]});
  console.log('  ✓ Notifications created');

  // ── Initial AI Prediction ─────────────────────────────────────
  await prisma.prediction.create({ data: {
    id: uuidv4(), queueId: opQueue.id,
    estimatedWait: 32, crowdLevel: 'HIGH', confidence: 0.84,
    activeCounters: 3, waitingCount: 15, avgServiceTime: 8.0,
    noShowRate: 0.08,
    recommendation: 'Opening Counter 4 may reduce estimated waiting time by 11 minutes.'
  }});

  await prisma.recommendation.create({ data: {
    id: uuidv4(), queueId: opQueue.id,
    message: 'High crowd detected. 15 patients waiting with only 3 active counters.',
    action: 'Open Counter 4',
    currentETA: 32, expectedETA: 21, isAccepted: false
  }});
  console.log('  ✓ AI prediction and recommendation created');

  // ── CANTEEN SEED DATA ─────────────────────────────────────────
  // Use SRM college for the canteen demo
  const srmOrg = await prisma.organization.findFirst({ where: { shortName: 'SRM College' } });
  if (srmOrg) {
    // Create CanteenOrg
    await prisma.canteenOrg.deleteMany({ where: { organizationId: srmOrg.id } });
    const canteenOrg = await prisma.canteenOrg.create({ data: {
      id: uuidv4(), organizationId: srmOrg.id,
      name: 'SRM College Canteen', isOpen: true,
      openTime: '07:00', closeTime: '21:00', lastOrderNumber: 120,
    }});

    // Counter 1 — Beverages & Snacks
    const cC1 = await prisma.canteenCounter.create({ data: {
      id: uuidv4(), canteenOrgId: canteenOrg.id,
      name: 'Counter 1 — Beverages & Snacks', type: 'BEVERAGES', number: 1, status: 'OPEN',
    }});
    // Counter 2 — Meals & Main Food
    const cC2 = await prisma.canteenCounter.create({ data: {
      id: uuidv4(), canteenOrgId: canteenOrg.id,
      name: 'Counter 2 — Meals & Main Food', type: 'MEALS', number: 2, status: 'OPEN',
    }});
    // Counter 3 — Fresh Juice
    const cC3 = await prisma.canteenCounter.create({ data: {
      id: uuidv4(), canteenOrgId: canteenOrg.id,
      name: 'Counter 3 — Fresh Juice', type: 'JUICE', number: 3, status: 'OPEN',
    }});

    // Helper: create standard menu for any canteen org's counters
    async function seedCanteenMenu(c1id, c2id, c3id) {
      const beverages = [
        { name: 'Tea',        price: 10,  prepTime: 3, period: 'ALL',     sort: 1 },
        { name: 'Coffee',     price: 15,  prepTime: 3, period: 'ALL',     sort: 2 },
        { name: 'Boost',      price: 20,  prepTime: 4, period: 'ALL',     sort: 3 },
        { name: 'Horlicks',   price: 20,  prepTime: 4, period: 'ALL',     sort: 4 },
        { name: 'Black Tea',  price: 8,   prepTime: 3, period: 'ALL',     sort: 5 },
        { name: 'Biscuits',   price: 10,  prepTime: 1, period: 'ALL',     sort: 6 },
        { name: 'Snacks',     price: 25,  prepTime: 5, period: 'EVENING', sort: 7 },
      ];
      for (const b of beverages)
        await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: c1id, name: b.name, price: b.price, category: 'BEVERAGES', mealPeriod: b.period, avgPrepTime: b.prepTime, sortOrder: b.sort } });

      const meals = [
        { name: 'Idly (2 pcs)',    price: 20,  prepTime: 5,  period: 'MORNING',   sort: 1 },
        { name: 'Dosa',            price: 30,  prepTime: 7,  period: 'MORNING',   sort: 2 },
        { name: 'Poori (2 pcs)',   price: 25,  prepTime: 6,  period: 'MORNING',   sort: 3 },
        { name: 'Chicken Biryani', price: 80,  prepTime: 10, period: 'AFTERNOON', sort: 4 },
        { name: 'Mutton Biryani',  price: 100, prepTime: 12, period: 'AFTERNOON', sort: 5 },
        { name: 'Full Meals',      price: 60,  prepTime: 8,  period: 'AFTERNOON', sort: 6 },
        { name: 'Lemon Rice',      price: 40,  prepTime: 5,  period: 'AFTERNOON', sort: 7 },
        { name: 'Curd Rice',       price: 35,  prepTime: 4,  period: 'AFTERNOON', sort: 8 },
        { name: 'Veg Fried Rice',  price: 50,  prepTime: 8,  period: 'EVENING',   sort: 9 },
        { name: 'Idly (2 pcs)',    price: 20,  prepTime: 5,  period: 'NIGHT',     sort: 10 },
        { name: 'Chapati (2 pcs)', price: 30,  prepTime: 7,  period: 'NIGHT',     sort: 11 },
        { name: 'Parota (2 pcs)',  price: 35,  prepTime: 8,  period: 'NIGHT',     sort: 12 },
      ];
      for (const m of meals)
        await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: c2id, name: m.name, price: m.price, category: 'MEALS', mealPeriod: m.period, avgPrepTime: m.prepTime, sortOrder: m.sort } });

      const juices = [
        { name: 'Orange Juice',     price: 35, prepTime: 3, sort: 1 },
        { name: 'Watermelon Juice', price: 30, prepTime: 3, sort: 2 },
        { name: 'Pineapple Juice',  price: 40, prepTime: 3, sort: 3 },
        { name: 'Lemon Juice',      price: 25, prepTime: 2, sort: 4 },
        { name: 'Mango Juice',      price: 45, prepTime: 3, sort: 5 },
        { name: 'Mixed Fruit Juice',price: 50, prepTime: 4, sort: 6 },
        { name: 'Milkshake',        price: 55, prepTime: 5, sort: 7 },
        { name: 'Badam Milk',       price: 45, prepTime: 4, sort: 8 },
        { name: 'Lemon Soda',       price: 20, prepTime: 2, sort: 9 },
      ];
      for (const j of juices)
        await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: c3id, name: j.name, price: j.price, category: 'JUICE', mealPeriod: 'ALL', avgPrepTime: j.prepTime, sortOrder: j.sort } });
    }

    await seedCanteenMenu(cC1.id, cC2.id, cC3.id);

    // Demo active orders for SRM
    const allMenuItems = await prisma.menuItem.findMany({ where: { counter: { canteenOrgId: canteenOrg.id } } });
    const menuMap = {};
    for (const mi of allMenuItems) menuMap[mi.name] = mi;

    const demoOrders = [
      { num: 'C121', guestName: 'Arun Kumar',   status: 'PREPARING', counter: cC1, items: [{ name:'Tea',             price:10,  qty:2 }] },
      { num: 'C122', guestName: 'Priya Sharma', status: 'READY',     counter: cC1, items: [{ name:'Coffee',          price:15,  qty:1 }] },
      { num: 'C123', guestName: 'Mohamed Ali',  status: 'PREPARING', counter: cC2, items: [{ name:'Chicken Biryani', price:80,  qty:1 }] },
      { num: 'C124', guestName: 'Sarah Thomas', status: 'PLACED',    counter: cC2, items: [{ name:'Full Meals',      price:60,  qty:1 }] },
      { num: 'C125', guestName: 'Karthik Raja', status: 'PLACED',    counter: cC2, items: [{ name:'Lemon Rice',      price:40,  qty:1 }] },
      { num: 'C126', guestName: 'Deepa Nair',   status: 'PREPARING', counter: cC2, items: [{ name:'Dosa',            price:30,  qty:2 }] },
      { num: 'C127', guestName: 'Demo User',    status: 'PLACED',    counter: cC2, items: [{ name:'Chicken Biryani', price:80,  qty:1 }], userId: demoUser.id },
      { num: 'C128', guestName: 'Vikram Singh', status: 'PLACED',    counter: cC3, items: [{ name:'Orange Juice',    price:35,  qty:1 }] },
      { num: 'C129', guestName: 'Meera Patel',  status: 'PREPARING', counter: cC3, items: [{ name:'Mango Juice',     price:45,  qty:2 }] },
    ];

    for (const o of demoOrders) {
      const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      const order = await prisma.canteenOrder.create({ data: {
        id: uuidv4(), canteenOrgId: canteenOrg.id,
        userId: o.userId || null, guestName: o.guestName,
        orderNumber: o.num, status: o.status,
        totalAmount: total, estimatedReadyTime: 12,
      }});
      for (const item of o.items) {
        const mi = menuMap[item.name] || allMenuItems[0];
        await prisma.canteenOrderItem.create({ data: {
          id: uuidv4(), orderId: order.id, menuItemId: mi.id,
          canteenCounterId: o.counter.id,
          name: item.name, price: item.price, quantity: item.qty,
        }});
      }
    }
    console.log('  ✓ Canteen seed data created (SRM College — 3 counters)');
  }

  // ── HOSPITAL CANTEENS ─────────────────────────────────────────
  async function createHospitalCanteen(org, label, startNum) {
    await prisma.canteenOrg.deleteMany({ where: { organizationId: org.id } });
    const hCan = await prisma.canteenOrg.create({ data: {
      id: uuidv4(), organizationId: org.id,
      name: label, isOpen: true,
      openTime: '06:00', closeTime: '22:00', lastOrderNumber: startNum,
    }});
    const hC1 = await prisma.canteenCounter.create({ data: { id: uuidv4(), canteenOrgId: hCan.id, name: 'Counter 1 — Beverages & Snacks', type: 'BEVERAGES', number: 1, status: 'OPEN' }});
    const hC2 = await prisma.canteenCounter.create({ data: { id: uuidv4(), canteenOrgId: hCan.id, name: 'Counter 2 — Meals & Main Food',  type: 'MEALS',     number: 2, status: 'OPEN' }});
    const hC3 = await prisma.canteenCounter.create({ data: { id: uuidv4(), canteenOrgId: hCan.id, name: 'Counter 3 — Fresh Juice',        type: 'JUICE',     number: 3, status: 'OPEN' }});

    // Reuse menu helper (defined inside the if-block above — inline here)
    const bev = ['Tea','Coffee','Boost','Horlicks','Black Tea','Biscuits','Snacks'];
    const bevPrices = [10,15,20,20,8,10,25]; const bevPrep = [3,3,4,4,3,1,5];
    for (let i = 0; i < bev.length; i++)
      await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: hC1.id, name: bev[i], price: bevPrices[i], category: 'BEVERAGES', mealPeriod: i < 6 ? 'ALL' : 'EVENING', avgPrepTime: bevPrep[i], sortOrder: i+1 }});

    const mls = [
      ['Idly (2 pcs)',20,5,'MORNING'],['Dosa',30,7,'MORNING'],['Poori (2 pcs)',25,6,'MORNING'],
      ['Chicken Biryani',80,10,'AFTERNOON'],['Mutton Biryani',100,12,'AFTERNOON'],
      ['Full Meals',60,8,'AFTERNOON'],['Lemon Rice',40,5,'AFTERNOON'],['Curd Rice',35,4,'AFTERNOON'],
      ['Idly (2 pcs)',20,5,'NIGHT'],['Chapati (2 pcs)',30,7,'NIGHT'],['Parota (2 pcs)',35,8,'NIGHT'],
    ];
    for (let i = 0; i < mls.length; i++)
      await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: hC2.id, name: mls[i][0], price: mls[i][1], category: 'MEALS', mealPeriod: mls[i][3], avgPrepTime: mls[i][2], sortOrder: i+1 }});

    const jcs = ['Orange Juice','Watermelon Juice','Pineapple Juice','Lemon Juice','Mango Juice','Mixed Fruit Juice','Milkshake','Badam Milk','Lemon Soda'];
    const jcP = [35,30,40,25,45,50,55,45,20]; const jcPr = [3,3,3,2,3,4,5,4,2];
    for (let i = 0; i < jcs.length; i++)
      await prisma.menuItem.create({ data: { id: uuidv4(), canteenCounterId: hC3.id, name: jcs[i], price: jcP[i], category: 'JUICE', mealPeriod: 'ALL', avgPrepTime: jcPr[i], sortOrder: i+1 }});

    // Demo orders
    const allMI = await prisma.menuItem.findMany({ where: { counter: { canteenOrgId: hCan.id } } });
    const mm = {}; for (const mi of allMI) mm[mi.name] = mi;
    const prefix = org.shortName?.includes('Apollo') ? 'HC' : 'HG';
    const hDemo = [
      { num: `${prefix}${startNum+1}`, name:'Rajesh Kumar', status:'PREPARING', c:hC1, item:'Tea',          p:10,  q:2 },
      { num: `${prefix}${startNum+2}`, name:'Sunita Devi',  status:'PLACED',    c:hC2, item:'Idly (2 pcs)', p:20,  q:1 },
      { num: `${prefix}${startNum+3}`, name:'Ramu Nadar',   status:'PLACED',    c:hC3, item:'Orange Juice', p:35,  q:1 },
      { num: `${prefix}${startNum+4}`, name:'Kavya Nair',   status:'PREPARING', c:hC2, item:'Full Meals',   p:60,  q:1 },
    ];
    for (const o of hDemo) {
      const mi = mm[o.item] || allMI[0];
      const ord = await prisma.canteenOrder.create({ data: {
        id: uuidv4(), canteenOrgId: hCan.id, guestName: o.name,
        orderNumber: o.num, status: o.status, totalAmount: o.p * o.q, estimatedReadyTime: 10,
      }});
      await prisma.canteenOrderItem.create({ data: {
        id: uuidv4(), orderId: ord.id, menuItemId: mi.id,
        canteenCounterId: o.c.id, name: o.item, price: o.p, quantity: o.q,
      }});
    }
    return hCan;
  }

  const govHospOrg = await prisma.organization.findFirst({ where: { shortName: 'RGGGH' } });
  const privHospOrg = await prisma.organization.findFirst({ where: { shortName: 'Apollo' } });
  if (govHospOrg) {
    await createHospitalCanteen(govHospOrg, 'Rajiv Gandhi Hospital Canteen', 200);
    console.log('  ✓ Hospital canteen created (RGGGH)');
  }
  if (privHospOrg) {
    await createHospitalCanteen(privHospOrg, 'Apollo Hospital Canteen', 300);
    console.log('  ✓ Hospital canteen created (Apollo)');
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('Demo credentials:');
  console.log('  User:  demo.user@smartq.ai  / demo123');
  console.log('  Admin: demo.admin@smartq.ai / demo123');
  console.log('  Staff: demo.staff@smartq.ai / demo123\n');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
