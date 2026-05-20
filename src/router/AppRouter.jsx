import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Clients from '../pages/Clients.jsx';
import ClientDetail from '../pages/ClientDetail.jsx';
import Contracts from '../pages/Contracts.jsx';
import ContractDetail from '../pages/ContractDetail.jsx';
import ScopeChanges from '../pages/ScopeChanges.jsx';
import Invoices from '../pages/Invoices.jsx';
import Licenses from '../pages/Licenses.jsx';
import Alerts from '../pages/Alerts.jsx';
import CollectionsProjection from '../pages/CollectionsProjection.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="clientes/:clientId" element={<ClientDetail />} />
          <Route path="contratos" element={<Contracts />} />
          <Route path="contratos/:contractId" element={<ContractDetail />} />
          <Route path="cambios-de-alcance" element={<ScopeChanges />} />
          <Route path="facturacion" element={<Invoices />} />
          <Route path="licenciamiento" element={<Licenses />} />
          <Route path="alertas" element={<Alerts />} />
          <Route path="proyeccion-cobranzas" element={<CollectionsProjection />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
