import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layouts/DashboardLayout";

import Login from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { PatientList } from "./components/PatientList";
import { ReportEditor } from "./components/ReportEditor";
import { ReportTemplates } from "./components/ReportTemplates";
import { PatientRegistration } from "./components/PatientRegistration";
import QuadroLaudo from "./components/Gestao_de_laudos";
import ProtectedRoute from "./auth/ProtectedRoute";

const noop = () => undefined;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registration" element={<PatientRegistration />} />
        <Route
          path="/patients"
          element={<PatientList onPatientSelect={noop} />}
        />
        <Route
          path="/reports"
          element={<ReportEditor selectedPatient={null as any} />}
        />
        <Route
          path="/templates"
          element={
            <ReportTemplates onDeleteTemplate={noop} onUseTemplate={noop} />
          }
        />
        <Route path="/gestao-de-laudos" element={<QuadroLaudo />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
