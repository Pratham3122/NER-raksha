import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';

const CommandCenter = React.lazy(() => import('./pages/CommandCenter'));
const RoadNetwork = React.lazy(() => import('./pages/RoadNetwork'));
const IncidentCenter = React.lazy(() => import('./pages/IncidentCenter'));
const FieldReports = React.lazy(() => import('./pages/FieldReports'));
const Vehicles = React.lazy(() => import('./pages/Vehicles'));
const Deliveries = React.lazy(() => import('./pages/Deliveries'));
const RiskAnalysis = React.lazy(() => import('./pages/RiskAnalysis'));
const RoutePlanner = React.lazy(() => import('./pages/RoutePlanner'));
const AlertsPage = React.lazy(() => import('./pages/Alerts'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const DataSourcesPage = React.lazy(() => import('./pages/DataSources'));
const SystemHealth = React.lazy(() => import('./pages/SystemHealth'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0F172A] text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          LOADING NER-RAKSHA...
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<CommandCenter />} />
          <Route path="roads" element={<RoadNetwork />} />
          <Route path="incidents" element={<IncidentCenter />} />
          <Route path="field-reports" element={<FieldReports />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="risk" element={<RiskAnalysis />} />
          <Route path="routes" element={<RoutePlanner />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="system" element={<SystemHealth />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
