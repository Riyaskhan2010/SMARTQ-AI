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
  ]);
  const [hospitalSector, collegeSector, govSector, bankSector] = sectors;
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
    address: ''Shastri Bhavan', 26, Haddows Road, Chennai - 600006',
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
    shortName: 'Chennai GPO', sectorId: govSector.id,
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
  console.log('  ✓ Organizations created');

  // ── Departments ───────────────────────────────────────────────
  const govHospOP = await prisma.department.create({ data: { id: uuidv4(), organizationId: govHosp.id, name: 'Outpatient Department (OPD)', description: 'General outpatient services' } });
  const govHospLab = await prisma.department.create({ data: { id: uuidv4(), organizationId: govHosp.id, name: 'Laboratory Services', description: 'Blood tests and diagnostics' } });
  const privHospConsult = await prisma.department.create({ data: { id: uuidv4(), organizationId: privHosp.id, name: 'Consultation', description: 'Specialist consultations' } });
  const privHospRegistration = await prisma.department.create({ data: { id: uuidv4(), organizationId: privHosp.id, name: 'Registration & Billing', description: 'New patient registration' } });
  const passportDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: passportOffice.id, name: 'Passport Services', description: 'New, renewal, tatkal applications' } });
  const rtoDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: rtoOffice.id, name: 'Driving License', description: 'DL and learner license services' } });
  const rtoVehicleDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: rtoOffice.id, name: 'Vehicle Registration', description: 'New registration and transfer' } });
  const collectorateDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: collectorate.id, name: 'Certificate Services', description: 'Income, caste, residence certificates' } });
  const postOfficeFinance = await prisma.department.create({ data: { id: uuidv4(), organizationId: postOffice.id, name: 'Postal & Financial Services', description: 'Parcel, money order, savings' } });
  const collegeAdmin = await prisma.department.create({ data: { id: uuidv4(), organizationId: college.id, name: 'Admission Office', description: 'Admissions and enrollment' } });
  const collegeExam = await prisma.department.create({ data: { id: uuidv4(), organizationId: college.id, name: 'Exam Cell', description: 'Exam schedules, hall tickets' } });
  const bankDept = await prisma.department.create({ data: { id: uuidv4(), organizationId: bank.id, name: 'General Banking', description: 'Account operations and loans' } });
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
  const svcCertIncome= await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Income Certificate', description: 'Annual income certificate', avgServiceTime: 10, maxTokensPerDay: 100, fee: null } });
  const svcCertCaste = await prisma.service.create({ data: { id: uuidv4(), departmentId: collectorateDept.id, name: 'Community Certificate', description: 'Caste/community certificate', avgServiceTime: 10, maxTokensPerDay: 100, fee: null } });
  const svcPostParcel= await prisma.service.create({ data: { id: uuidv4(), departmentId: postOfficeFinance.id, name: 'Parcel / Speed Post', description: 'Send parcels and speed post', avgServiceTime: 5, maxTokensPerDay: 200, fee: null } });
  const svcPostSavings=await prisma.service.create({ data: { id: uuidv4(), departmentId: postOfficeFinance.id, name: 'Savings Account', description: 'Post office savings services', avgServiceTime: 10, maxTokensPerDay: 80, fee: null } });
  const svcAdmission = await prisma.service.create({ data: { id: uuidv4(), departmentId: collegeAdmin.id, name: 'Admission Enquiry', description: 'Course and admission information', avgServiceTime: 12, maxTokensPerDay: 60, fee: null } });
  const svcExamHall  = await prisma.service.create({ data: { id: uuidv4(), departmentId: collegeExam.id, name: 'Hall Ticket Collection', description: 'Collect exam hall tickets', avgServiceTime: 4, maxTokensPerDay: 200, fee: null } });
  const svcBankAcct  = await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Account Services', description: 'Deposits, withdrawals, account queries', avgServiceTime: 8, maxTokensPerDay: 150, fee: null } });
  const svcBankLoan  = await prisma.service.create({ data: { id: uuidv4(), departmentId: bankDept.id, name: 'Loan Services', description: 'Home, personal, vehicle loans', avgServiceTime: 20, maxTokensPerDay: 30, fee: null } });
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
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff1.id, organizationId: govHosp.id, counterId: ctr1.id, employeeId: 'EMP001', designation: 'Registration Clerk' } });
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff2.id, organizationId: govHosp.id, counterId: ctr2.id, employeeId: 'EMP002', designation: 'Registration Clerk' } });
  await prisma.staff.create({ data: { id: uuidv4(), userId: demoStaff3.id, organizationId: govHosp.id, counterId: ctr3.id, employeeId: 'EMP003', designation: 'Registration Clerk' } });
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
    bookedAt: bookedAt(35), calledAt: bookedAt(3), startedAt: bookedAt(2),
    estimatedWait: 0
  }});
  const servingToken2 = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: null,
    serviceId: svcGeneralOP.id, counterId: ctr2.id,
    tokenNumber: 'A103', status: 'SERVING', position: 6,
    bookedAt: bookedAt(30), calledAt: bookedAt(4), startedAt: bookedAt(3),
    estimatedWait: 0
  }});
  const servingToken3 = await prisma.token.create({ data: {
    id: uuidv4(), queueId: opQueue.id, userId: null,
    serviceId: svcFollowUp.id, counterId: ctr3.id,
    tokenNumber: 'A104', status: 'SERVING', position: 7,
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

  // Tokens A106–A118: additional waiting tokens
  const waitingNames = ['A106','A107','A108','A109','A110','A111','A112','A113','A114','A115','A116','A117','A118'];
  const waitServices = [svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id, svcGeneralOP.id, svcFollowUp.id,
    svcGeneralOP.id, svcGeneralOP.id, svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id,
    svcGeneralOP.id, svcFollowUp.id, svcGeneralOP.id];
  for (let i = 0; i < waitingNames.length; i++) {
    await prisma.token.create({ data: {
      id: uuidv4(), queueId: opQueue.id, userId: null,
      serviceId: waitServices[i], counterId: null,
      tokenNumber: waitingNames[i], status: 'WAITING',
      position: 9 + i, bookedAt: bookedAt(4 - i * 0.3),
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

  console.log('\n✅ Seeding complete!\n');
  console.log('Demo credentials:');
  console.log('  User:  demo.user@smartq.ai  / demo123');
  console.log('  Admin: demo.admin@smartq.ai / demo123');
  console.log('  Staff: demo.staff@smartq.ai / demo123\n');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
