import { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  Check,
  Building2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react'
import Modal from '../common/Modal'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCompanies } from '../../hooks/useData'
import { getAuthService } from '../../lib/auth'
import { getMembershipService } from '../../lib/services/membership'
import { getAuditService } from '../../lib/services/audit'
import { useAuth } from '../../contexts/AuthContext'
import { useCompany } from '../../contexts/CompanyContext'
import type { User, Permission, CompanyId, CompanyMembership } from '../../types'
import { appLogger } from '../../lib/logger'

// ─── Permission Group Definitions (same as UsersPage) ─────
interface PermissionGroup {
  key: string
  labelEn: string
  labelAr: string
  permissions: { key: Permission; labelEn: string; labelAr: string; critical?: boolean }[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'projects',
    labelEn: 'Projects',
    labelAr: 'المشاريع',
    permissions: [
      { key: 'projects.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'projects.create', labelEn: 'Create', labelAr: 'إنشاء' },
      { key: 'projects.edit', labelEn: 'Edit', labelAr: 'تعديل' },
      { key: 'projects.archive', labelEn: 'Archive', labelAr: 'أرشفة' },
      { key: 'projects.reopen', labelEn: 'Reopen', labelAr: 'إعادة فتح' },
      { key: 'projects.pin', labelEn: 'Pin', labelAr: 'تثبيت' },
      { key: 'projects.delete', labelEn: 'Delete', labelAr: 'حذف' },
    ],
  },
  {
    key: 'tasks',
    labelEn: 'Tasks',
    labelAr: 'المهام',
    permissions: [
      { key: 'tasks.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'tasks.create', labelEn: 'Create', labelAr: 'إنشاء' },
      { key: 'tasks.edit', labelEn: 'Edit', labelAr: 'تعديل' },
      { key: 'tasks.convert_to_project', labelEn: 'Convert to Project', labelAr: 'تحويل إلى مشروع' },
      { key: 'tasks.archive', labelEn: 'Archive', labelAr: 'أرشفة' },
      { key: 'tasks.delete', labelEn: 'Delete', labelAr: 'حذف' },
    ],
  },
  {
    key: 'documents',
    labelEn: 'Documents',
    labelAr: 'المستندات',
    permissions: [
      { key: 'documents.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'documents.create', labelEn: 'Create', labelAr: 'إنشاء' },
      { key: 'documents.edit', labelEn: 'Edit', labelAr: 'تعديل' },
      { key: 'documents.print', labelEn: 'Print', labelAr: 'طباعة' },
      { key: 'documents.download', labelEn: 'Download', labelAr: 'تحميل' },
      { key: 'documents.delete', labelEn: 'Delete', labelAr: 'حذف' },
    ],
  },
  {
    key: 'customers',
    labelEn: 'Customers',
    labelAr: 'العملاء',
    permissions: [
      { key: 'customers.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'customers.create', labelEn: 'Create', labelAr: 'إنشاء' },
      { key: 'customers.edit', labelEn: 'Edit', labelAr: 'تعديل' },
      { key: 'customers.delete', labelEn: 'Delete', labelAr: 'حذف' },
      { key: 'customers.export', labelEn: 'Export', labelAr: 'تصدير' },
    ],
  },
  {
    key: 'materials',
    labelEn: 'Materials',
    labelAr: 'المواد',
    permissions: [
      { key: 'materials.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'materials.create', labelEn: 'Create', labelAr: 'إنشاء' },
      { key: 'materials.edit', labelEn: 'Edit', labelAr: 'تعديل' },
      { key: 'materials.delete', labelEn: 'Delete', labelAr: 'حذف' },
      { key: 'materials.files.manage', labelEn: 'Manage Files', labelAr: 'إدارة الملفات' },
    ],
  },
  {
    key: 'files',
    labelEn: 'Files',
    labelAr: 'الملفات',
    permissions: [
      { key: 'files.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'files.upload', labelEn: 'Upload', labelAr: 'رفع' },
      { key: 'files.download', labelEn: 'Download', labelAr: 'تحميل' },
      { key: 'files.delete', labelEn: 'Delete', labelAr: 'حذف' },
    ],
  },
  {
    key: 'reports',
    labelEn: 'Reports',
    labelAr: 'التقارير',
    permissions: [
      { key: 'reports.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'reports.export_pdf', labelEn: 'Export PDF', labelAr: 'تصدير PDF' },
      { key: 'reports.export_excel', labelEn: 'Export Excel', labelAr: 'تصدير Excel' },
    ],
  },
  {
    key: 'users',
    labelEn: 'Users',
    labelAr: 'المستخدمون',
    permissions: [
      { key: 'users.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'users.create', labelEn: 'Create User', labelAr: 'إنشاء مستخدم', critical: true },
      { key: 'users.edit', labelEn: 'Edit User', labelAr: 'تعديل مستخدم' },
      { key: 'users.permissions.manage', labelEn: 'Manage Permissions', labelAr: 'إدارة الصلاحيات', critical: true },
      { key: 'users.disable', labelEn: 'Disable User', labelAr: 'تعطيل مستخدم' },
    ],
  },
  {
    key: 'audit',
    labelEn: 'Activity',
    labelAr: 'النشاط',
    permissions: [
      { key: 'audit.view', labelEn: 'View Activity Log', labelAr: 'عرض سجل النشاط' },
    ],
  },
  {
    key: 'trash',
    labelEn: 'Trash',
    labelAr: 'سلة المهملات',
    permissions: [
      { key: 'trash.view', labelEn: 'View Trash', labelAr: 'عرض سلة المهملات' },
      { key: 'trash.restore', labelEn: 'Restore', labelAr: 'استعادة' },
      { key: 'trash.hard_delete', labelEn: 'Permanent Delete', labelAr: 'حذف دائم', critical: true },
    ],
  },
  {
    key: 'factory',
    labelEn: 'Factory Code',
    labelAr: 'أكواد المصانع',
    permissions: [
      { key: 'factory.view', labelEn: 'View', labelAr: 'عرض' },
      { key: 'factory.export', labelEn: 'Export', labelAr: 'تصدير' },
      { key: 'factory.import_update', labelEn: 'Import / Update', labelAr: 'استيراد / تحديث', critical: true },
    ],
  },
  {
    key: 'backup',
    labelEn: 'Backup',
    labelAr: 'النسخ الاحتياطي',
    permissions: [
      { key: 'backup.create', labelEn: 'Create Backup', labelAr: 'إنشاء نسخة احتياطية' },
      { key: 'backup.restore', labelEn: 'Restore Backup', labelAr: 'استعادة نسخة احتياطية', critical: true },
    ],
  },
  {
    key: 'settings',
    labelEn: 'Settings',
    labelAr: 'الإعدادات',
    permissions: [
      { key: 'settings.view', labelEn: 'View Settings', labelAr: 'عرض الإعدادات' },
      { key: 'settings.edit', labelEn: 'Edit Settings', labelAr: 'تعديل الإعدادات', critical: true },
    ],
  },
]

const CRITICAL_PERMISSIONS = new Set<Permission>(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.filter((p) => p.critical).map((p) => p.key))
)

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))

// ─── Types ────────────────────────────────────────────────
interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (user: User) => void
  user?: User | null
}

type CompanyAccessState = Record<CompanyId, boolean>
type CompanyRoleState = Record<CompanyId, 'user' | 'viewer'>
type CompanyPermState = Record<CompanyId, Record<Permission, boolean>>

// ─── Helper: build empty permission map ────────────────────
function emptyPermMap(): Record<Permission, boolean> {
  const map = {} as Record<Permission, boolean>
  ALL_PERMISSION_KEYS.forEach((k) => { map[k] = false })
  return map
}

// ─── Component ────────────────────────────────────────────
export default function UserFormModal({ open, onClose, onSave, user }: UserFormModalProps) {
  const { t } = useLanguage()
  const { data: companies } = useCompanies()
  const isEdit = !!user

  // ─── User info state ────────────────────────────────────
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'user' | 'viewer'>('user')

  // ─── Company access / roles / permissions ────────────────
  const [companyAccess, setCompanyAccess] = useState<CompanyAccessState>(() => {
    const init: CompanyAccessState = {}
    ;(companies || []).forEach((c) => { init[c.id] = false })
    return init
  })

  const [companyRoles, setCompanyRoles] = useState<CompanyRoleState>(() => {
    const init: CompanyRoleState = {}
    ;(companies || []).forEach((c) => { init[c.id] = 'user' })
    return init
  })

  const [companyPerms, setCompanyPerms] = useState<CompanyPermState>(() => {
    const init: CompanyPermState = {}
    ;(companies || []).forEach((c) => { init[c.id] = emptyPermMap() })
    return init
  })

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(PERMISSION_GROUPS.map((g) => g.key)))

  // ─── Populate form when user prop changes ────────────────
  useEffect(() => {
    if (!open) return
    if (user) {
      setName(user.name)
      setNameAr(user.nameAr || '')
      setEmail(user.email)
      setRole(user.role === 'admin' ? 'admin' : user.role)

      const access: CompanyAccessState = {}
      const roles: CompanyRoleState = {}
      const perms: CompanyPermState = {}
      ;(companies || []).forEach((c) => {
        const m = user.memberships.find((mem) => mem.companyId === c.id)
        access[c.id] = !!m
        roles[c.id] = m ? (m.role === 'admin' ? 'user' : m.role) : 'user'
        const pmap = emptyPermMap()
        if (m) {
          m.permissions.forEach((p) => { pmap[p] = true })
        }
        perms[c.id] = pmap
      })
      setCompanyAccess(access)
      setCompanyRoles(roles)
      setCompanyPerms(perms)
    } else {
      // Reset for create mode
      setName('')
      setNameAr('')
      setEmail('')
      setRole('user')
      const access: CompanyAccessState = {}
      const roles: CompanyRoleState = {}
      const perms: CompanyPermState = {}
      ;(companies || []).forEach((c) => {
        access[c.id] = false
        roles[c.id] = 'user'
        perms[c.id] = emptyPermMap()
      })
      setCompanyAccess(access)
      setCompanyRoles(roles)
      setCompanyPerms(perms)
    }
    setExpandedGroups(new Set(PERMISSION_GROUPS.map((g) => g.key)))
  }, [open, user, companies])

  // ─── Company access toggle ───────────────────────────────
  const toggleCompanyAccess = (companyId: CompanyId) => {
    setCompanyAccess((prev) => ({ ...prev, [companyId]: !prev[companyId] }))
  }

  // ─── Company role change ─────────────────────────────────
  const setCompanyRole = (companyId: CompanyId, r: 'user' | 'viewer') => {
    setCompanyRoles((prev) => ({ ...prev, [companyId]: r }))
  }

  // ─── Toggle group expansion ──────────────────────────────
  const toggleExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  // ─── Toggle a permission for a company ───────────────────
  const togglePermission = (companyId: CompanyId, perm: Permission) => {
    setCompanyPerms((prev) => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [perm]: !prev[companyId][perm],
      },
    }))
  }

  // ─── Toggle all in group for a company ───────────────────
  const toggleGroup = (companyId: CompanyId, groupKey: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    const allChecked = group.permissions.every((p) => companyPerms[companyId][p.key])
    setCompanyPerms((prev) => {
      const next = { ...prev[companyId] }
      group.permissions.forEach((p) => { next[p.key] = !allChecked })
      return { ...prev, [companyId]: next }
    })
  }

  // ─── Select all / none for a company ─────────────────────
  const toggleAll = (companyId: CompanyId, checked: boolean) => {
    setCompanyPerms((prev) => {
      const next = { ...prev[companyId] } as Record<Permission, boolean>
      ALL_PERMISSION_KEYS.forEach((k) => { next[k] = checked })
      return { ...prev, [companyId]: next }
    })
  }

  // ─── Count permissions for a company ─────────────────────
  const countChecked = (companyId: CompanyId) => {
    return ALL_PERMISSION_KEYS.filter((k) => companyPerms[companyId][k]).length
  }

  // ─── Validate & Save ────────────────────────────────────
  const canSave = useMemo(() => {
    return name.trim() !== '' && email.trim() !== '' && (companies || []).some((c) => companyAccess[c.id])
  }, [name, email, companyAccess, companies])

  const [saving, setSaving] = useState(false)
  const { user: authUser } = useAuth()
  const { currentCompany } = useCompany()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const memberships: CompanyMembership[] = (companies || [])
        .filter((c) => companyAccess[c.id])
        .map((c) => ({
          companyId: c.id,
          role: companyRoles[c.id],
          permissions: ALL_PERMISSION_KEYS.filter((k) => companyPerms[c.id][k]),
        }))

      if (isEdit && user) {
        // Update existing user - just call onSave with updated data
        const savedUser: User = {
          id: user.id,
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          email: email.trim(),
          role,
          memberships,
        }
        onSave(savedUser)
      } else {
        // Create new user via Supabase Auth
        const authService = getAuthService()
        const defaultPassword = crypto.randomUUID().slice(0, 12) + '!A1' // Generated password - user should change on first login
        const session = await authService.signUp({
          email: email.trim(),
          password: defaultPassword,
          displayName: name.trim(),
        })

        // Create memberships for the new user
        const membershipService = getMembershipService()
        const ctx = {
          userId: authUser?.id || '',
          companyId: currentCompany?.id || '',
          permissions: {},
          isSystemAdmin: authUser?.isSystemAdmin || false,
        }

        for (const membership of memberships) {
          try {
            await membershipService.createMembership({
              company_id: membership.companyId,
              user_id: session.user.id,
              base_role: membership.role as 'admin' | 'user' | 'viewer',
            }, ctx)
          } catch (err) {
            appLogger.error('Failed to create membership', err)
          }
        }

        // Audit logging
        try {
          const auditService = getAuditService()
          await auditService.logEvent({
            action: 'CREATE',
            entityType: 'user',
            entityId: session.user.id,
            entityReference: email.trim(),
            after: { email: email.trim(), name: name.trim(), memberships },
          }, ctx)
        } catch {
          // Audit logging is non-critical
        }

        const savedUser: User = {
          id: session.user.id,
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          email: email.trim(),
          role,
          memberships,
        }
        onSave(savedUser)
      }
      onClose()
    } catch (err) {
      appLogger.error('Failed to save user', err)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('Edit User', 'تعديل المستخدم') : t('Create User', 'إنشاء مستخدم')}
      subtitle={isEdit ? t('Update user information and permissions', 'تحديث معلومات المستخدم والصلاحيات') : t('Add a new user with company access', 'إضافة مستخدم جديد مع وصول الشركات')}
      size="xl"
      footer={
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn-ghost text-sm">
            {t('Cancel', 'إلغاء')}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('Saving...', 'جاري الحفظ...')}
              </>
            ) : (
              isEdit ? t('Update User', 'تحديث المستخدم') : t('Create User', 'إنشاء المستخدم')
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ═══ Section 1: User Information ═══════════════════ */}
        <div>
          <h3 className="text-sm font-semibold text-brand-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">1</div>
            {t('User Information', 'معلومات المستخدم')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t('Name', 'الاسم')}</label>
              <input
                type="text"
                className="input-field"
                placeholder={t('e.g. John Smith', 'مثال: محمد الحسن')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">{t('Arabic Name', 'الاسم بالعربي')}</label>
              <input
                type="text"
                className="input-field"
                placeholder={t('Arabic name (optional)', 'الاسم بالعربي (اختياري)')}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div>
              <label className="label-field">{t('Email', 'البريد الإلكتروني')}</label>
              <input
                type="email"
                className="input-field"
                placeholder={t('user@example.com', 'user@example.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">{t('Global Role', 'الدور العام')}</label>
              <select
                className="select-field"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user' | 'viewer')}
              >
                <option value="admin">{t('Admin', 'مدير')}</option>
                <option value="user">{t('User', 'مستخدم')}</option>
                <option value="viewer">{t('Viewer', 'مشاهد')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ═══ Section 2: Company Access ═════════════════════ */}
        <div>
          <h3 className="text-sm font-semibold text-brand-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">2</div>
            {t('Company Access', 'وصول الشركات')}
          </h3>
          <div className="space-y-2">
            {(companies || []).map((company) => {
              const isEnabled = companyAccess[company.id]
              return (
                <div key={company.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isEnabled ? 'border-brand-200 bg-brand-50/30' : 'border-gray-100 bg-gray-50/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-brand-100' : 'bg-gray-100'}`}>
                      <Building2 className={`w-4 h-4 ${isEnabled ? 'text-brand-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isEnabled ? 'text-brand-900' : 'text-gray-600'}`}>{(company as any).nameEn || (company as any).name_en}</p>
                      <p className="text-xs text-gray-400">{(company as any).code || (company as any).company_code}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompanyAccess(company.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-7 h-7 text-brand-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-gray-300" />
                    )}
                    <span className={`text-xs font-medium ${isEnabled ? 'text-brand-600' : 'text-gray-400'}`}>
                      {isEnabled ? t('Enabled', 'مفعّل') : t('Disabled', 'معطّل')}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ Section 3: Per-company Permissions ════════════ */}
        {(companies || []).some((c) => companyAccess[c.id]) && (
          <div>
            <h3 className="text-sm font-semibold text-brand-900 mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">3</div>
              {t('Permissions', 'الصلاحيات')}
            </h3>
            <div className="space-y-4">
              {(companies || [])
                .filter((c) => companyAccess[c.id])
                .map((company) => (
                  <CompanyPermissionPanel
                    key={company.id}
                    company={company}
                    companyRole={companyRoles[company.id]}
                    onRoleChange={(r) => setCompanyRole(company.id, r)}
                    permissions={companyPerms[company.id]}
                    expandedGroups={expandedGroups}
                    onToggleExpand={toggleExpand}
                    onTogglePermission={(perm) => togglePermission(company.id, perm)}
                    onToggleGroup={(groupKey) => toggleGroup(company.id, groupKey)}
                    onToggleAll={(checked) => toggleAll(company.id, checked)}
                    checkedCount={countChecked(company.id)}
                    totalCount={ALL_PERMISSION_KEYS.length}
                    t={t}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Sub-component: per-company permission panel ──────────
interface CompanyPermissionPanelProps {
  company: { id: CompanyId; nameEn?: string; name?: string; code?: string }
  companyRole: 'user' | 'viewer'
  onRoleChange: (r: 'user' | 'viewer') => void
  permissions: Record<Permission, boolean>
  expandedGroups: Set<string>
  onToggleExpand: (groupKey: string) => void
  onTogglePermission: (perm: Permission) => void
  onToggleGroup: (groupKey: string) => void
  onToggleAll: (checked: boolean) => void
  checkedCount: number
  totalCount: number
  t: (en: string, ar: string) => string
}

function CompanyPermissionPanel({
  company,
  companyRole,
  onRoleChange,
  permissions,
  expandedGroups,
  onToggleExpand,
  onTogglePermission,
  onToggleGroup,
  onToggleAll,
  checkedCount,
  totalCount,
  t,
}: CompanyPermissionPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Company header with role selector */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-brand-100 rounded-md">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">{(company as any).nameEn || (company as any).name_en}</p>
            <p className="text-[10px] text-gray-400">{(company as any).code || (company as any).company_code || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t('Role', 'الدور')}:</span>
          <select
            className="select-field text-xs py-1 px-2"
            value={companyRole}
            onChange={(e) => onRoleChange(e.target.value as 'user' | 'viewer')}
          >
            <option value="user">{t('User', 'مستخدم')}</option>
            <option value="viewer">{t('Viewer', 'مشاهد')}</option>
          </select>
        </div>
      </div>

      {/* Select All / None toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAll(true)}
            className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            {t('Select All', 'تحديد الكل')}
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => onToggleAll(false)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('Deselect All', 'إلغاء تحديد الكل')}
          </button>
        </div>
        <span className="text-xs text-gray-400">
          {checkedCount} / {totalCount} {t('permissions', 'صلاحيات')}
        </span>
        <div className="flex items-center gap-1 text-xs text-red-500 ml-auto">
          <AlertTriangle className="w-3 h-3" />
          <span>{t('Red = Critical permission', 'أحمر = صلاحية حساسة')}</span>
        </div>
      </div>

      {/* Permission groups */}
      <div className="p-3 space-y-1">
        {PERMISSION_GROUPS.map((group) => {
          const isExpanded = expandedGroups.has(group.key)
          const groupPerms = group.permissions
          const checkedInGroup = groupPerms.filter((p) => permissions[p.key]).length
          const allInGroup = groupPerms.length

          return (
            <div key={group.key} className="border border-gray-100 rounded-lg overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => onToggleExpand(group.key)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
                <Shield className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-medium text-brand-900">{t(group.labelEn, group.labelAr)}</span>
                <span className="text-[10px] text-gray-400">
                  {checkedInGroup}/{allInGroup}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleGroup(group.key)
                  }}
                  className="ml-auto text-[11px] text-brand-600 hover:text-brand-800 font-medium"
                >
                  {checkedInGroup === allInGroup ? t('None', 'لا شيء') : t('All', 'الكل')}
                </button>
              </button>

              {/* Permission checkboxes */}
              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {groupPerms.map((perm) => {
                    const isChecked = permissions[perm.key]
                    const isCrit = CRITICAL_PERMISSIONS.has(perm.key)

                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all hover:bg-gray-50 ${
                          isChecked && isCrit ? 'bg-red-50 border border-red-200' : isChecked ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onTogglePermission(perm.key)}
                          className={`w-3.5 h-3.5 rounded border-gray-300 ${
                            isCrit ? 'text-red-600 focus:ring-red-500' : 'text-brand-600 focus:ring-brand-500'
                          }`}
                        />
                        <span className={`font-medium ${
                          isChecked && isCrit ? 'text-red-700' : isChecked ? 'text-brand-700' : 'text-gray-500'
                        }`}>
                          {t(perm.labelEn, perm.labelAr)}
                        </span>
                        {isCrit && (
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
