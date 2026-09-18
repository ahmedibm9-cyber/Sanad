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
          <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="/projects/:id" element={<ErrorBoundary><ProjectDetailPage /></ErrorBoundary>} />
            <Route path="/tasks" element={<ErrorBoundary><TasksPage /></ErrorBoundary>} />
            <Route path="/tasks/:id" element={<ErrorBoundary><TaskDetailPage /></ErrorBoundary>} />
            <Route path="/todos" element={<ErrorBoundary><TodosPage /></ErrorBoundary>} />
            <Route path="/customers" element={<ErrorBoundary><CustomersPage /></ErrorBoundary>} />
            <Route path="/customers/:id" element={<ErrorBoundary><CustomerDetailPage /></ErrorBoundary>} />
            <Route path="/materials" element={<ErrorBoundary><MaterialsPage /></ErrorBoundary>} />
            <Route path="/materials/:id" element={<ErrorBoundary><MaterialDetailPage /></ErrorBoundary>} />
            <Route path="/factory" element={<ErrorBoundary><FactoryCodePage /></ErrorBoundary>} />
            <Route path="/reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
            <Route path="/activity" element={<ErrorBoundary><ActivityPage /></ErrorBoundary>} />
            <Route path="/trash" element={<ErrorBoundary><TrashPage /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/settings/lists" element={<ErrorBoundary><ConfigurableListsPage /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
            <Route path="/users" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
            <Route path="/documents" element={<ErrorBoundary><DocumentsPage /></ErrorBoundary>} />
            <Route path="/documents/:id/form" element={<ErrorBoundary><DocumentFormPage /></ErrorBoundary>} />
            <Route path="/documents/:id/preview" element={<ErrorBoundary><DocumentPreviewPage /></ErrorBoundary>} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
