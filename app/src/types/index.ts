export type Language = 'en' | 'ar'

export type CompanyId = string
export type UserId = string
export type ProjectId = string
export type TaskId = string
export type CustomerId = string
export type MaterialId = string
export type DocumentId = string
export type ToDoId = string

export interface Company {
  id: CompanyId
  nameEn: string
  nameAr: string
  shortName: string
  code: string
  logo?: string
  stamp?: string
  signature?: string
  legalNameEn?: string
  legalNameAr?: string
  crNumber?: string
  vatNumber?: string
  country?: string
  city?: string
  address?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  iban?: string
  swift?: string
  bankCurrency?: string
  defaultLanguage?: Language
  defaultTemplate?: 'template-a' | 'template-b'
  defaultVatRate?: number
  defaultIncoterm?: string
  defaultPaymentTerms?: string
  defaultDeliveryTerms?: string
  defaultPreparedBy?: string
  defaultCurrency?: string
  defaultWeightUnit?: string
  showSignature?: boolean
  showStamp?: boolean
}

export interface User {
  id: UserId
  name: string
  nameAr?: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'viewer'
  memberships: CompanyMembership[]
}

export interface CompanyMembership {
  companyId: CompanyId
  role: 'admin' | 'user' | 'viewer'
  permissions: Permission[]
}

export type Permission =
  | 'projects.view' | 'projects.create' | 'projects.edit' | 'projects.archive' | 'projects.reopen' | 'projects.pin' | 'projects.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.edit' | 'tasks.convert_to_project' | 'tasks.archive' | 'tasks.delete'
  | 'documents.view' | 'documents.create' | 'documents.edit' | 'documents.print' | 'documents.download' | 'documents.delete'
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete' | 'customers.export'
  | 'materials.view' | 'materials.create' | 'materials.edit' | 'materials.delete' | 'materials.files.manage'
  | 'files.view' | 'files.upload' | 'files.download' | 'files.delete'
  | 'reports.view' | 'reports.export_pdf' | 'reports.export_excel'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.permissions.manage' | 'users.disable'
  | 'audit.view'
  | 'trash.view' | 'trash.restore' | 'trash.hard_delete'
  | 'factory.view' | 'factory.export' | 'factory.import_update'
  | 'backup.create' | 'backup.restore'
  | 'settings.view' | 'settings.edit'
  | 'company.view' | 'company.edit'

export type WorkItemType = 'project' | 'task'
export type WorkItemStatus = 'in_progress' | 'cancelled' | 'completed' | 'archived'

export interface Customer {
  id: CustomerId
  companyId: CompanyId
  name: string
  nameAr?: string
  contactPerson?: string
  phone?: string
  phoneSecondary?: string
  email?: string
  country?: string
  city?: string
  address?: string
  postalCode?: string
  vatNumber?: string
  notes?: string
  createdAt: string
}

export interface Material {
  id: MaterialId
  companyId: CompanyId
  name: string
  grade?: string
  manufacturer?: string
  origin?: string
  hsCode?: string
  defaultPacking?: string
  lastSellingPrice?: number
  currency?: string
  tdsFile?: string
  msdsFile?: string
  coaFile?: string
  createdAt: string
}

export interface ProjectMaterial {
  id: string
  materialId: MaterialId
  materialName: string
  grade?: string
  quantity: number
  weightUnit: string
  unitPrice: number
  currency: string
  packing?: string
  packingUnit?: string
  origin?: string
  hsCode?: string
}

export interface WorkItem {
  id: ProjectId | TaskId
  type: WorkItemType
  companyId: CompanyId
  name: string
  customerId?: CustomerId
  customerName?: string
  status: WorkItemStatus
  isPinned?: boolean
  materials: ProjectMaterial[]
  destinationCountry?: string
  destinationCity?: string
  currency?: string
  incoterm?: string
  paymentTerms?: string
  deliveryTerms?: string
  shippingReference?: string
  containerNumber?: string
  vesselName?: string
  voyageNumber?: string
  portOfLoading?: string
  portOfDischarge?: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  documents: Document[]
  attachments: Attachment[]
  reportIssues: ReportIssue[]
  projectNotes: ProjectNote[]
}

export type DocumentType = 'QUOT' | 'PINV' | 'TINV' | 'CINV' | 'PKL' | 'DN' | 'BL'

export interface Document {
  id: DocumentId
  companyId: CompanyId
  workItemId: ProjectId | TaskId
  type: DocumentType
  number: string
  date: string
  language: Language
  template: 'template-a' | 'template-b'
  preparedBy?: string
  showSignature?: boolean
  showStamp?: boolean
  vatRate?: number
  notes?: string
  terms?: string
  status: 'draft' | 'final'
  materials: ProjectMaterial[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  uploadedBy?: string
  uploadedAt: string
}

export type ReportIssueStatus = 'open' | 'under_review' | 'resolved' | 'rejected'
export type ReportIssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ReportIssue {
  id: string
  description: string
  severity: ReportIssueSeverity
  status: ReportIssueStatus
  reporter?: string
  createdAt: string
}

export interface ProjectNote {
  id: string
  content: string
  author?: string
  createdAt: string
}

export interface ToDo {
  id: ToDoId
  title: string
  description?: string
  dueDate?: string
  dueTime?: string
  priority: 'low' | 'medium' | 'high'
  done: boolean
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  entityId?: string
  entityType?: string
}

export interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  companyId: CompanyId
  action: string
  entityType: string
  entityId: string
  entityRef?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  timestamp: string
}

export interface TrashEntry {
  id: string
  entityType: 'project' | 'task' | 'document' | 'customer' | 'material' | 'attachment'
  entityId: string
  entityName: string
  deletedBy: string
  deletedAt: string
  companyId: CompanyId
}

export interface FactoryCodeRecord {
  id: string
  factoryCode: string
  factoryName: string
  factoryNameAr?: string
  city: string
  region: string
  activity: string
  product: string
  hsCode: string
  registrationNumber: string
}

export interface ReportConfig {
  id: string
  name: string
  nameAr: string
  icon?: string
}
