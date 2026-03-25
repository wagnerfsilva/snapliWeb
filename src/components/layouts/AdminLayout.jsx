import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Calendar,
  Upload,
  LogOut,
} from "lucide-react";
import { SnapliLogo } from "./PublicLayout";

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    toast.success("Logout realizado com sucesso");
    navigate("/admin/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Eventos", href: "/admin/events", icon: Calendar },
    { name: "Upload", href: "/admin/upload", icon: Upload },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <SnapliLogo size={28} />
            <span className="font-sora font-bold text-lg text-white">
              <span className="text-lime">Snapli</span> Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "text-dark font-semibold"
                      : "text-muted hover:text-white"
                  }`}
                  style={isActive ? { background: 'var(--lime)' } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3 px-2">
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted hover:text-white rounded-xl transition-all"
              style={{ ':hover': { background: 'rgba(255,255,255,0.05)' } }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
