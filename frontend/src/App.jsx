import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Existing pages
import Landing          from './pages/Landing';
import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import UserDashboard    from './pages/user/Dashboard';
import SelectSector     from './pages/user/SelectSector';
import SelectOrg        from './pages/user/SelectOrg';
import SelectService    from './pages/user/SelectService';
import BookToken        from './pages/user/BookToken';
import TokenTracking    from './pages/user/TokenTracking';
import MapView          from './pages/user/MapView';
import History          from './pages/user/History';
import Appointments     from './pages/user/Appointments';
import AdminDashboard   from './pages/admin/Dashboard';
import AdminAnalytics   from './pages/admin/Analytics';
import AdminSimulator   from './pages/admin/Simulator';
import StaffSetup       from './pages/staff/StaffSetup';
import StaffPanel       from './pages/staff/StaffPanel';
import PublicDisplay    from './pages/public/PublicDisplay';
import NotFound         from './pages/NotFound';

// ── Hospital Visit Plan pages ──────────────────────────────────────
import VisitPlan         from './pages/hospital/VisitPlan';
import VisitPlanTracking from './pages/hospital/VisitPlanTracking';

// ── Canteen pages ─────────────────────────────────────────────────
import CanteenHome      from './pages/canteen/CanteenHome';
import CanteenMenu      from './pages/canteen/CanteenMenu';
import CanteenOrder     from './pages/canteen/CanteenOrder';
import CanteenStaff     from './pages/canteen/CanteenStaff';
import CanteenAdmin     from './pages/canteen/CanteenAdmin';

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function StaffRoute({ children }) {
  const { user, staffSetup } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'STAFF') return <Navigate to="/" replace />;
  if (!staffSetup?.counter) return <Navigate to="/staff/setup" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/display/:departmentId" element={<PublicDisplay />} />

      {/* User — existing */}
      <Route path="/dashboard"     element={<RequireAuth><UserDashboard /></RequireAuth>} />
      <Route path="/sectors"       element={<RequireAuth><SelectSector /></RequireAuth>} />
      <Route path="/organizations" element={<RequireAuth><SelectOrg /></RequireAuth>} />
      <Route path="/services"      element={<RequireAuth><SelectService /></RequireAuth>} />
      <Route path="/book/:serviceId"  element={<RequireAuth><BookToken /></RequireAuth>} />
      <Route path="/token/:tokenId"   element={<RequireAuth><TokenTracking /></RequireAuth>} />
      <Route path="/map/:orgId"       element={<RequireAuth><MapView /></RequireAuth>} />
      <Route path="/history"       element={<RequireAuth><History /></RequireAuth>} />
      <Route path="/appointments"  element={<RequireAuth><Appointments /></RequireAuth>} />

      {/* ── Hospital Smart Visit Plan ───────────────────────── */}
      <Route path="/hospital/visit-plan"          element={<RequireAuth><VisitPlan /></RequireAuth>} />
      <Route path="/hospital/visit-plan/tracking" element={<RequireAuth><VisitPlanTracking /></RequireAuth>} />

      {/* ── CANTEEN — user flow ─────────────────────────────── */}
      <Route path="/canteen"              element={<RequireAuth><CanteenHome /></RequireAuth>} />
      <Route path="/canteen/menu"         element={<RequireAuth><CanteenMenu /></RequireAuth>} />
      <Route path="/canteen/order/:orderId" element={<RequireAuth><CanteenOrder /></RequireAuth>} />

      {/* Admin — existing */}
      <Route path="/admin"           element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/analytics" element={<RequireAuth role="ADMIN"><AdminAnalytics /></RequireAuth>} />
      <Route path="/admin/simulator" element={<RequireAuth role="ADMIN"><AdminSimulator /></RequireAuth>} />
      {/* ── CANTEEN — admin ──────────────────────────────────── */}
      <Route path="/admin/canteen"   element={<RequireAuth role="ADMIN"><CanteenAdmin /></RequireAuth>} />

      {/* Staff — existing */}
      <Route path="/staff/setup" element={<RequireAuth role="STAFF"><StaffSetup /></RequireAuth>} />
      <Route path="/staff"       element={<StaffRoute><StaffPanel /></StaffRoute>} />
      {/* ── CANTEEN — staff ──────────────────────────────────── */}
      <Route path="/canteen/staff" element={<RequireAuth role="STAFF"><CanteenStaff /></RequireAuth>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
