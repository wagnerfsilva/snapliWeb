import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Public pages
import SearchPage from "./pages/SearchPage";
import ResultsPage from "./pages/ResultsPage";
import CheckoutPage from "./pages/CheckoutPage";
import DownloadPortalPage from "./pages/DownloadPortalPage";

// Admin pages
import AdminLogin from "./pages/admin/LoginPage";
import AdminDashboard from "./pages/admin/DashboardPage";
import AdminEvents from "./pages/admin/EventsPage";
import AdminEventDetail from "./pages/admin/EventDetailPage";
import AdminUpload from "./pages/admin/UploadPage";
import AdminEventGallery from "./pages/admin/EventGalleryPage";
import AdminOrganizers from "./pages/admin/OrganizersPage";
import AdminPhotographers from "./pages/admin/PhotographersPage";
import AdminWithdrawals from "./pages/admin/WithdrawalsPage";

// Layout components
import PublicLayout from "./components/layouts/PublicLayout";
import AdminLayout from "./components/layouts/AdminLayout";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Role-restricted route wrapper (used for admin-only pages)
const RoleRoute = ({ roles, children }) => {
  const { user } = useAuthStore();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/admin/events" replace />;
  }

  return children;
};

// Index route target depends on role — organizador has no access to /admin/dashboard
const AdminIndexRedirect = () => {
  const { user } = useAuthStore();
  const target = user?.role === "organizador" ? "/admin/events" : "/admin/dashboard";
  return <Navigate to={target} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Navigate to="/search" replace />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>

      {/* Download Portal (Public - no layout) */}
      <Route path="/downloads/:token" element={<DownloadPortalPage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminIndexRedirect />} />
        <Route
          path="dashboard"
          element={
            <RoleRoute roles={["admin", "fotografo"]}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/:id" element={<AdminEventDetail />} />
        <Route
          path="events/:id/upload"
          element={
            <RoleRoute roles={["admin", "fotografo"]}>
              <AdminUpload />
            </RoleRoute>
          }
        />
        <Route
          path="events/:id/photos"
          element={
            <RoleRoute roles={["admin", "fotografo"]}>
              <AdminEventGallery />
            </RoleRoute>
          }
        />
        <Route
          path="upload"
          element={
            <RoleRoute roles={["admin", "fotografo"]}>
              <AdminUpload />
            </RoleRoute>
          }
        />
        <Route
          path="organizers"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminOrganizers />
            </RoleRoute>
          }
        />
        <Route
          path="photographers"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminPhotographers />
            </RoleRoute>
          }
        />
        <Route
          path="withdrawals"
          element={
            <RoleRoute roles={["admin", "organizador"]}>
              <AdminWithdrawals />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  );
}

export default App;
