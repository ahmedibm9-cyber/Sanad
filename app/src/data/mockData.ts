import type { Company, User, Customer, Material, WorkItem, ToDo, Notification, ActivityLogEntry, TrashEntry, FactoryCodeRecord } from '../types'

// ─── Companies ──────────────────────────────────────────
export const companies: Company[] = [
  {
    id: 'comp-fulla',
    nameEn: 'Fulla International',
    nameAr: 'فلا International',
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
export const customersFulla: Customer[] = []
export const customersGbc: Customer[] = []
export const customersKayan: Customer[] = []

// ─── Materials ──────────────────────────────────────────
export const materials: Material[] = []
export const materialsGbc: Material[] = []

// ─── Projects ──────────────────────────────────────────
export const projects: WorkItem[] = []
export const projectsGbc: WorkItem[] = []

// ─── Tasks ──────────────────────────────────────────
export const tasks: WorkItem[] = []

// ─── To-dos ──────────────────────────────────────────
export const todos: ToDo[] = []

// ─── Notifications ──────────────────────────────────────────
export const notifications: Notification[] = []

// ─── Activity Log ──────────────────────────────────────────
export const activityLog: ActivityLogEntry[] = []

// ─── Trash ──────────────────────────────────────────
export const trashEntries: TrashEntry[] = []

// ─── Factory Codes ──────────────────────────────────────────
export const factoryCodes: FactoryCodeRecord[] = []

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
