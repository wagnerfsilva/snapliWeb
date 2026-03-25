import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response.data.success) {
        const { token, user } = response.data.data;
        setAuth(user, token);
        toast.success("Login realizado com sucesso!");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Erro ao fazer login";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Radial glow */}
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-[72px] h-[72px] rounded-full inline-flex items-center justify-center mb-5" style={{ background: 'var(--lime)' }}>
            <svg className="w-9 h-9 text-dark" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2.8" fill="none" />
              <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="2.8" fill="none" />
              <line x1="32" y1="14" x2="32" y2="23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="47.6" y1="23" x2="39.8" y2="27.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="47.6" y1="41" x2="39.8" y2="36.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="32" y1="50" x2="32" y2="41" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16.4" y1="41" x2="24.2" y2="36.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16.4" y1="23" x2="24.2" y2="27.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-sora font-extrabold text-3xl mb-1">
            Snapli<span className="text-lime font-bold text-sm align-super ml-1 tracking-wider">PRO</span>
          </h1>
          <p className="text-muted text-base">Acesse o painel do fotógrafo</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full text-base font-bold py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <Link
          to="/"
          className="block text-center mt-6 text-lime text-sm font-medium hover:opacity-70 transition-opacity"
        >
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
