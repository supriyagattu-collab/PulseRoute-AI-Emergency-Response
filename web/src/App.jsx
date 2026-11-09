import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { AiAssistancePage } from './pages/ai/AiAssistancePage';

// Reporter Pages
import { ReporterDashboard } from './pages/reporter/ReporterDashboard';
import { ReporterNewEmergency } from './pages/reporter/ReporterNewEmergency';
import { ReporterTracking } from './pages/reporter/ReporterTracking';
import { ReporterHistory } from './pages/reporter/ReporterHistory';
import { ReporterProfile } from './pages/reporter/ReporterProfile';

// Driver Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverRequests } from './pages/driver/DriverRequests';
import { DriverActiveTrip } from './pages/driver/DriverActiveTrip';
import { DriverHistory } from './pages/driver/DriverHistory';
import { DriverProfile } from './pages/driver/DriverProfile';

// Hospital Pages
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { HospitalIncoming } from './pages/hospital/HospitalIncoming';
import { HospitalCapacity } from './pages/hospital/HospitalCapacity';
import { HospitalProfile } from './pages/hospital/HospitalProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEmergencies } from './pages/admin/AdminEmergencies';
import { AdminAmbulances } from './pages/admin/AdminAmbulances';
import { AdminDrivers } from './pages/admin/AdminDrivers';
import { AdminHospitals } from './pages/admin/AdminHospitals';
import { AdminMonitoring } from './pages/admin/AdminMonitoring';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminActivityLog } from './pages/admin/AdminActivityLog';

// Notifications Page
import { NotificationsPage } from './pages/notifications/NotificationsPage';

// Fallback Pages
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Milestone 3 Dataset-Driven Pages
import { DashboardPage } from './pages/milestone3/DashboardPage';
import { ReportEmergencyPage } from './pages/milestone3/ReportEmergencyPage';
import { AmbulanceFleetPage } from './pages/milestone3/AmbulanceFleetPage';
import { HospitalRecommendationsPage } from './pages/milestone3/HospitalRecommendationsPage';
import { RouteEtaPage } from './pages/milestone3/RouteEtaPage';
import { EmergencyHistoryPage } from './pages/milestone3/EmergencyHistoryPage';

export const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* App Portal with Sidebar & Topbar Layout */}
      <Route element={<AppLayout />}>
        {/* Core Milestone 3 Dataset-Driven Pages */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/report-emergency" element={<ReportEmergencyPage />} />
        <Route path="/ambulance-fleet" element={<AmbulanceFleetPage />} />
        <Route path="/hospital-recommendations" element={<HospitalRecommendationsPage />} />
        <Route path="/route-eta" element={<RouteEtaPage />} />
        <Route path="/emergency-history" element={<EmergencyHistoryPage />} />

        {/* AI Assistance Sandbox */}
        <Route path="/ai-assistance" element={<AiAssistancePage />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Reporter Section */}
        <Route path="/reporter" element={<Navigate to="/reporter/dashboard" replace />} />
        <Route path="/reporter/dashboard" element={<ReporterDashboard />} />
        <Route path="/reporter/emergency/new" element={<ReporterNewEmergency />} />
        <Route path="/reporter/tracking" element={<ReporterTracking />} />
        <Route path="/reporter/history" element={<ReporterHistory />} />
        <Route path="/reporter/profile" element={<ReporterProfile />} />

        {/* Driver Section */}
        <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/requests" element={<DriverRequests />} />
        <Route path="/driver/active-trip" element={<DriverActiveTrip />} />
        <Route path="/driver/history" element={<DriverHistory />} />
        <Route path="/driver/profile" element={<DriverProfile />} />

        {/* Hospital Section */}
        <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
        <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
        <Route path="/hospital/incoming" element={<HospitalIncoming />} />
        <Route path="/hospital/capacity" element={<HospitalCapacity />} />
        <Route path="/hospital/profile" element={<HospitalProfile />} />

        {/* Admin Section */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/emergencies" element={<AdminEmergencies />} />
        <Route path="/admin/ambulances" element={<AdminAmbulances />} />
        <Route path="/admin/drivers" element={<AdminDrivers />} />
        <Route path="/admin/hospitals" element={<AdminHospitals />} />
        <Route path="/admin/monitoring" element={<AdminMonitoring />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/activity" element={<AdminActivityLog />} />

        {/* Errors & Unauthorized */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
