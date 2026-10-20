import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import {
  ClientesPage,
  ProductosPage,
  LotesPage,
  EmbarquesPage,
  FinanzasPage,
  UsuariosPage,
} from './pages/admin/PanelPages';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerLayout from './components/layout/WorkerLayout';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientLayout from './components/layout/ClientLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme } = useTheme();

  return (
    <>
      {/* Sistema Global de Notificaciones */}
      <Toaster
        theme={theme}
        position="top-right"
        richColors
        toastOptions={{
          className: '!rounded-2xl !p-4 !shadow-2xl !font-sans !border',
        }}
      />

      <Routes>
        {/* ── Rutas Públicas (Sin requerir Login) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />

        {/* ── Dashboard Analítico Reservado Exclusivamente para Admin y Trabajador ── */}
        <Route
          path="/analitica"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TRABAJADOR']}>
              <AnalyticsDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ── Portal Exclusivo de Planta (Trabajador) Totalmente Separado ── */}
        <Route
          path="/trabajador"
          element={
            <ProtectedRoute allowedRoles={['TRABAJADOR']}>
              <WorkerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkerDashboard />} />
        </Route>

        {/* ── Portal Exclusivo B2B Internacional (Cliente) Totalmente Separado ── */}
        <Route
          path="/cliente"
          element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
        </Route>

        {/* ── Portal Exclusivo de Administración (Admin Dashboard) ── */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Panel 0: Resumen Ejecutivo */}
          <Route index element={<AdminDashboard />} />

          {/* Panel 1: Clientes B2B */}
          <Route path="clientes" element={<ClientesPage />} />

          {/* Panel 2: Productos & Proveedores */}
          <Route path="productos" element={<ProductosPage />} />

          {/* Panel 3: Lotes & Calidad */}
          <Route path="lotes" element={<LotesPage />} />

          {/* Panel 4: Órdenes & Embarques */}
          <Route path="embarques" element={<EmbarquesPage />} />

          {/* Panel 5: Finanzas & Facturación */}
          <Route path="finanzas" element={<FinanzasPage />} />

          {/* Panel 6: Usuarios & Auditoría */}
          <Route path="usuarios" element={<UsuariosPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

