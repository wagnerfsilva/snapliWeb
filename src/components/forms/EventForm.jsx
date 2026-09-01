import { useState, useEffect, useRef } from "react";
import { X, Loader2, Plus, Trash2, Search, UserCircle2 } from "lucide-react";
import { usersAPI } from "../../lib/api";

export default function EventForm({ onClose, onSuccess, initialData = null }) {
  const isEdit = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : "",
    location: initialData?.location || "",
    description: initialData?.description || "",
    isActive: initialData?.isActive ?? true,
    pricePerPhoto: initialData?.pricePerPhoto || "5.00",
    pricingPackages: initialData?.pricingPackages || [],
    allPhotosPrice: initialData?.allPhotosPrice || "",
    freePhotosCount: initialData?.freePhotosCount ?? 0,
    organizerId: initialData?.organizerId || null,
    organizerCommissionPercentage:
      initialData?.organizerCommissionPercentage ?? "",
  });

  const [newPackage, setNewPackage] = useState({ quantity: "", price: "" });

  const [errors, setErrors] = useState({});

  // Organizador autocomplete (busca com termo, sem listar todos)
  const [selectedOrganizer, setSelectedOrganizer] = useState(
    initialData?.organizer
      ? { id: initialData.organizer.id, name: initialData.organizer.name, email: initialData.organizer.email }
      : null
  );
  const [organizerQuery, setOrganizerQuery] = useState("");
  const [organizerResults, setOrganizerResults] = useState([]);
  const [isSearchingOrganizer, setIsSearchingOrganizer] = useState(false);
  const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false);
  const organizerSearchTimeout = useRef(null);

  useEffect(() => {
    if (organizerQuery.trim().length < 2) {
      setOrganizerResults([]);
      return;
    }

    if (organizerSearchTimeout.current) {
      clearTimeout(organizerSearchTimeout.current);
    }

    organizerSearchTimeout.current = setTimeout(async () => {
      setIsSearchingOrganizer(true);
      try {
        const response = await usersAPI.searchOrganizers(organizerQuery.trim());
        if (response.data.success) {
          setOrganizerResults(response.data.data.users);
        }
      } catch (error) {
        console.error("Erro ao buscar organizadores:", error);
      } finally {
        setIsSearchingOrganizer(false);
      }
    }, 300);

    return () => clearTimeout(organizerSearchTimeout.current);
  }, [organizerQuery]);

  const handleSelectOrganizer = (organizer) => {
    setSelectedOrganizer(organizer);
    setFormData((prev) => ({ ...prev, organizerId: organizer.id }));
    setOrganizerQuery("");
    setOrganizerResults([]);
    setShowOrganizerDropdown(false);
  };

  const handleRemoveOrganizer = () => {
    setSelectedOrganizer(null);
    setFormData((prev) => ({
      ...prev,
      organizerId: null,
      organizerCommissionPercentage: "",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpa o erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddPackage = () => {
    if (newPackage.quantity && newPackage.price) {
      setFormData((prev) => ({
        ...prev,
        pricingPackages: [
          ...prev.pricingPackages,
          {
            quantity: parseInt(newPackage.quantity),
            price: parseFloat(newPackage.price),
          },
        ],
      }));
      setNewPackage({ quantity: "", price: "" });
    }
  };

  const handleRemovePackage = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingPackages: prev.pricingPackages.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do evento é obrigatório";
    } else if (formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.date) {
      newErrors.date = "Data do evento é obrigatória";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Localização é obrigatória";
    }

    if (
      selectedOrganizer &&
      formData.organizerCommissionPercentage !== "" &&
      (Number(formData.organizerCommissionPercentage) < 0 ||
        Number(formData.organizerCommissionPercentage) > 100)
    ) {
      newErrors.organizerCommissionPercentage = "Comissão deve ser entre 0 e 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data - convert empty strings to null for numeric fields
      const dataToSubmit = {
        ...formData,
        pricePerPhoto: formData.pricePerPhoto
          ? parseFloat(formData.pricePerPhoto)
          : null,
        allPhotosPrice: formData.allPhotosPrice
          ? parseFloat(formData.allPhotosPrice)
          : null,
        freePhotosCount: Math.min(
          Math.max(parseInt(formData.freePhotosCount) || 0, 0),
          3
        ),
        organizerId: selectedOrganizer ? selectedOrganizer.id : null,
        organizerCommissionPercentage: selectedOrganizer
          ? parseFloat(formData.organizerCommissionPercentage) || 0
          : null,
      };

      await onSuccess(dataToSubmit);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto !p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-2xl font-bold font-sora">
            {isEdit ? "Editar Evento" : "Criar Novo Evento"}
          </h2>
          <button
            onClick={onClose}
            className="text-dim hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome do Evento */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
            >
              Nome do Evento *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input ${errors.name ? "border-red-500" : ""}`}
              placeholder="Ex: Casamento João e Maria"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Data do Evento */}
          <div>
            <label
              htmlFor="date"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
            >
              Data do Evento *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`input ${errors.date ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Localização */}
          <div>
            <label
              htmlFor="location"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
            >
              Localização *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`input ${errors.location ? "border-red-500" : ""}`}
              placeholder="Ex: Salão de Festas Central, São Paulo - SP"
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
            >
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input resize-none"
              placeholder="Adicione detalhes sobre o evento..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-muted">
              Informações adicionais que podem ajudar na organização
            </p>
          </div>

          {/* Status (apenas para edição) */}
          {isEdit && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded accent-lime"
                disabled={isSubmitting}
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-muted"
              >
                Evento ativo
              </label>
            </div>
          )}

          {/* Organizador e Comissão */}
          <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold font-sora">
              Organizador (opcional)
            </h3>

            {selectedOrganizer ? (
              <div
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCircle2 className="h-5 w-5 text-lime shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedOrganizer.name}</p>
                    <p className="text-xs text-muted truncate">{selectedOrganizer.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveOrganizer}
                  className="text-dim hover:text-white transition-colors shrink-0"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="h-4 w-4 text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organizerQuery}
                    onChange={(e) => {
                      setOrganizerQuery(e.target.value);
                      setShowOrganizerDropdown(true);
                    }}
                    onFocus={() => setShowOrganizerDropdown(true)}
                    placeholder="Buscar organizador por nome ou email..."
                    className="input pl-9"
                    disabled={isSubmitting}
                  />
                </div>

                {showOrganizerDropdown && organizerQuery.trim().length >= 2 && (
                  <div
                    className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden max-h-56 overflow-y-auto"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    {isSearchingOrganizer && (
                      <div className="p-3 text-sm text-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Buscando...
                      </div>
                    )}
                    {!isSearchingOrganizer && organizerResults.length === 0 && (
                      <div className="p-3 text-sm text-muted">
                        Nenhum organizador encontrado
                      </div>
                    )}
                    {!isSearchingOrganizer &&
                      organizerResults.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleSelectOrganizer(org)}
                          className="w-full text-left p-3 hover:bg-white/5 transition-colors"
                        >
                          <p className="text-sm font-medium">{org.name}</p>
                          <p className="text-xs text-muted">{org.email}</p>
                        </button>
                      ))}
                  </div>
                )}
                <p className="mt-1 text-sm text-muted">
                  Digite ao menos 2 caracteres para buscar
                </p>
              </div>
            )}

            {selectedOrganizer && (
              <div>
                <label
                  htmlFor="organizerCommissionPercentage"
                  className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                >
                  Comissão do Organizador (%)
                </label>
                <input
                  type="number"
                  id="organizerCommissionPercentage"
                  name="organizerCommissionPercentage"
                  value={formData.organizerCommissionPercentage}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className={`input ${errors.organizerCommissionPercentage ? "border-red-500" : ""}`}
                  placeholder="10.00"
                  disabled={isSubmitting}
                />
                {errors.organizerCommissionPercentage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.organizerCommissionPercentage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preços */}
          <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold font-sora">
              Configuração de Preços
            </h3>

            {/* Preço por foto */}
            <div>
              <label
                htmlFor="pricePerPhoto"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Preço por Foto Individual (R$)
              </label>
              <input
                type="number"
                id="pricePerPhoto"
                name="pricePerPhoto"
                value={formData.pricePerPhoto}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input"
                placeholder="5.00"
                disabled={isSubmitting}
              />
            </div>

            {/* Pacotes */}
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Pacotes de Fotos
              </label>
              <div className="space-y-2">
                {formData.pricingPackages.map((pkg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'var(--bg)' }}
                  >
                    <span className="flex-1 text-sm text-muted">
                      {pkg.quantity} fotos - R$ {pkg.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(index)}
                      style={{ color: '#FF5050' }}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  value={newPackage.quantity}
                  onChange={(e) =>
                    setNewPackage((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="Qtd"
                  className="input flex-1"
                  disabled={isSubmitting}
                  min="1"
                />
                <input
                  type="number"
                  value={newPackage.price}
                  onChange={(e) =>
                    setNewPackage((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Preço (R$)"
                  className="input flex-1"
                  disabled={isSubmitting}
                  step="0.01"
                  min="0"
                />
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="btn btn-secondary flex items-center gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">
                Ex: 5 fotos por R$ 4,00
              </p>
            </div>

            {/* Preço todas as fotos */}
            <div>
              <label
                htmlFor="allPhotosPrice"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Preço para Todas as Fotos (R$)
              </label>
              <input
                type="number"
                id="allPhotosPrice"
                name="allPhotosPrice"
                value={formData.allPhotosPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input"
                placeholder="20.00"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-muted">
                Deixe em branco se não quiser oferecer essa opção
              </p>
            </div>

            {/* Fotos grátis na compra */}
            <div>
              <label
                htmlFor="freePhotosCount"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Foto(s) Grátis na Compra
              </label>
              <input
                type="number"
                id="freePhotosCount"
                name="freePhotosCount"
                value={formData.freePhotosCount}
                onChange={handleChange}
                step="1"
                min="0"
                max="3"
                className="input"
                placeholder="0"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-muted">
                Quantidade de fotos que o cliente pode levar grátis ao comprar
                outras fotos deste evento (máx. 3). Deixe 0 para desativar.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEdit ? "Salvando..." : "Criando..."}</span>
                </>
              ) : (
                <span>{isEdit ? "Salvar Alterações" : "Criar Evento"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
