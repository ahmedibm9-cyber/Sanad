import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Users,
  Plus,
  Edit3,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  Check,
  Search,
  X,
  UserCheck,
  Building2,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompany } from '../contexts/CompanyContext'
import { useApp } from '../contexts/AppContext'
import { users as mockUsers, companies } from '../data/mockData'
import type { User, Permission, CompanyId } from '../types'
import UserFormModal from '../components/users/UserFormModal'

// ─── Permission Group Definitions ────────────────────────────
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

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

// ─── Indeterminate Checkbox Component ────────────────────────
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">{label}</span>
    </label>
  )
}

export default function UsersPage() {
  const { t } = useLanguage()
  const { currentCompany } = useCompany()
  const { currentUser } = useApp()

  // ─── Local users state (initialized from mock) ──────────
  const [usersList, setUsersList] = useState<User[]>(() => [...mockUsers])

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(PERMISSION_GROUPS.map((g) => g.key)))
  const [editingPermissions, setEditingPermissions] = useState<Record<Permission, boolean> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Modal state ─────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // ─── Success banner state ────────────────────────────────
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const selectedUser = useMemo(() => usersList.find((u) => u.id === selectedUserId) || null, [selectedUserId, usersList])

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList
    const q = searchQuery.toLowerCase()
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.nameAr?.includes(q)
    )
  }, [searchQuery, usersList])

  // Get company names for a user
  const getCompanyNames = (user: User) => {
    return user.memberships
      .map((m) => companies.find((c) => c.id === m.companyId)?.shortName || m.companyId)
      .join(', ')
  }

  // Get company-specific permissions for selected user
  const getCompanyPermissions = (userId: string, companyId: CompanyId): Permission[] => {
    const user = usersList.find((u) => u.id === userId)
    if (!user) return []
    const membership = user.memberships.find((m) => m.companyId === companyId)
    return membership?.permissions || []
  }

  // Select a user
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setEditingPermissions(null)
  }

  // Start editing permissions
  const handleStartEdit = (companyId: CompanyId) => {
    if (!selectedUserId) return
    const perms = getCompanyPermissions(selectedUserId, companyId)
    const allPermissions = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    const permMap: Record<Permission, boolean> = {} as Record<Permission, boolean>
    allPermissions.forEach((p) => {
      permMap[p] = perms.includes(p)
    })
    setEditingPermissions(permMap)
  }

  // Toggle a permission
  const togglePermission = (perm: Permission) => {
    if (!editingPermissions) return
    setEditingPermissions((prev) => {
      if (!prev) return prev
      return { ...prev, [perm]: !prev[perm] }
    })
  }

  // Toggle all in group
  const toggleGroup = (groupKey: string) => {
    if (!editingPermissions) return
    const group = PERMISSION_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    const allChecked = group.permissions.every((p) => editingPermissions[p.key])
    setEditingPermissions((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      group.permissions.forEach((p) => {
        next[p.key] = !allChecked
      })
      return next
    })
  }

  // Select all / none
  const toggleAll = (checked: boolean) => {
    if (!editingPermissions) return
    setEditingPermissions((prev) => {
      if (!prev) return prev
      const next = { ...prev } as Record<Permission, boolean>
      ;(Object.keys(next) as Permission[]).forEach((k) => {
        next[k] = checked
      })
      return next
    })
  }

  // Save (mock)
  const handleSavePermissions = () => {
    setEditingPermissions(null)
  }

  // ─── Toggle group expansion ─────────────────────────────
  const toggleExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  // ─── Open create modal ──────────────────────────────────
  const handleCreateUser = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  // ─── Open edit modal ────────────────────────────────────
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }, [])

  // ─── Save from modal ────────────────────────────────────
  const handleFormSave = (savedUser: User) => {
    setUsersList((prev) => {
      const idx = prev.findIndex((u) => u.id === savedUser.id)
      if (idx >= 0) {
        // Update existing
        const next = [...prev]
        next[idx] = savedUser
        return next
      }
      // Create new
      return [...prev, savedUser]
    })

    // Update selected user if it's the one being edited
    if (editingUser && selectedUserId === editingUser.id) {
      // Will re-render via state update
    }

    const isEdit = !!editingUser
    setSuccessMessage(
      isEdit
        ? t('User updated successfully', 'تم تحديث المستخدم بنجاح')
        : t('User created successfully', 'تم إنشاء المستخدم بنجاح')
    )
    setEditingUser(null)
  }

  // ─── Count permissions ──────────────────────────────────
  const countChecked = editingPermissions
    ? (Object.values(editingPermissions) as boolean[]).filter(Boolean).length
    : 0
  const countTotal = editingPermissions ? Object.keys(editingPermissions).length : 0

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('Users & Permissions', 'المستخدمون والصلاحيات')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Manage team access and permission levels', 'إدارة وصول الفريق ومستويات الصلاحيات')}
          </p>
        </div>
        <button className="btn-primary gap-2" onClick={handleCreateUser}>
          <Plus className="w-4 h-4" />
          {t('Create User', 'إنشاء مستخدم')}
        </button>
      </div>

      {/* ─── Success Banner ──────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium animate-in fade-in">
          <Check className="w-4 h-4 text-green-600" />
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ms-auto text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── User List Table ────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field ps-9"
              placeholder={t('Search users...', 'بحث في المستخدمين...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {filteredUsers.length} {t('user(s)', 'مستخدم(ين)')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-start px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('User', 'المستخدم')}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Email', 'البريد الإلكتروني')}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Role', 'الدور')}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Companies', 'الشركات')}</th>
                <th className="text-end px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id
                return (
                  <tr
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`table-row-hover cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'viewer' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-900">{user.name}</p>
                          {user.nameAr && <p className="text-xs text-gray-400">{user.nameAr}</p>}
                        </div>
                        {user.id === currentUser.id && (
                          <span className="status-badge bg-brand-100 text-brand-700 text-[10px]">{t('You', 'أنت')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`status-badge ${ROLE_COLORS[user.role]}`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'viewer' ? 'Viewer' : 'User'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-600">{getCompanyNames(user)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditUser(user)
                        }}
                        className="btn-ghost gap-1.5 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {t('Edit', 'تعديل')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── User Detail / Permissions Section ──────────────── */}
      {selectedUser && (
        <div className="space-y-4">
          {/* User header */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : selectedUser.role === 'viewer' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-brand-900">{selectedUser.name}</h2>
                  {selectedUser.nameAr && <span className="text-sm text-gray-400">{selectedUser.nameAr}</span>}
                </div>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <span className={`status-badge ${ROLE_COLORS[selectedUser.role]}`}>
                {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'viewer' ? 'Viewer' : 'User'}
              </span>
            </div>
          </div>

          {/* Company Memberships with Permissions */}
          {selectedUser.memberships.map((membership) => {
            const company = companies.find((c) => c.id === membership.companyId)
            if (!company) return null
            const isEditing = editingPermissions !== null
            const currentPerms = getCompanyPermissions(selectedUser.id, membership.companyId)

            return (
              <div key={membership.companyId} className="card overflow-hidden">
                {/* Company header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-brand-900">{company.nameEn}</h3>
                        <span className="status-badge bg-gray-100 text-gray-600 text-[10px]">
                          {membership.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{company.code} — {company.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button onClick={() => handleStartEdit(membership.companyId)} className="btn-secondary gap-1.5 text-xs">
                        <Edit3 className="w-3.5 h-3.5" />
                        {t('Edit Permissions', 'تعديل الصلاحيات')}
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setEditingPermissions(null)} className="btn-ghost text-xs">
                          {t('Cancel', 'إلغاء')}
                        </button>
                        <button onClick={handleSavePermissions} className="btn-primary gap-1.5 text-xs">
                          <Check className="w-3.5 h-3.5" />
                          {t('Save', 'حفظ')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Permission Grid */}
                <div className="p-5">
                  {isEditing && (
                    <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAll(true)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
                        >
                          {t('Select All', 'تحديد الكل')}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => toggleAll(false)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {t('Deselect All', 'إلغاء تحديد الكل')}
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        {countChecked} / {countTotal} {t('permissions', 'صلاحيات')}
                      </span>
                      {CRITICAL_PERMISSIONS.size > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-500 ms-auto">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t('Red = Critical permission', 'أحمر = صلاحية حساسة')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    {PERMISSION_GROUPS.map((group) => {
                      const isExpanded = expandedGroups.has(group.key)
                      const groupPerms = group.permissions
                      const checkedInGroup = isEditing
                        ? groupPerms.filter((p) => editingPermissions?.[p.key]).length
                        : groupPerms.filter((p) => currentPerms.includes(p.key)).length
                      const allInGroup = groupPerms.length

                      return (
                        <div key={group.key} className="border border-gray-100 rounded-lg overflow-hidden">
                          {/* Group header */}
                          <button
                            onClick={() => toggleExpand(group.key)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <Shield className="w-4 h-4 text-brand-500" />
                            <span className="text-sm font-medium text-brand-900">{t(group.labelEn, group.labelAr)}</span>
                            <span className="text-xs text-gray-400">
                              {checkedInGroup}/{allInGroup}
                            </span>
                            {isEditing && (
                              <div className="ms-auto" onClick={(e) => e.stopPropagation()}>
                                <IndeterminateCheckbox
                                  checked={checkedInGroup === allInGroup}
                                  indeterminate={checkedInGroup > 0 && checkedInGroup < allInGroup}
                                  onChange={() => toggleGroup(group.key)}
                                  label={t('Select All', 'تحديد الكل')}
                                />
                              </div>
                            )}
                          </button>

                          {/* Permission checkboxes */}
                          {isExpanded && (
                            <div className="px-4 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {groupPerms.map((perm) => {
                                const isChecked = isEditing
                                  ? editingPermissions?.[perm.key] ?? false
                                  : currentPerms.includes(perm.key)
                                const isCrit = CRITICAL_PERMISSIONS.has(perm.key)

                                return (
                                  <label
                                    key={perm.key}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                                      isEditing ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                                    } ${isChecked && isCrit ? 'bg-red-50 border border-red-200' : isChecked ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50 border border-gray-100'}`}
                                  >
                                    {isEditing ? (
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePermission(perm.key)}
                                        className={`w-3.5 h-3.5 rounded border-gray-300 ${
                                          isCrit ? 'text-red-600 focus:ring-red-500' : 'text-brand-600 focus:ring-brand-500'
                                        }`}
                                      />
                                    ) : (
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                        isChecked ? (isCrit ? 'bg-red-500 border-red-500' : 'bg-brand-500 border-brand-500') : 'border-gray-300 bg-white'
                                      }`}>
                                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                    )}
                                    <span className={`font-medium ${
                                      isChecked && isCrit ? 'text-red-700' : isChecked ? 'text-brand-700' : 'text-gray-500'
                                    }`}>
                                      {t(perm.labelEn, perm.labelAr)}
                                    </span>
                                    {isCrit && (
                                      <span title={t('Critical permission', 'صلاحية حساسة')}><AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" /></span>
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
              </div>
            )
          })}

          {selectedUser.memberships.length === 0 && (
            <div className="card empty-state">
              <UserCheck className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">{t('No company memberships', 'لا توجد عضويات في شركات')}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── User Form Modal ──────────────────────────────── */}
      <UserFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null) }}
        onSave={handleFormSave}
        user={editingUser}
      />
    </div>
  )
}
