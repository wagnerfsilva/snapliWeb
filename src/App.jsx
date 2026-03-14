import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Public pages
import HomePage from "./pages/HomePage";
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

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
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
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/:id" element={<AdminEventDetail />} />
        <Route path="events/:id/upload" element={<AdminUpload />} />
        <Route path="events/:id/photos" element={<AdminEventGallery />} />
        <Route path="upload" element={<AdminUpload />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
