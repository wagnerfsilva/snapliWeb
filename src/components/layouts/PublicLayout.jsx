import { Outlet, Link } from "react-router-dom";
import { Camera } from "lucide-react";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/search" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Snapli</span>
            </Link>

            <nav className="flex space-x-4">
              <Link
                to="/search"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Buscar Fotos
              </Link>
              <Link
                to="/admin/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Fotógrafo
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Snapli. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
