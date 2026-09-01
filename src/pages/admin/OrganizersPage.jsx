import { useState, useEffect } from "react";
import { usersAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Plus,
  Users,
  Loader2,
  X,
  Power,
} from "lucide-react";

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const response = await usersAPI.getAll({ role: "organizador" });
      if (response.data.success) {
        setOrganizers(response.data.data.users);
      }
    } catch (error) {
      toast.error("Erro ao carregar organizadores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await usersAPI.create({
        ...formData,
        role: "organizador",
      });
      if (response.data.success) {
        toast.success("Organizador criado com sucesso!");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", password: "" });
        loadOrganizers();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao criar organizador"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const response = await usersAPI.toggleActive(id);
      if (response.data.success) {
        toast.success("Status atualizado!");
        loadOrganizers();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar status"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-lime" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-sora">Organizadores</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Organizador</span>
        </button>
      </div>

      {organizers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-16 w-16 text-dim mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhum organizador cadastrado
          </h2>
          <p className="text-muted mb-6">
            Crie o primeiro organizador para atribuí-lo a eventos
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Criar Primeiro Organizador
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => (
                  <tr
                    key={org.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {org.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {org.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.isActive ? (
                        <span className="badge badge-success">Ativo</span>
                      ) : (
                        <span className="badge badge-danger">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(org.id)}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Power className="h-4 w-4" />
                        {org.isActive ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md !p-0">
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-xl font-bold font-sora">
                Novo Organizador
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-dim hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input ${errors.name ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input ${errors.email ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Criar Organizador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
