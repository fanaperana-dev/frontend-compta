import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navigation from './components/Navigation';
import Clients from './pages/Clients';
import Factures from './pages/Factures';
import ClientsPage from './pages/ClientsPage';
import FournisseursPage from './pages/FournisseursPage';
import TiersPage from './pages/TiersPage';
import RHPage from './pages/RHPage';
import JournalPage from './pages/JournalPage';
import DashboardPage from './pages/DashboardPage';
import ModuleProtege from './components/ModuleProtege';
import SuperAdminEntreprises from './pages/superadmin/SuperAdminEntreprises';
import ProfilPage from './pages/ProfilPage';
import SuperAdminForfaits from './pages/superadmin/SuperAdminForfaits';
import NavigationAdmin from './components/NavigationAdmin';
import SuperAdminTemplates from './pages/superadmin/SuperAdminTemplates';
import SuperAdminTickets from './pages/superadmin/SuperAdminTickets';
import SuperAdminCorrections from './pages/superadmin/SuperAdminCorrections';
import SuperAdminImport from './pages/superadmin/SuperAdminImport';
import StocksPage from './pages/StocksPage';

function RouteAdmin({ children }) {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <NavigationAdmin>{children}</NavigationAdmin>;
}
// Route protégée entreprise
function RouteProtegee({ children }) {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (isAdmin) return <Navigate to="/admin" />;
  return <Navigation>{children}</Navigation>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
        />
        <Routes>
          {/* Page login */}
          <Route path="/login" element={<Login />} />

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Pages entreprise */}
          <Route path="/dashboard" element={
           <RouteProtegee>
             <ModuleProtege module="dashboard">
              <DashboardPage />
             </ModuleProtege>
           </RouteProtegee>
          } />
          <Route path="/clients" element={
           <RouteProtegee>
             <ModuleProtege module="clients">
              <ClientsPage />
             </ModuleProtege>
          </RouteProtegee>
          } />
          <Route path="/paiements" element={
            <RouteProtegee>
              <ModuleProtege module="paiements">
                <TiersPage />
              </ModuleProtege>
            </RouteProtegee>
          } />
          <Route path="/fournisseurs" element={
            <RouteProtegee>
              <ModuleProtege module="fournisseurs">
                <FournisseursPage />
              </ModuleProtege>
            </RouteProtegee>
          } />
          <Route path="/stocks" element={
            <RouteProtegee>
              <ModuleProtege module="stocks">
                <StocksPage />
              </ModuleProtege>
            </RouteProtegee>
          } />
          <Route path="/rh" element={
            <RouteProtegee>
              <ModuleProtege module="rh">
                <RHPage />
              </ModuleProtege>
            </RouteProtegee>
          } />
          
          <Route path="/journal" element={
            <RouteProtegee>
              <ModuleProtege module="journal">
                <JournalPage />
              </ModuleProtege>
            </RouteProtegee>
          } />
          <Route path="/profil" element={
            <RouteProtegee>
              <ProfilPage />
            </RouteProtegee>
          } />

          {/* Pages admin */}
          <Route path="/admin/entreprises" element={
            <RouteAdmin>
              <SuperAdminEntreprises />
            </RouteAdmin>
          } />
          <Route path="/admin/forfaits" element={
            <RouteAdmin>
              <SuperAdminForfaits />
            </RouteAdmin>
          } />
          <Route path="/admin/templates" element={
            <RouteAdmin>
              <SuperAdminTemplates />
            </RouteAdmin>
          } />
          <Route path="/admin/tickets" element={
            <RouteAdmin>
              <SuperAdminTickets />
            </RouteAdmin>
          } />
          <Route path="/admin/corrections" element={
            <RouteAdmin>
              <SuperAdminCorrections />
            </RouteAdmin>
          } />
          <Route path="/admin/import" element={
            <RouteAdmin>
              <SuperAdminImport />
            </RouteAdmin>
          } />
          <Route path="/admin" element={<Navigate to="/admin/entreprises" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;