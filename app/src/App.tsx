import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/common/ErrorBoundary'
import OfflineBanner from './components/common/OfflineBanner'
import AppLayout from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'))
const TodosPage = lazy(() => import('./pages/TodosPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'))
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'))
const MaterialDetailPage = lazy(() => import('./pages/MaterialDetailPage'))
const FactoryCodePage = lazy(() => import('./pages/FactoryCodePage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ActivityPage = lazy(() => import('./pages/ActivityPage'))
const TrashPage = lazy(() => import('./pages/TrashPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ConfigurableListsPage = lazy(() => import('./pages/ConfigurableListsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const DocumentFormPage = lazy(() => import('./pages/DocumentFormPage'))
const DocumentPreviewPage = lazy(() => import('./pages/DocumentPreviewPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/factory" element={<FactoryCodePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/lists" element={<ConfigurableListsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id/form" element={<DocumentFormPage />} />
            <Route path="/documents/:id/preview" element={<DocumentPreviewPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
