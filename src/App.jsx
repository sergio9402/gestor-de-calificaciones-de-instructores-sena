import React, { useState } from 'react';
import Header from './components/Header';
import LoginView from './components/LoginView';
import InstructorDashboard from './components/InstructorDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import LearnerDashboard from './components/LearnerDashboard';
import InstructorDetailModal from './components/InstructorDetailModal';
import NotificationToast from './components/NotificationToast';
import useRoleDashboard from './hooks/useRoleDashboard';
import { getInstructorProfile } from './services/instructorService';
import { logout } from './services/authService';

function DashboardState({ loading, error, onRetry }) {
  if (loading) {
    return <p className="rounded-xl bg-white p-6 text-sm text-slate-600">Cargando información del panel...</p>;
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{error}</p>
        <button type="button" className="mt-3 font-bold underline" onClick={onRetry}>Reintentar</button>
      </div>
    );
  }
  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [detailInstructor, setDetailInstructor] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const dashboard = useRoleDashboard(currentUser || {});

  const handleLogin = (user) => {
    setCurrentUser(user);
    setToast({
      title: 'Sesión iniciada',
      message: `Bienvenido(a), ${user.name || user.nombre}.`,
    });
  };

  const handleUserUpdated = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setDetailInstructor(null);
    setToast({
      title: 'Sesión finalizada',
      message: 'Has salido de forma segura de la plataforma.',
    });
  };

  const handleSelectInstructor = async (instructor) => {
    setDetailInstructor(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const profile = await getInstructorProfile(instructor._id || instructor.id);
      setDetailInstructor(profile);
    } catch (loadError) {
      setDetailError(loadError.message || 'No se pudo cargar el perfil del instructor.');
    } finally {
      setDetailLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <NotificationToast notification={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (currentUser.role === 'aprendiz') {
    return <LearnerDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#39A900] selection:text-white">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardState
          loading={dashboard.loading}
          error={dashboard.error}
          onRetry={dashboard.refresh}
        />
        {!dashboard.loading && !dashboard.error && currentUser.role === 'instructor' && (
          <InstructorDashboard
            user={currentUser}
            instructor={dashboard.instructor}
            fichas={dashboard.fichas}
            onUpdateStatus={dashboard.changeInstructorStatus}
            onRefresh={dashboard.refresh}
          />
        )}
        {!dashboard.loading && !dashboard.error && currentUser.role === 'coordinator' && (
          <CoordinatorDashboard
            user={currentUser}
            instructors={dashboard.instructors}
            metrics={dashboard.metrics}
            onSelectInstructor={handleSelectInstructor}
            onRefresh={dashboard.refresh}
            onDataChanged={() => dashboard.refresh({ silent: true })}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </main>
      {currentUser.role === 'coordinator' && (
        <>
          {detailLoading && <p role="status" className="fixed bottom-4 right-4 rounded-lg bg-white p-3 text-sm shadow-lg">Cargando perfil...</p>}
          {detailError && (
            <div role="alert" className="fixed bottom-4 right-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {detailError}
              <button type="button" className="ml-3 underline" onClick={() => setDetailError('')}>Cerrar</button>
            </div>
          )}
          <InstructorDetailModal
            instructor={detailInstructor}
            isOpen={Boolean(detailInstructor)}
            onClose={() => setDetailInstructor(null)}
          />
        </>
      )}
      <NotificationToast notification={toast} onClose={() => setToast(null)} />
    </div>
  );
}
