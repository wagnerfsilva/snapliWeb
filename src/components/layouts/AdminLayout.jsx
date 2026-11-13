import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Upload,
  LogOut,
  Users,
  Camera,
  Wallet,
  Gift,
  Menu,
  X,
} from "lucide-react";
import { SnapliLogo } from "./PublicLayout";

const NAVIGATION_BY_ROLE = {
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Eventos", href: "/admin/events", icon: Calendar },
    { name: "Agenda", href: "/admin/agenda", icon: CalendarDays },
    { name: "Cortesias", href: "/admin/courtesies", icon: Gift },
    { name: "Upload", href: "/admin/upload", icon: Upload },
    { name: "Fotógrafos", href: "/admin/photographers", icon: Camera },
    { name: "Organizadores", href: "/admin/organizers", icon: Users },
    { name: "Resgates", href: "/admin/withdrawals", icon: Wallet },
  ],
  fotografo: [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Eventos", href: "/admin/events", icon: Calendar },
    { name: "Agenda", href: "/admin/agenda", icon: CalendarDays },
    { name: "Upload", href: "/admin/upload", icon: Upload },
  ],
  organizador: [
    { name: "Meus Eventos", href: "/admin/events", icon: Calendar },
    { name: "Agenda", href: "/admin/agenda", icon: CalendarDays },
    { name: "Resgates", href: "/admin/withdrawals", icon: Wallet },
  ],
};

export default function AdminLayout() {
  const { user, clearAuth, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!menuOpen) {
      dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen]);

  // O papel exibido na UI deve sempre refletir o usuario do token enviado a API
  useEffect(() => {
    authAPI
      .me()
      .then((res) => updateUser(res.data.data.user))
      .catch(() => {});
  }, [updateUser]);

  const handleLogout = () => {
    clearAuth();
    toast.success("Logout realizado com sucesso");
    navigate("/admin/login");
  };

  const navigation = NAVIGATION_BY_ROLE[user?.role] || NAVIGATION_BY_ROLE.fotografo;

  const renderSidebar = (mobile = false) => (
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-4 lg:px-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
            <SnapliLogo size={28} />
            <span className="font-sora font-bold text-lg text-white">
              <span className="text-lime">Snapli</span> Admin
            </span>
            </div>
            {mobile && (
              <button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <nav aria-label="Navegação administrativa" className="min-h-0 flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
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

          <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white" title={user?.name}>{user?.name}</p>
                <p className="truncate text-xs text-muted" title={user?.email}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-2 w-full px-4 py-2 text-sm text-muted hover:text-white rounded-xl transition-all"
              style={{ ':hover': { background: 'rgba(255,255,255,0.05)' } }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 lg:hidden"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <SnapliLogo size={28} />
          <span className="font-sora font-bold text-lg"><span className="text-lime">Snapli</span> Admin</span>
        </div>
        <button type="button" aria-label="Abrir menu" aria-haspopup="dialog"
          aria-expanded={menuOpen} aria-controls="admin-mobile-navigation" onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        {renderSidebar()}
      </aside>

      <dialog ref={menuRef} id="admin-mobile-navigation" aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[calc(100%_-_2rem)] border-0 p-0 text-white backdrop:bg-black/70"
        style={{ background: 'var(--surface)' }}
        onCancel={event => { event.preventDefault(); setMenuOpen(false); }}
        onClose={() => setMenuOpen(false)}
        onClick={event => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
        {renderSidebar(true)}
      </dialog>

      <div className="min-w-0 lg:pl-64">
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
