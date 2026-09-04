import type { Company, User, Customer, Material, WorkItem, ToDo, Notification, ActivityLogEntry, TrashEntry, FactoryCodeRecord, Document } from '../types'

// ─── Companies ──────────────────────────────────────────
export const companies: Company[] = [
  {
    id: 'comp-fulla',
    nameEn: 'Fulla International',
    nameAr: 'فلا İnternational',
    shortName: 'Fulla',
    code: 'FUL',
    legalNameEn: 'Fulla International Trading Co.',
    legalNameAr: 'شركة فلا الدولية للتجارة',
    crNumber: '1010567890',
    vatNumber: '310567890100003',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    address: 'Olaya District, King Fahd Road, Riyadh 12211',
    postalCode: '12211',
    phone: '+966 11 456 7890',
    email: 'info@fulla-trading.com',
    website: 'www.fulla-trading.com',
    bankName: 'Saudi National Bank',
    accountName: 'Fulla International Trading Co.',
    accountNumber: 'SA44 2000 0001 2345 6789 0123',
    iban: 'SA4420000001234567890123',
    swift: 'NCBKSAJE',
    bankCurrency: 'SAR',
    defaultLanguage: 'en',
    defaultTemplate: 'template-a',
    defaultVatRate: 0,
    defaultIncoterm: 'FOB',
    defaultPaymentTerms: 'Net 30 days',
    defaultDeliveryTerms: 'Within 15 business days',
    defaultPreparedBy: 'Mohamed Al-Hassan',
    defaultCurrency: 'SAR',
    defaultWeightUnit: 'MT',
    showSignature: true,
    showStamp: true,
  },
  {
    id: 'comp-gbc',
    nameEn: 'GBC Petrochemicals',
    nameAr: 'جي بي سي للبتروكيماويات',
    shortName: 'GBC',
    code: 'GBC',
    legalNameEn: 'GBC Petrochemicals Ltd.',
    legalNameAr: 'جي بي سي للبتروكيماويات المحدودة',
    crNumber: '1010987654',
    vatNumber: '310987654100003',
    country: 'Saudi Arabia',
    city: 'Jubail',
    address: 'Jubail Industrial City, Phase 2, Jubail 31961',
    postalCode: '31961',
    phone: '+966 13 345 6789',
    email: 'ops@gbc-petro.com',
    website: 'www.gbc-petro.com',
    bankName: 'Al Rajhi Bank',
    accountName: 'GBC Petrochemicals Ltd.',
    accountNumber: 'SA03 8000 0000 1234 5678 9012',
    iban: 'SA0380000000123456789012',
    swift: 'RJHISARI',
    bankCurrency: 'USD',
    defaultLanguage: 'en',
    defaultTemplate: 'template-b',
    defaultVatRate: 15,
    defaultIncoterm: 'CIF',
    defaultPaymentTerms: 'Net 45 days',
    defaultDeliveryTerms: 'Within 30 business days',
    defaultPreparedBy: 'Fatima Al-Rashid',
    defaultCurrency: 'USD',
    defaultWeightUnit: 'MT',
    showSignature: true,
    showStamp: true,
  },
  {
    id: 'comp-kayan',
    nameEn: 'Kayan Polymers',
    nameAr: 'كيان للبوليمرات',
    shortName: 'Kayan',
    code: 'KAY',
    legalNameEn: 'Kayan Polymers Manufacturing',
    legalNameAr: 'كيان للبوليمرات التصنيع',
    crNumber: '1010456789',
    vatNumber: '310456789100003',
    country: 'Saudi Arabia',
    city: 'Dammam',
    address: 'Second Industrial City, Dammam 31421',
    postalCode: '31421',
    phone: '+966 13 812 3456',
    email: 'info@kayan-poly.com',
    bankCurrency: 'SAR',
    defaultLanguage: 'ar',
    defaultTemplate: 'template-a',
    defaultVatRate: 15,
    defaultIncoterm: 'EXW',
    defaultCurrency: 'SAR',
    defaultWeightUnit: 'MT',
    showSignature: true,
    showStamp: true,
  },
]

// ─── Users ──────────────────────────────────────────
export const users: User[] = [
  {
    id: 'user-1',
    name: 'Mohamed Al-Hassan',
    nameAr: 'محمد الحسن',
    email: 'mohamed@sanad-app.com',
    role: 'admin',
    memberships: [
      { companyId: 'comp-fulla', role: 'admin', permissions: [] },
      { companyId: 'comp-gbc', role: 'admin', permissions: [] },
      { companyId: 'comp-kayan', role: 'admin', permissions: [] },
    ],
  },
  {
    id: 'user-2',
    name: 'Fatima Al-Rashid',
    nameAr: 'فاطمة الراشد',
    email: 'fatima@sanad-app.com',
    role: 'user',
    memberships: [
      {
        companyId: 'comp-fulla', role: 'user',
        permissions: ['projects.view', 'projects.create', 'projects.edit', 'projects.pin', 'documents.view', 'documents.create', 'documents.edit', 'documents.print', 'documents.download', 'customers.view', 'customers.create', 'customers.edit', 'materials.view', 'materials.create', 'files.view', 'files.upload', 'files.download', 'reports.view', 'reports.export_pdf', 'reports.export_excel', 'factory.view', 'factory.export', 'audit.view', 'trash.view', 'trash.restore'],
      },
      {
        companyId: 'comp-gbc', role: 'viewer',
        permissions: ['projects.view', 'tasks.view', 'documents.view', 'customers.view', 'materials.view', 'files.view', 'reports.view', 'audit.view'],
      },
    ],
  },
  {
    id: 'user-3',
    name: 'Omar Saeed',
    nameAr: 'عمر سعيد',
    email: 'omar@sanad-app.com',
    role: 'user',
    memberships: [
      {
        companyId: 'comp-gbc', role: 'user',
        permissions: ['projects.view', 'projects.create', 'projects.edit', 'documents.view', 'documents.create', 'documents.edit', 'documents.download', 'customers.view', 'customers.edit', 'materials.view', 'factory.view', 'factory.export'],
      },
    ],
  },
  {
    id: 'user-4',
    name: 'Nora Khalil',
    nameAr: 'نورة خليل',
    email: 'nora@sanad-app.com',
    role: 'viewer',
    memberships: [
      {
        companyId: 'comp-fulla', role: 'viewer',
        permissions: ['projects.view', 'documents.view', 'customers.view', 'materials.view', 'reports.view'],
      },
    ],
  },
]

// ─── Customers ──────────────────────────────────────────
export const customersFulla: Customer[] = [
  { id: 'cust-1', companyId: 'comp-fulla', name: 'Al-Baraka Trading LLC', nameAr: 'شركة البركة التجارية', contactPerson: 'Ahmed Mansour', phone: '+971 4 345 6789', email: 'ahmed@albaraka.ae', country: 'UAE', city: 'Dubai', address: 'Jebel Ali Free Zone, Dubai', createdAt: '2024-01-15' },
  { id: 'cust-2', companyId: 'comp-fulla', name: 'Nile Chemical Industries', nameAr: 'kıl industries للصناعات الكيميائية', contactPerson: 'Hassan Ibrahim', phone: '+20 2 2345 6789', email: 'hassan@nilechem.eg', country: 'Egypt', city: 'Cairo', address: '10th of Ramadan City, Cairo', createdAt: '2024-02-10' },
  { id: 'cust-3', companyId: 'comp-fulla', name: 'Mediterranean Plastics SA', nameAr: 'Mediterranean Plastics SA', contactPerson: 'Marco Rossi', phone: '+39 02 9876 5432', email: 'marco@medplastics.it', country: 'Italy', city: 'Milan', address: 'Via Torino 15, Milan 20123', createdAt: '2024-03-05' },
  { id: 'cust-4', companyId: 'comp-fulla', name: 'Gulf Petrochemical Corp', nameAr: 'Gulf Petrochemical Corp', contactPerson: 'James Wilson', phone: '+44 20 7890 1234', email: 'james@gulfpetro.co.uk', country: 'United Kingdom', city: 'London', address: '1 Canada Square, London E14 5AB', createdAt: '2024-01-22' },
  { id: 'cust-5', companyId: 'comp-fulla', name: 'Riyadh Polymers Co.', nameAr: 'شركة الرياض للبوليمرات', contactPerson: 'Khalid bin Saleh', phone: '+966 11 234 5678', email: 'khalid@riyadhpolymers.sa', country: 'Saudi Arabia', city: 'Jeddah', address: 'Al-Khumra Industrial Area, Jeddah', createdAt: '2024-04-12' },
  { id: 'cust-6', companyId: 'comp-fulla', name: 'Asia Pacific Polymer Trading', nameAr: 'Asia Pacific Polymer Trading', contactPerson: 'Li Wei', phone: '+65 6789 0123', email: 'liwei@appolymer.sg', country: 'Singapore', city: 'Singapore', address: '1 Raffles Place, Singapore 048616', createdAt: '2024-02-28' },
  { id: 'cust-7', companyId: 'comp-fulla', name: 'Saudi PVC Solutions', nameAr: 'حلول الPVC السعودية', contactPerson: 'Abdul Rahman', phone: '+966 13 456 7890', email: 'abdul@saudipvc.sa', country: 'Saudi Arabia', city: 'Dammam', address: 'Dammam 2nd Industrial City', createdAt: '2024-05-01' },
  { id: 'cust-8', companyId: 'comp-fulla', name: 'EuroPlast GmbH', nameAr: 'EuroPlast GmbH', contactPerson: 'Hans Mueller', phone: '+49 89 1234 5678', email: 'hans@europlast.de', country: 'Germany', city: 'Munich', address: 'Leopoldstrasse 10, Munich 80802', createdAt: '2024-03-15' },
  { id: 'cust-9', companyId: 'comp-fulla', name: 'Turkish Polymer Imports', nameAr: 'Turkish Polymer Imports', contactPerson: 'Mehmet Yilmaz', phone: '+90 212 345 6789', email: 'mehmet@turkpolymer.tr', country: 'Turkey', city: 'Istanbul', address: 'Levent Mahallesi, Istanbul', createdAt: '2024-04-20' },
  { id: 'cust-10', companyId: 'comp-fulla', name: 'Pakistan Chemical Corp', nameAr: 'Pakistan Chemical Corp', contactPerson: 'Ali Khan', phone: '+92 21 3456 7890', email: 'ali@pakchem.pk', country: 'Pakistan', city: 'Karachi', address: 'SITE Area, Karachi 75700', createdAt: '2024-06-10' },
]

export const customersGbc: Customer[] = [
  { id: 'cust-g1', companyId: 'comp-gbc', name: 'European Chemical Distributors', nameAr: 'European Chemical Distributors', contactPerson: 'Pierre Dupont', phone: '+33 1 4567 8901', email: 'pierre@eurochem.fr', country: 'France', city: 'Paris', address: 'La Defense, Paris 92400', createdAt: '2024-01-20' },
  { id: 'cust-g2', companyId: 'comp-gbc', name: 'Brazilian Petrochemical Ltda', nameAr: 'Brazilian Petrochemical Ltda', contactPerson: 'Carlos Silva', phone: '+55 11 3456 7890', email: 'carlos@brazilpetro.br', country: 'Brazil', city: 'Sao Paulo', address: 'Av Paulista 1000, Sao Paulo', createdAt: '2024-03-10' },
  { id: 'cust-g3', companyId: 'comp-gbc', name: 'Jubail Industrial Supply', nameAr: 'إمدادات مدينة الجبيل الصناعية', contactPerson: 'Sultan Al-Otaibi', phone: '+966 13 367 8901', email: 'sultan@jis.sa', country: 'Saudi Arabia', city: 'Jubail', address: 'Jubail Industrial City', createdAt: '2024-02-15' },
  { id: 'cust-g4', companyId: 'comp-gbc', name: 'Korean Polymer Corp', nameAr: 'Korean Polymer Corp', contactPerson: 'Kim Soo-jin', phone: '+82 2 3456 7890', email: 'soojin@koreapolymer.kr', country: 'South Korea', city: 'Seoul', address: 'Gangnam-gu, Seoul', createdAt: '2024-04-05' },
  { id: 'cust-g5', companyId: 'comp-gbc', name: 'Indian Petrochemicals Pvt Ltd', nameAr: 'Indian Petrochemicals Pvt Ltd', contactPerson: 'Rajesh Sharma', phone: '+91 22 2345 6789', email: 'rajesh@indpetro.in', country: 'India', city: 'Mumbai', address: 'Bandra Kurla Complex, Mumbai', createdAt: '2024-05-20' },
  { id: 'cust-g6', companyId: 'comp-gbc', name: 'East Africa Polymers Ltd', nameAr: 'East Africa Polymers Ltd', contactPerson: 'David Ochieng', phone: '+254 20 2345 678', email: 'david@eapolymer.ke', country: 'Kenya', city: 'Nairobi', address: 'Industrial Area, Nairobi', createdAt: '2024-06-01' },
]

export const customersKayan: Customer[] = [
  { id: 'cust-k1', companyId: 'comp-kayan', name: 'Al-Khaleej Plastic Products', nameAr: 'منتجات البلاستيك الخليجية', contactPerson: 'Saud Al-Fahad', phone: '+966 11 567 8901', email: 'saud@alkhaleejpp.sa', country: 'Saudi Arabia', city: 'Riyadh', address: 'Al-Sulay District, Riyadh', createdAt: '2024-01-10' },
  { id: 'cust-k2', companyId: 'comp-kayan', name: 'Moroccan Chemical Trading', nameAr: 'Moroccan Chemical Trading', contactPerson: 'Youssef El Amrani', phone: '+212 5 2345 678', email: 'youssef@mctrading.ma', country: 'Morocco', city: 'Casablanca', address: 'Boulevard Massira Al Khadra, Casablanca', createdAt: '2024-03-25' },
  { id: 'cust-k3', companyId: 'comp-kayan', name: 'Thai Polyethylene Co.', nameAr: 'Thai Polyethylene Co.', contactPerson: 'Somchai Patel', phone: '+66 2 345 6789', email: 'somchai@thaipe.th', country: 'Thailand', city: 'Bangkok', address: 'Sathorn District, Bangkok', createdAt: '2024-05-15' },
  { id: 'cust-k4', companyId: 'comp-kayan', name: 'Omani Polymers LLC', nameAr: 'Omani Polymers LLC', contactPerson: 'Hamed Al-Balushi', phone: '+968 2456 7890', email: 'hamed@ompolymers.om', country: 'Oman', city: 'Muscat', address: 'Rusayl Industrial Estate, Muscat', createdAt: '2024-02-20' },
]

// ─── Materials ──────────────────────────────────────────
export const materials: Material[] = [
  { id: 'mat-1', companyId: 'comp-fulla', name: 'HDPE 952', grade: 'Blow Molding', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: '25 KG Bags', lastSellingPrice: 1050, currency: 'SAR', createdAt: '2024-01-01' },
  { id: 'mat-2', companyId: 'comp-fulla', name: 'HDPE FG 952', grade: 'Film Grade', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: 'Jumbo Bags', lastSellingPrice: 1100, currency: 'SAR', createdAt: '2024-01-01' },
  { id: 'mat-3', companyId: 'comp-fulla', name: 'PP 500P', grade: 'Injection', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3902.10', defaultPacking: '25 KG Bags', lastSellingPrice: 980, currency: 'SAR', createdAt: '2024-01-01' },
  { id: 'mat-4', companyId: 'comp-fulla', name: 'LDPE 2426H', grade: 'Film', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.10', defaultPacking: '25 KG Bags', lastSellingPrice: 1150, currency: 'SAR', createdAt: '2024-02-01' },
  { id: 'mat-5', companyId: 'comp-fulla', name: 'LLDPE', grade: 'Film Grade', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: 'Jumbo Bags', lastSellingPrice: 1080, currency: 'SAR', createdAt: '2024-02-01' },
  { id: 'mat-6', companyId: 'comp-fulla', name: 'PVC S-65', grade: 'General Purpose', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3904.10', defaultPacking: '25 KG Bags', lastSellingPrice: 920, currency: 'SAR', createdAt: '2024-03-01' },
  { id: 'mat-7', companyId: 'comp-fulla', name: 'PET resin', grade: 'Bottle Grade', manufacturer: 'Indorama', origin: 'Thailand', hsCode: '3907.60', defaultPacking: '25 KG Bags', lastSellingPrice: 1250, currency: 'SAR', createdAt: '2024-03-01' },
  { id: 'mat-8', companyId: 'comp-fulla', name: 'PP Copolymer', grade: 'Extrusion', manufacturer: 'Borealis', origin: 'Austria', hsCode: '3902.30', defaultPacking: '25 KG Bags', lastSellingPrice: 1020, currency: 'SAR', createdAt: '2024-04-01' },
  { id: 'mat-9', companyId: 'comp-fulla', name: 'HDPE 5810', grade: 'Thermoforming', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: '25 KG Bags', lastSellingPrice: 1070, currency: 'SAR', createdAt: '2024-04-01' },
  { id: 'mat-10', companyId: 'comp-fulla', name: 'ABS PA-757', grade: 'Injection', manufacturer: 'Chi Mei', origin: 'Taiwan', hsCode: '3903.30', defaultPacking: '25 KG Bags', lastSellingPrice: 1380, currency: 'SAR', createdAt: '2024-05-01' },
]

export const materialsGbc: Material[] = [
  { id: 'mat-g1', companyId: 'comp-gbc', name: 'HDPE Blow Molding', grade: 'B5429', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: '25 KG Bags', lastSellingPrice: 1100, currency: 'USD', createdAt: '2024-01-01' },
  { id: 'mat-g2', companyId: 'comp-gbc', name: 'PP Injection', grade: 'HP500N', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3902.10', defaultPacking: '25 KG Bags', lastSellingPrice: 1020, currency: 'USD', createdAt: '2024-02-01' },
  { id: 'mat-g3', companyId: 'comp-gbc', name: 'LDPE Film', grade: '2100TN00', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.10', defaultPacking: '25 KG Bags', lastSellingPrice: 1200, currency: 'USD', createdAt: '2024-03-01' },
  { id: 'mat-g4', companyId: 'comp-gbc', name: 'LLDPE Film', grade: '118W', manufacturer: 'SABIC', origin: 'Saudi Arabia', hsCode: '3901.20', defaultPacking: 'Jumbo Bags', lastSellingPrice: 1120, currency: 'USD', createdAt: '2024-04-01' },
]

// ─── Projects ──────────────────────────────────────────
export const projects: WorkItem[] = [
  {
    id: 'proj-1', type: 'project', companyId: 'comp-fulla', name: 'HDPE Shipment to Dubai — Al-Baraka',
    customerId: 'cust-1', customerName: 'Al-Baraka Trading LLC', status: 'in_progress', isPinned: true,
    materials: [
      { id: 'pm-1', materialId: 'mat-1', materialName: 'HDPE 952', grade: 'Blow Molding', quantity: 50, weightUnit: 'MT', unitPrice: 1050, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
      { id: 'pm-2', materialId: 'mat-2', materialName: 'HDPE FG 952', grade: 'Film Grade', quantity: 25, weightUnit: 'MT', unitPrice: 1100, currency: 'SAR', packing: 'Jumbo Bags', packingUnit: 'Jumbo Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
    ],
    destinationCountry: 'UAE', destinationCity: 'Dubai', currency: 'SAR', incoterm: 'FOB',
    paymentTerms: 'Net 30 days', portOfLoading: 'Jubail Port', portOfDischarge: 'Jebel Ali Port',
    vesselName: 'MV Pacific Star', voyageNumber: 'PS-2024-0412', containerNumber: 'MSKU 7283456',
    createdAt: '2024-10-15', updatedAt: '2024-11-20', createdBy: 'Mohamed Al-Hassan',
    documents: [
      { id: 'doc-1', companyId: 'comp-fulla', workItemId: 'proj-1', type: 'QUOT', number: 'QUOT-2024-001', date: '2024-10-16', language: 'en', template: 'template-a', preparedBy: 'Mohamed Al-Hassan', vatRate: 0, status: 'final', materials: [], createdAt: '2024-10-16', updatedAt: '2024-10-16' },
      { id: 'doc-2', companyId: 'comp-fulla', workItemId: 'proj-1', type: 'PINV', number: 'PINV-2024-001', date: '2024-10-20', language: 'en', template: 'template-a', preparedBy: 'Mohamed Al-Hassan', vatRate: 0, status: 'final', materials: [], createdAt: '2024-10-20', updatedAt: '2024-10-20' },
      { id: 'doc-3', companyId: 'comp-fulla', workItemId: 'proj-1', type: 'PKL', number: 'PKL-2024-001', date: '2024-11-01', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', status: 'draft', materials: [], createdAt: '2024-11-01', updatedAt: '2024-11-01' },
    ],
    attachments: [
      { id: 'att-1', name: 'Certificate_of_Origin.pdf', type: 'application/pdf', size: 245000, uploadedBy: 'Fatima Al-Rashid', uploadedAt: '2024-11-05' },
      { id: 'att-2', name: 'Phytosanitary_Certificate.pdf', type: 'application/pdf', size: 180000, uploadedBy: 'Fatima Al-Rashid', uploadedAt: '2024-11-06' },
    ],
    reportIssues: [
      { id: 'ri-1', description: 'Container seal number not yet received from shipping line', severity: 'medium', status: 'open', reporter: 'Fatima Al-Rashid', createdAt: '2024-11-18' },
    ],
    projectNotes: [
      { id: 'pn-1', content: 'Customer requested split delivery — first 25 MT by end of November, remaining by mid-December', author: 'Mohamed Al-Hassan', createdAt: '2024-10-18' },
    ],
  },
  {
    id: 'proj-2', type: 'project', companyId: 'comp-fulla', name: 'PVC Export to Egypt — Nile Chemical',
    customerId: 'cust-2', customerName: 'Nile Chemical Industries', status: 'in_progress', isPinned: true,
    materials: [
      { id: 'pm-3', materialId: 'mat-6', materialName: 'PVC S-65', grade: 'General Purpose', quantity: 80, weightUnit: 'MT', unitPrice: 920, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3904.10' },
    ],
    destinationCountry: 'Egypt', destinationCity: 'Alexandria', currency: 'SAR', incoterm: 'CIF',
    portOfLoading: 'Dammam Port', portOfDischarge: 'Alexandria Port',
    createdAt: '2024-11-01', updatedAt: '2024-11-22', createdBy: 'Mohamed Al-Hassan',
    documents: [
      { id: 'doc-4', companyId: 'comp-fulla', workItemId: 'proj-2', type: 'QUOT', number: 'QUOT-2024-002', date: '2024-11-02', language: 'en', template: 'template-a', preparedBy: 'Mohamed Al-Hassan', status: 'final', materials: [], createdAt: '2024-11-02', updatedAt: '2024-11-02' },
    ],
    attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-3', type: 'project', companyId: 'comp-fulla', name: 'LDPE & LLDPE to Italy — MedPlast',
    customerId: 'cust-3', customerName: 'Mediterranean Plastics SA', status: 'completed', isPinned: false,
    materials: [
      { id: 'pm-4', materialId: 'mat-4', materialName: 'LDPE 2426H', grade: 'Film', quantity: 40, weightUnit: 'MT', unitPrice: 1150, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.10' },
      { id: 'pm-5', materialId: 'mat-5', materialName: 'LLDPE', grade: 'Film Grade', quantity: 30, weightUnit: 'MT', unitPrice: 1080, currency: 'SAR', packing: 'Jumbo Bags', packingUnit: 'Jumbo Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
    ],
    destinationCountry: 'Italy', destinationCity: 'Milan', currency: 'SAR', incoterm: 'CIF',
    portOfLoading: 'Jubail Port', portOfDischarge: 'Genoa Port',
    createdAt: '2024-08-10', updatedAt: '2024-10-25', createdBy: 'Fatima Al-Rashid',
    documents: [
      { id: 'doc-5', companyId: 'comp-fulla', workItemId: 'proj-3', type: 'TINV', number: 'TINV-2024-003', date: '2024-10-15', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', vatRate: 0, status: 'final', materials: [], createdAt: '2024-10-15', updatedAt: '2024-10-15' },
      { id: 'doc-6', companyId: 'comp-fulla', workItemId: 'proj-3', type: 'CINV', number: 'CINV-2024-003', date: '2024-10-15', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', status: 'final', materials: [], createdAt: '2024-10-15', updatedAt: '2024-10-15' },
      { id: 'doc-7', companyId: 'comp-fulla', workItemId: 'proj-3', type: 'PKL', number: 'PKL-2024-003', date: '2024-10-16', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', status: 'final', materials: [], createdAt: '2024-10-16', updatedAt: '2024-10-16' },
      { id: 'doc-8', companyId: 'comp-fulla', workItemId: 'proj-3', type: 'DN', number: 'DN-2024-003', date: '2024-10-17', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', status: 'final', materials: [], createdAt: '2024-10-17', updatedAt: '2024-10-17' },
      { id: 'doc-9', companyId: 'comp-fulla', workItemId: 'proj-3', type: 'BL', number: 'BL-2024-003', date: '2024-10-20', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', status: 'final', materials: [], createdAt: '2024-10-20', updatedAt: '2024-10-20' },
    ],
    attachments: [{ id: 'att-3', name: 'Bill_of_Lading_Scan.pdf', type: 'application/pdf', size: 520000, uploadedAt: '2024-10-22' }],
    reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-4', type: 'project', companyId: 'comp-fulla', name: 'PP Shipment to UK — Gulf Petrochemical',
    customerId: 'cust-4', customerName: 'Gulf Petrochemical Corp', status: 'cancelled',
    materials: [
      { id: 'pm-6', materialId: 'mat-3', materialName: 'PP 500P', grade: 'Injection', quantity: 60, weightUnit: 'MT', unitPrice: 980, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3902.10' },
    ],
    destinationCountry: 'United Kingdom', destinationCity: 'London', currency: 'SAR',
    createdAt: '2024-09-01', updatedAt: '2024-10-05', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [],
    reportIssues: [{ id: 'ri-2', description: 'Customer cancelled order due to regulatory change', severity: 'high', status: 'resolved', reporter: 'Mohamed Al-Hassan', createdAt: '2024-10-01' }],
    projectNotes: [],
  },
  {
    id: 'proj-5', type: 'project', companyId: 'comp-fulla', name: 'PET Resin to Singapore — APP Trading',
    customerId: 'cust-6', customerName: 'Asia Pacific Polymer Trading', status: 'in_progress',
    materials: [
      { id: 'pm-7', materialId: 'mat-7', materialName: 'PET resin', grade: 'Bottle Grade', quantity: 45, weightUnit: 'MT', unitPrice: 1250, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Thailand', hsCode: '3907.60' },
    ],
    destinationCountry: 'Singapore', destinationCity: 'Singapore', currency: 'SAR', incoterm: 'CIF',
    portOfLoading: 'Dammam Port', portOfDischarge: 'Singapore Port',
    createdAt: '2024-11-10', updatedAt: '2024-11-23', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-6', type: 'project', companyId: 'comp-fulla', name: 'HDPE to Turkey — TurkPolymer',
    customerId: 'cust-9', customerName: 'Turkish Polymer Imports', status: 'in_progress',
    materials: [
      { id: 'pm-8', materialId: 'mat-1', materialName: 'HDPE 952', grade: 'Blow Molding', quantity: 35, weightUnit: 'MT', unitPrice: 1050, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
      { id: 'pm-9', materialId: 'mat-9', materialName: 'HDPE 5810', grade: 'Thermoforming', quantity: 15, weightUnit: 'MT', unitPrice: 1070, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
    ],
    destinationCountry: 'Turkey', destinationCity: 'Istanbul', currency: 'SAR', incoterm: 'FOB',
    portOfLoading: 'Jubail Port', portOfDischarge: 'Ambarli Port',
    createdAt: '2024-11-15', updatedAt: '2024-11-24', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-7', type: 'project', companyId: 'comp-fulla', name: 'ABS to Germany — EuroPlast',
    customerId: 'cust-8', customerName: 'EuroPlast GmbH', status: 'completed',
    materials: [
      { id: 'pm-10', materialId: 'mat-10', materialName: 'ABS PA-757', grade: 'Injection', quantity: 20, weightUnit: 'MT', unitPrice: 1380, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Taiwan', hsCode: '3903.30' },
    ],
    destinationCountry: 'Germany', destinationCity: 'Hamburg', currency: 'SAR', incoterm: 'CIF',
    createdAt: '2024-07-01', updatedAt: '2024-09-15', createdBy: 'Fatima Al-Rashid',
    documents: [
      { id: 'doc-10', companyId: 'comp-fulla', workItemId: 'proj-7', type: 'TINV', number: 'TINV-2024-007', date: '2024-09-01', language: 'en', template: 'template-a', preparedBy: 'Fatima Al-Rashid', vatRate: 15, status: 'final', materials: [], createdAt: '2024-09-01', updatedAt: '2024-09-01' },
    ],
    attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-8', type: 'project', companyId: 'comp-fulla', name: 'PP Copolymer to Pakistan — PakChem',
    customerId: 'cust-10', customerName: 'Pakistan Chemical Corp', status: 'archived',
    materials: [
      { id: 'pm-11', materialId: 'mat-8', materialName: 'PP Copolymer', grade: 'Extrusion', quantity: 30, weightUnit: 'MT', unitPrice: 1020, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Austria', hsCode: '3902.30' },
    ],
    destinationCountry: 'Pakistan', destinationCity: 'Karachi', currency: 'SAR',
    createdAt: '2024-05-10', updatedAt: '2024-08-20', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-9', type: 'project', companyId: 'comp-fulla', name: 'PVC to Saudi — SaudPVC',
    customerId: 'cust-7', customerName: 'Saudi PVC Solutions', status: 'completed',
    materials: [
      { id: 'pm-12', materialId: 'mat-6', materialName: 'PVC S-65', grade: 'General Purpose', quantity: 40, weightUnit: 'MT', unitPrice: 920, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3904.10' },
    ],
    destinationCountry: 'Saudi Arabia', destinationCity: 'Dammam', currency: 'SAR',
    createdAt: '2024-06-15', updatedAt: '2024-08-30', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-10', type: 'project', companyId: 'comp-fulla', name: 'HDPE Bulk Export to Riyadh Polymers',
    customerId: 'cust-5', customerName: 'Riyadh Polymers Co.', status: 'in_progress',
    materials: [
      { id: 'pm-13', materialId: 'mat-1', materialName: 'HDPE 952', grade: 'Blow Molding', quantity: 100, weightUnit: 'MT', unitPrice: 1050, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
    ],
    destinationCountry: 'Saudi Arabia', destinationCity: 'Jeddah', currency: 'SAR',
    createdAt: '2024-11-20', updatedAt: '2024-11-25', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-11', type: 'project', companyId: 'comp-fulla', name: 'Mixed Polymer Shipment — Nile Chemical Phase 2',
    customerId: 'cust-2', customerName: 'Nile Chemical Industries', status: 'archived',
    materials: [
      { id: 'pm-14', materialId: 'mat-3', materialName: 'PP 500P', grade: 'Injection', quantity: 20, weightUnit: 'MT', unitPrice: 980, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags' },
      { id: 'pm-15', materialId: 'mat-5', materialName: 'LLDPE', grade: 'Film Grade', quantity: 15, weightUnit: 'MT', unitPrice: 1080, currency: 'SAR', packing: 'Jumbo Bags', packingUnit: 'Jumbo Bags' },
    ],
    destinationCountry: 'Egypt', destinationCity: 'Alexandria', currency: 'SAR',
    createdAt: '2024-04-01', updatedAt: '2024-06-30', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-12', type: 'project', companyId: 'comp-fulla', name: 'HDPE Shipment — Al-Baraka Phase 2',
    customerId: 'cust-1', customerName: 'Al-Baraka Trading LLC', status: 'completed',
    materials: [
      { id: 'pm-16', materialId: 'mat-1', materialName: 'HDPE 952', grade: 'Blow Molding', quantity: 60, weightUnit: 'MT', unitPrice: 1050, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags' },
    ],
    destinationCountry: 'UAE', destinationCity: 'Dubai', currency: 'SAR',
    createdAt: '2024-06-01', updatedAt: '2024-08-15', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
]

// GBC Projects
export const projectsGbc: WorkItem[] = [
  {
    id: 'proj-g1', type: 'project', companyId: 'comp-gbc', name: 'HDPE to France — EuroChem',
    customerId: 'cust-g1', customerName: 'European Chemical Distributors', status: 'in_progress', isPinned: true,
    materials: [
      { id: 'pm-g1', materialId: 'mat-g1', materialName: 'HDPE Blow Molding', grade: 'B5429', quantity: 40, weightUnit: 'MT', unitPrice: 1100, currency: 'USD', packing: '25 KG Bags', packingUnit: 'Bags', origin: 'Saudi Arabia', hsCode: '3901.20' },
    ],
    destinationCountry: 'France', destinationCity: 'Le Havre', currency: 'USD', incoterm: 'CIF',
    createdAt: '2024-10-01', updatedAt: '2024-11-20', createdBy: 'Omar Saeed',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-g2', type: 'project', companyId: 'comp-gbc', name: 'PP to Brazil — BrazilPetro',
    customerId: 'cust-g2', customerName: 'Brazilian Petrochemical Ltda', status: 'in_progress',
    materials: [
      { id: 'pm-g2', materialId: 'mat-g2', materialName: 'PP Injection', grade: 'HP500N', quantity: 55, weightUnit: 'MT', unitPrice: 1020, currency: 'USD', packing: '25 KG Bags', packingUnit: 'Bags' },
    ],
    destinationCountry: 'Brazil', destinationCity: 'Santos', currency: 'USD',
    createdAt: '2024-11-05', updatedAt: '2024-11-22', createdBy: 'Omar Saeed',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-g3', type: 'project', companyId: 'comp-gbc', name: 'LDPE & LLDPE to Korea — KoreaPolymer',
    customerId: 'cust-g4', customerName: 'Korean Polymer Corp', status: 'completed',
    materials: [
      { id: 'pm-g3', materialId: 'mat-g3', materialName: 'LDPE Film', grade: '2100TN00', quantity: 30, weightUnit: 'MT', unitPrice: 1200, currency: 'USD', packing: '25 KG Bags', packingUnit: 'Bags' },
      { id: 'pm-g4', materialId: 'mat-g4', materialName: 'LLDPE Film', grade: '118W', quantity: 25, weightUnit: 'MT', unitPrice: 1120, currency: 'USD', packing: 'Jumbo Bags', packingUnit: 'Jumbo Bags' },
    ],
    destinationCountry: 'South Korea', destinationCity: 'Busan', currency: 'USD',
    createdAt: '2024-07-15', updatedAt: '2024-09-30', createdBy: 'Omar Saeed',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'proj-g4', type: 'project', companyId: 'comp-gbc', name: 'HDPE to Jubail — JIS',
    customerId: 'cust-g3', customerName: 'Jubail Industrial Supply', status: 'archived',
    materials: [
      { id: 'pm-g5', materialId: 'mat-g1', materialName: 'HDPE Blow Molding', grade: 'B5429', quantity: 20, weightUnit: 'MT', unitPrice: 1100, currency: 'SAR', packing: '25 KG Bags', packingUnit: 'Bags' },
    ],
    destinationCountry: 'Saudi Arabia', destinationCity: 'Jubail', currency: 'SAR',
    createdAt: '2024-04-01', updatedAt: '2024-06-15', createdBy: 'Omar Saeed',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
]

// ─── Tasks ──────────────────────────────────────────
export const tasks: WorkItem[] = [
  {
    id: 'task-1', type: 'task', companyId: 'comp-fulla', name: 'Follow up on Al-Baraka quotation',
    customerId: 'cust-1', customerName: 'Al-Baraka Trading LLC', status: 'in_progress',
    materials: [], createdAt: '2024-11-20', updatedAt: '2024-11-24', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-2', type: 'task', companyId: 'comp-fulla', name: 'Verify PVC S-65 HS code for Egypt',
    customerId: 'cust-2', customerName: 'Nile Chemical Industries', status: 'in_progress',
    materials: [], createdAt: '2024-11-18', updatedAt: '2024-11-23', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-3', type: 'task', companyId: 'comp-fulla', name: 'Prepare packing specs for MedPlast',
    customerId: 'cust-3', customerName: 'Mediterranean Plastics SA', status: 'completed',
    materials: [], createdAt: '2024-10-01', updatedAt: '2024-10-10', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-4', type: 'task', companyId: 'comp-fulla', name: 'Request updated bank details from PakChem',
    customerId: 'cust-10', customerName: 'Pakistan Chemical Corp', status: 'cancelled',
    materials: [], createdAt: '2024-09-05', updatedAt: '2024-09-20', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-5', type: 'task', companyId: 'comp-fulla', name: 'Check PET resin lead time',
    customerId: 'cust-6', customerName: 'Asia Pacific Polymer Trading', status: 'in_progress',
    materials: [], createdAt: '2024-11-15', updatedAt: '2024-11-22', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-6', type: 'task', companyId: 'comp-fulla', name: 'Update HDPE 952 pricing for Q1 2025',
    status: 'in_progress',
    materials: [{ id: 'pm-t1', materialId: 'mat-1', materialName: 'HDPE 952', quantity: 0, weightUnit: 'MT', unitPrice: 1080, currency: 'SAR' }],
    createdAt: '2024-11-22', updatedAt: '2024-11-24', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-7', type: 'task', companyId: 'comp-fulla', name: 'Collect customer feedback on EuroPlast shipment',
    customerId: 'cust-8', customerName: 'EuroPlast GmbH', status: 'completed',
    materials: [], createdAt: '2024-10-20', updatedAt: '2024-11-01', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-8', type: 'task', companyId: 'comp-fulla', name: 'Verify container availability at Jubail Port',
    status: 'in_progress',
    materials: [], createdAt: '2024-11-10', updatedAt: '2024-11-24', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    id: 'task-9', type: 'task', companyId: 'comp-fulla', name: 'Send invoice corrections to Turkish Polymer',
    customerId: 'cust-9', customerName: 'Turkish Polymer Imports', status: 'in_progress',
    materials: [], createdAt: '2024-11-21', updatedAt: '2024-11-24', createdBy: 'Fatima Al-Rashid',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
  {
    'id': 'task-10', type: 'task', companyId: 'comp-fulla', name: 'Finalize Saudi PVC payment terms',
    customerId: 'cust-7', customerName: 'Saudi PVC Solutions', status: 'completed',
    materials: [], createdAt: '2024-11-01', updatedAt: '2024-11-10', createdBy: 'Mohamed Al-Hassan',
    documents: [], attachments: [], reportIssues: [], projectNotes: [],
  },
]

// ─── To-dos ──────────────────────────────────────────
export const todos: ToDo[] = [
  { id: 'td-1', title: 'Call Al-Baraka to confirm shipping date', description: 'Confirm December shipment schedule with Ahmed Mansour', dueDate: '2024-11-25', dueTime: '10:00', priority: 'high', done: false, createdAt: '2024-11-20' },
  { id: 'td-2', title: 'Review Q4 export report draft', description: 'Check figures against project database before submission', dueDate: '2024-11-26', dueTime: '14:00', priority: 'medium', done: false, createdAt: '2024-11-22' },
  { id: 'td-3', title: 'Update HDPE 952 material spec file', description: 'Replace old TDS with latest version from SABIC', dueDate: '2024-11-20', dueTime: '09:00', priority: 'medium', done: true, createdAt: '2024-11-18' },
  { id: 'td-4', title: 'Prepare documents for Nile Chemical shipment', description: 'Gather all required export documents', dueDate: '2024-11-28', dueTime: '11:00', priority: 'high', done: false, createdAt: '2024-11-23' },
  { id: 'td-5', title: 'Submit GBC quarterly report', description: 'Prepare and submit Q3 activity report to GBC management', dueDate: '2024-11-15', dueTime: '17:00', priority: 'low', done: true, createdAt: '2024-11-10' },
  { id: 'td-6', title: 'Check VAT registration renewal', description: 'CR and VAT renewal due next month', dueDate: '2024-12-01', dueTime: '09:00', priority: 'medium', done: false, createdAt: '2024-11-20' },
  { id: 'td-7', title: 'Schedule team meeting for December targets', description: 'Book conference room and prepare agenda', dueDate: '2024-11-27', dueTime: '13:00', priority: 'low', done: false, createdAt: '2024-11-22' },
  { id: 'td-8', title: 'Follow up on insurance claim for damaged shipment', description: 'Contact insurance company for status update', dueDate: '2024-11-22', dueTime: '10:00', priority: 'high', done: false, createdAt: '2024-11-19' },
]

// ─── Notifications ──────────────────────────────────────────
export const notifications: Notification[] = [
  { id: 'notif-1', type: 'task_assigned', title: 'Task Assigned', message: 'You have been assigned "Follow up on Al-Baraka quotation"', read: false, createdAt: '2024-11-24T09:30:00Z', entityId: 'task-1', entityType: 'task' },
  { id: 'notif-2', type: 'task_overdue', title: 'Task Overdue', message: '"Check PET resin lead time" is 2 days past due', read: false, createdAt: '2024-11-24T08:00:00Z', entityId: 'task-5', entityType: 'task' },
  { id: 'notif-3', type: 'document_created', title: 'Document Created', message: 'PKL-2024-001 was created for HDPE Shipment to Dubai', read: true, createdAt: '2024-11-20T14:15:00Z', entityId: 'doc-3', entityType: 'document' },
  { id: 'notif-4', type: 'report_issue', title: 'Report Issue Created', message: 'New issue reported on "HDPE Shipment to Dubai — Al-Baraka"', read: true, createdAt: '2024-11-18T11:00:00Z', entityId: 'ri-1', entityType: 'report_issue' },
  { id: 'notif-5', type: 'project_status', title: 'Project Completed', message: '"LDPE & LLDPE to Italy — MedPlast" has been marked as Completed', read: true, createdAt: '2024-10-25T16:45:00Z', entityId: 'proj-3', entityType: 'project' },
  { id: 'notif-6', type: 'attachment', title: 'Attachment Uploaded', message: 'Phytosanitary_Certificate.pdf uploaded to Al-Baraka project', read: true, createdAt: '2024-11-06T10:30:00Z', entityId: 'att-2', entityType: 'attachment' },
  { id: 'notif-7', type: 'permission_change', title: 'Permissions Updated', message: 'Omar Saeed permissions updated for GBC', read: true, createdAt: '2024-11-15T09:00:00Z' },
  { id: 'notif-8', type: 'backup_success', title: 'Backup Succeeded', message: 'Automatic daily backup completed successfully', read: true, createdAt: '2024-11-24T03:00:00Z' },
  { id: 'notif-9', type: 'todo_reminder', title: 'To-do Reminder', message: '"Call Al-Baraka to confirm shipping date" is due today', read: false, createdAt: '2024-11-25T08:00:00Z', entityId: 'td-1', entityType: 'todo' },
  { id: 'notif-10', type: 'project_archived', title: 'Project Archived', message: '"PP Copolymer to Pakistan" has been archived', read: true, createdAt: '2024-08-20T12:00:00Z', entityId: 'proj-8', entityType: 'project' },
]

// ─── Activity Log ──────────────────────────────────────────
export const activityLog: ActivityLogEntry[] = [
  { id: 'al-1', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'CREATE', entityType: 'project', entityId: 'proj-10', entityRef: 'HDPE Bulk Export to Riyadh Polymers', timestamp: '2024-11-20T10:00:00Z' },
  { id: 'al-2', userId: 'user-2', userName: 'Fatima Al-Rashid', companyId: 'comp-fulla', action: 'CREATE', entityType: 'document', entityId: 'doc-3', entityRef: 'PKL-2024-001', timestamp: '2024-11-20T14:15:00Z' },
  { id: 'al-3', userId: 'user-2', userName: 'Fatima Al-Rashid', companyId: 'comp-fulla', action: 'UPLOAD', entityType: 'attachment', entityId: 'att-1', entityRef: 'Certificate_of_Origin.pdf', timestamp: '2024-11-05T09:30:00Z' },
  { id: 'al-4', userId: 'user-2', userName: 'Fatima Al-Rashid', companyId: 'comp-fulla', action: 'CREATE', entityType: 'report_issue', entityId: 'ri-1', entityRef: 'Container seal number issue — proj-1', timestamp: '2024-11-18T11:00:00Z' },
  { id: 'al-5', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'EDIT', entityType: 'project', entityId: 'proj-1', entityRef: 'HDPE Shipment to Dubai — Al-Baraka',
    before: { vesselName: 'MV Pacific Star', voyageNumber: 'PS-2024-0400' },
    after: { vesselName: 'MV Pacific Star', voyageNumber: 'PS-2024-0412' },
    timestamp: '2024-11-19T15:00:00Z' },
  { id: 'al-6', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'ARCHIVE', entityType: 'project', entityId: 'proj-8', entityRef: 'PP Copolymer to Pakistan — PakChem', timestamp: '2024-08-20T12:00:00Z' },
  { id: 'al-7', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'PDF_DOWNLOAD', entityType: 'document', entityId: 'doc-5', entityRef: 'TINV-2024-003', timestamp: '2024-10-15T16:00:00Z' },
  { id: 'al-8', userId: 'user-2', userName: 'Fatima Al-Rashid', companyId: 'comp-fulla', action: 'MOVE_TO_TRASH', entityType: 'attachment', entityId: 'att-old', entityRef: 'Old_ratesheet.xlsx', timestamp: '2024-11-10T11:00:00Z' },
  { id: 'al-9', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'EDIT', entityType: 'settings', entityId: 'settings-doc-defaults',
    before: { defaultVatRate: 0 },
    after: { defaultVatRate: 15 },
    timestamp: '2024-11-01T08:00:00Z' },
  { id: 'al-10', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'PERMISSION_CHANGE', entityType: 'user', entityId: 'user-4', entityRef: 'Nora Khalil', timestamp: '2024-11-01T08:30:00Z' },
  { id: 'al-11', userId: 'user-2', userName: 'Fatima Al-Rashid', companyId: 'comp-fulla', action: 'DOWNLOAD', entityType: 'document', entityId: 'doc-1', entityRef: 'QUOT-2024-001', timestamp: '2024-10-16T11:00:00Z' },
  { id: 'al-12', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'RESTORE', entityType: 'attachment', entityId: 'att-old', entityRef: 'Old_ratesheet.xlsx', timestamp: '2024-11-12T09:00:00Z' },
  { id: 'al-13', userId: 'user-3', userName: 'Omar Saeed', companyId: 'comp-gbc', action: 'CREATE', entityType: 'project', entityId: 'proj-g2', entityRef: 'PP to Brazil — BrazilPetro', timestamp: '2024-11-05T10:00:00Z' },
  { id: 'al-14', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-gbc', action: 'FACTORY_IMPORT', entityType: 'factory_code', entityId: 'factory-import-1', entityRef: 'factory_code_v3.xlsx — 3,000 new, 500 updated', timestamp: '2024-11-10T08:00:00Z' },
  { id: 'al-15', userId: 'user-1', userName: 'Mohamed Al-Hassan', companyId: 'comp-fulla', action: 'BACKUP', entityType: 'backup', entityId: 'backup-1', entityRef: 'Manual backup — daily_automatic_2024-11-24', timestamp: '2024-11-24T03:00:00Z' },
]

// ─── Trash ──────────────────────────────────────────
export const trashEntries: TrashEntry[] = [
  { id: 'trash-1', entityType: 'document', entityId: 'doc-old-1', entityName: 'QUOT-2024-005 (Draft)', deletedBy: 'Fatima Al-Rashid', deletedAt: '2024-11-10T11:00:00Z', companyId: 'comp-fulla' },
  { id: 'trash-2', entityType: 'attachment', entityId: 'att-del', entityName: 'Old_ratesheet.xlsx', deletedBy: 'Mohamed Al-Hassan', deletedAt: '2024-11-08T09:00:00Z', companyId: 'comp-fulla' },
  { id: 'trash-3', entityType: 'customer', entityId: 'cust-del', entityName: 'Defunct Trading Co.', deletedBy: 'Mohamed Al-Hassan', deletedAt: '2024-11-05T14:00:00Z', companyId: 'comp-fulla' },
  { id: 'trash-4', entityType: 'task', entityId: 'task-del-1', entityName: 'Test task for pricing review', deletedBy: 'Fatima Al-Rashid', deletedAt: '2024-11-01T10:00:00Z', companyId: 'comp-fulla' },
  { id: 'trash-5', entityType: 'project', entityId: 'proj-del-1', entityName: 'Cancelled trial shipment', deletedBy: 'Mohamed Al-Hassan', deletedAt: '2024-10-25T16:00:00Z', companyId: 'comp-fulla' },
  { id: 'trash-6', entityType: 'material', entityId: 'mat-del', entityName: 'Old PP Grade X', deletedBy: 'Fatima Al-Rashid', deletedAt: '2024-10-20T11:00:00Z', companyId: 'comp-fulla' },
]

// ─── Factory Code (sample 30 for UI demo) ──────────────────────────────────────────
export const factoryCodes: FactoryCodeRecord[] = [
  { id: 'fc-1', factoryCode: '100001', factoryName: 'Saudi Basic Industries Corp (SABIC)', factoryNameAr: 'شركة الصناعات الأساسية السعودية', city: 'Riyadh', region: 'Central', activity: 'Petrochemicals', product: 'Polyethylene', hsCode: '3901.20', registrationNumber: 'CR-1010001234' },
  { id: 'fc-2', factoryCode: '100002', factoryName: 'SABIC - Jubail Petrochemicals', factoryNameAr: 'سابك - مصافي الجبيل', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'Polyethylene', hsCode: '3901.20', registrationNumber: 'CR-1010002345' },
  { id: 'fc-3', factoryCode: '100003', factoryName: 'National Petrochemical Co.', factoryNameAr: 'الشركة الوطنية للبتروكيماويات', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'Polypropylene', hsCode: '3902.10', registrationNumber: 'CR-1010003456' },
  { id: 'fc-4', factoryCode: '100004', factoryName: 'Yansab - Yanbu Petrochemical', factoryNameAr: 'يانساب - مصافي ينبع', city: 'Yanbu', region: 'Western', activity: 'Petrochemicals', product: 'Polyethylene', hsCode: '3901.20', registrationNumber: 'CR-1010004567' },
  { id: 'fc-5', factoryCode: '100005', factoryName: 'Saudi Kayan Petrochemical', factoryNameAr: 'كيان السعودية للبتروكيماويات', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'Polypropylene', hsCode: '3902.10', registrationNumber: 'CR-1010005678' },
  { id: 'fc-6', factoryCode: '100006', factoryName: 'Ibn Rushd Chemicals', factoryNameAr: 'شركة ابن رشد لل PRODUCTS الكيميائية', city: 'Dammam', region: 'Eastern', activity: 'Chemicals', product: 'PVC Resin', hsCode: '3904.10', registrationNumber: 'CR-1010006789' },
  { id: 'fc-7', factoryCode: '100007', factoryName: 'Al-Tayyar Paints & Chemicals', factoryNameAr: 'الطيار للطلاء والمواد الكيميائية', city: 'Jeddah', region: 'Western', activity: 'Paints', product: 'Titanium Dioxide', hsCode: '3206.11', registrationNumber: 'CR-1010007890' },
  { id: 'fc-8', factoryCode: '100008', factoryName: 'Rajhi Chemical Industries', factoryNameAr: 'الراشي للصناعات الكيميائية', city: 'Riyadh', region: 'Central', activity: 'Chemicals', product: 'Caustic Soda', hsCode: '2815.11', registrationNumber: 'CR-1010008901' },
  { id: 'fc-9', factoryCode: '100009', factoryName: 'Eastern Province Cement Co.', factoryNameAr: 'شركة أسمنت المنطقة الشرقية', city: 'Dammam', region: 'Eastern', activity: 'Construction', product: 'Portland Cement', hsCode: '2523.29', registrationNumber: 'CR-1010009012' },
  { id: 'fc-10', factoryCode: '100010', factoryName: 'Saudi Ceramic Company', factoryNameAr: 'الشركة السعودية للخزف', city: 'Riyadh', region: 'Central', activity: 'Ceramics', product: 'Ceramic Tiles', hsCode: '6907.21', registrationNumber: 'CR-1010010123' },
  { id: 'fc-11', factoryCode: '100011', factoryName: 'Arabian Plastic Company', factoryNameAr: 'الشركة العربية للبلاستيك', city: 'Dammam', region: 'Eastern', activity: 'Plastics', product: 'Plastic Bags', hsCode: '3923.21', registrationNumber: 'CR-1010011234' },
  { id: 'fc-12', factoryCode: '100012', factoryName: 'Gulf Extrusions Co.', factoryNameAr: 'شركة خليج للتجانسات', city: 'Al Ain', region: 'Eastern', activity: 'Aluminium', product: 'Aluminium Profiles', hsCode: '7604.10', registrationNumber: 'CR-1010012345' },
  { id: 'fc-13', factoryCode: '100013', factoryName: 'Saudi Vam Industry', factoryNameAr: 'شركة فام السعودية للصناعة', city: 'Jubail', region: 'Eastern', activity: 'Plastics', product: 'PVC Pipes', hsCode: '3917.23', registrationNumber: 'CR-1010013456' },
  { id: 'fc-14', factoryCode: '100014', factoryName: 'Modern Plastic Factory', factoryNameAr: 'مصنع المودرن للبلاستيك', city: 'Jeddah', region: 'Western', activity: 'Plastics', product: 'HDPE Containers', hsCode: '3923.30', registrationNumber: 'CR-1010014567' },
  { id: 'fc-15', factoryCode: '100015', factoryName: 'Saudi Polymers Co.', factoryNameAr: 'الشركة السعودية للبوليمرات', city: 'Al-Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'Polyethylene', hsCode: '3901.10', registrationNumber: 'CR-1010015678' },
  { id: 'fc-16', factoryCode: '100016', factoryName: 'Jubail Fertilizer Co.', factoryNameAr: 'مصنع الجبيل للأسمدة', city: 'Jubail', region: 'Eastern', activity: 'Fertilizers', product: 'Urea', hsCode: '3102.10', registrationNumber: 'CR-1010016789' },
  { id: 'fc-17', factoryCode: '100017', factoryName: 'Ma\'aden Phosphate Co.', factoryNameAr: 'معادن فوسفات', city: 'Ras Al Khair', region: 'Eastern', activity: 'Mining', product: 'Phosphate Rock', hsCode: '2510.20', registrationNumber: 'CR-1010017890' },
  { id: 'fc-18', factoryCode: '100018', factoryName: 'Saudi Cement Company', factoryNameAr: 'الشركة السعودية للأسمنت', city: 'Dammam', region: 'Eastern', activity: 'Construction', product: 'Cement', hsCode: '2523.29', registrationNumber: 'CR-1010018901' },
  { id: 'fc-19', factoryCode: '100019', factoryName: 'Red Sea Trading & Industry', factoryNameAr: 'البحر الأحمر للتجارة والصناعة', city: 'Jeddah', region: 'Western', activity: 'Trading', product: 'Packaging Materials', hsCode: '3920.10', registrationNumber: 'CR-1010019012' },
  { id: 'fc-20', factoryCode: '100020', factoryName: 'Najran Cement Factory', factoryNameAr: 'مصنع نجران للأسمنت', city: 'Najran', region: 'Southern', activity: 'Construction', product: 'Cement', hsCode: '2523.29', registrationNumber: 'CR-1010020123' },
  { id: 'fc-21', factoryCode: '952001', factoryName: 'SABIC — HDPE Plant 952', factoryNameAr: 'سابك — مصنع HDPE 952', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'HDPE 952', hsCode: '3901.20', registrationNumber: 'CR-9520010001' },
  { id: 'fc-22', factoryCode: '952002', factoryName: 'SABIC — PP Plant 500P', factoryNameAr: 'سابك — مصنع PP 500P', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'PP 500P', hsCode: '3902.10', registrationNumber: 'CR-9520020001' },
  { id: 'fc-23', factoryCode: '952003', factoryName: 'SABIC — LDPE Plant', factoryNameAr: 'سابك — مصنع LDPE', city: 'Yanbu', region: 'Western', activity: 'Petrochemicals', product: 'LDPE 2426H', hsCode: '3901.10', registrationNumber: 'CR-9520030001' },
  { id: 'fc-24', factoryCode: '952004', factoryName: 'SABIC — PET Plant', factoryNameAr: 'سابك — مصنع PET', city: 'Jubail', region: 'Eastern', activity: 'Petrochemicals', product: 'PET Resin', hsCode: '3907.60', registrationNumber: 'CR-9520040001' },
  { id: 'fc-25', factoryCode: '200001', factoryName: 'Yamama Cement Company', factoryNameAr: 'شركة ياما马 للأسمنت', city: 'Riyadh', region: 'Central', activity: 'Construction', product: 'White Cement', hsCode: '2523.21', registrationNumber: 'CR-2000010001' },
  { id: 'fc-26', factoryCode: '200002', factoryName: 'Southern Province Cement', factoryNameAr: 'أسمنت المنطقة الجنوبية', city: 'Abha', region: 'Southern', activity: 'Construction', product: 'Portland Cement', hsCode: '2523.29', registrationNumber: 'CR-2000020001' },
  { id: 'fc-27', factoryCode: '200003', factoryName: 'Tabuk Cement Company', factoryNameAr: 'شركة تبوك للأسمنت', city: 'Tabuk', region: 'Northern', activity: 'Construction', product: 'Cement', hsCode: '2523.29', registrationNumber: 'CR-2000030001' },
  { id: 'fc-28', factoryCode: '300001', factoryName: 'Saudi Fisheries Co.', factoryNameAr: 'الشركة السعودية للصيد البحري', city: 'Jeddah', region: 'Western', activity: 'Food Processing', product: 'Frozen Fish', hsCode: '0303.89', registrationNumber: 'CR-3000010001' },
  { id: 'fc-29', factoryCode: '300002', factoryName: 'Almarai Company', factoryNameAr: 'شركة المراعي', city: 'Riyadh', region: 'Central', activity: 'Dairy', product: 'Milk Powder', hsCode: '0402.10', registrationNumber: 'CR-3000020001' },
  { id: 'fc-30', factoryCode: '300003', factoryName: 'NADEC Food Industries', factoryNameAr: 'نادك للصناعات الغذائية', city: 'Al-Kharj', region: 'Central', activity: 'Dairy', product: 'Juice Concentrate', hsCode: '2009.11', registrationNumber: 'CR-3000030001' },
]

// ─── Helper functions ──────────────────────────────────────────
export function getCustomersByCompany(companyId: string): Customer[] {
  if (companyId === 'comp-fulla') return customersFulla
  if (companyId === 'comp-gbc') return customersGbc
  if (companyId === 'comp-kayan') return customersKayan
  return []
}

export function getMaterialsByCompany(companyId: string): Material[] {
  if (companyId === 'comp-fulla') return materials
  if (companyId === 'comp-gbc') return materialsGbc
  return []
}

export function getProjectsByCompany(companyId: string): WorkItem[] {
  if (companyId === 'comp-fulla') return projects
  if (companyId === 'comp-gbc') return projectsGbc
  return []
}

export function getTasksByCompany(companyId: string): WorkItem[] {
  return tasks.filter(t => t.companyId === companyId)
}

export function getTodosForUser(_userId: string): ToDo[] {
  return todos
}

export function getNotificationsForUser(_userId: string): Notification[] {
  return notifications
}

export function getActivityByCompany(companyId: string): ActivityLogEntry[] {
  return activityLog.filter(a => a.companyId === companyId)
}

export function getTrashByCompany(companyId: string): TrashEntry[] {
  return trashEntries.filter(t => t.companyId === companyId)
}
