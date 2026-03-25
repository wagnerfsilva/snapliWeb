import { Outlet, Link, useLocation } from "react-router-dom";

const SnapliLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="16" fill="currentColor" />
    <circle cx="32" cy="32" r="18" stroke="#09090B" strokeWidth="2.8" fill="none" />
    <circle cx="32" cy="32" r="9" stroke="#09090B" strokeWidth="2.8" fill="none" />
    <line x1="32" y1="14" x2="32" y2="23" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="47.6" y1="23" x2="39.8" y2="27.5" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="47.6" y1="41" x2="39.8" y2="36.5" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="32" y1="50" x2="32" y2="41" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="16.4" y1="41" x2="24.2" y2="36.5" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="16.4" y1="23" x2="24.2" y2="27.5" stroke="#09090B" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export { SnapliLogo };

export default function PublicLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50" style={{ background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3.5">
          <Link to="/search" className="flex items-center gap-2.5 text-lime">
            <SnapliLogo size={32} />
            <span className="font-sora font-bold text-2xl tracking-tight">
              <span className="text-lime">snap</span>
              <span className="text-white">li</span>
            </span>
          </Link>

          <div className="hidden sm:flex gap-1">
            <Link
              to="/search"
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
                isActive("/search")
                  ? "text-lime bg-lime-dim"
                  : "text-muted hover:text-lime hover:bg-lime-dim"
              }`}
            >
              Buscar Fotos
            </Link>
            <Link
              to="/admin/login"
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
                isActive("/admin/login")
                  ? "text-lime bg-lime-dim"
                  : "text-muted hover:text-lime hover:bg-lime-dim"
              }`}
            >
              Fotógrafo
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)' }} className="py-6 text-center text-sm text-dim">
        &copy; {new Date().getFullYear()} Snapli. Todos os direitos reservados.
      </footer>
    </div>
  );
}
