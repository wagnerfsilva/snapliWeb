import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, Search, UserCircle2 } from "lucide-react";
import { usersAPI } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

function CommissionField({ label, selected, onSelect, search, fixed, readOnly, percentage, onPercentageChange, error, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fixed || readOnly || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await search(query.trim());
        if (active) setResults(response.data.data.users);
      } catch {
        if (active) toast.error(`Erro ao buscar ${label.toLowerCase()}`);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, fixed, readOnly, search, label]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold font-sora">{label}{fixed ? "" : " (opcional)"}</h3>
      {selected ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "var(--bg)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle2 className="h-5 w-5 text-muted shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selected.name}</p>
              <p className="text-xs text-muted truncate">{selected.email}</p>
            </div>
          </div>
          {!fixed && !readOnly && (
            <button type="button" onClick={() => { onSelect(null); setQuery(""); }} className="text-dim hover:text-white" disabled={disabled} aria-label={`Remover ${label.toLowerCase()}`}>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : readOnly ? <p className="text-sm text-muted">Não associado</p> : (
        <div className="relative">
          <label className="relative block">
            <Search className="h-4 w-4 text-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input aria-label={`Buscar ${label.toLowerCase()}`} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar ${label.toLowerCase()} por nome ou email...`} className="input pl-9" disabled={disabled} />
          </label>
          {query.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl max-h-56 overflow-y-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {loading ? <p className="p-3 text-sm text-muted">Buscando...</p> : results.length ? results.map(person => (
                <button key={person.id} type="button" className="w-full text-left p-3 hover:bg-white/5" onClick={() => { onSelect(person); setQuery(""); }}>
                  <p className="text-sm font-medium">{person.name}</p>
                  <p className="text-xs text-muted">{person.email}</p>
                </button>
              )) : <p className="p-3 text-sm text-muted">Nenhum resultado encontrado</p>}
            </div>
          )}
        </div>
      )}
      {selected && (
        <label className="block text-xs font-medium text-muted uppercase tracking-wider">
          Comissão do {label} (%)
          <input type="number" aria-label={`Comissão do ${label}`} value={percentage} onChange={e => onPercentageChange(e.target.value)} step="0.01" min="0" max="100" required={!readOnly} readOnly={readOnly} disabled={disabled} className="input mt-2" />
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function EventForm({ onClose, onSuccess, initialData = null, approval = false }) {
  const isEdit = !!initialData;
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const readOnlyCommissions = isEdit && !isAdmin;
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
    freeVideosCount: initialData?.freeVideosCount ?? 0,
    videoEnabled: initialData?.videoEnabled ?? false,
    pricePerVideo: initialData?.pricePerVideo ?? "",
    videoPricingPackages: initialData?.videoPricingPackages ?? [],
    allVideosPrice: initialData?.allVideosPrice ?? "",
    organizerId: initialData?.organizerId || null,
    organizerCommissionPercentage:
      initialData?.organizerCommissionPercentage ?? "",
    photographerCommissionPercentage: initialData?.photographerCommissionPercentage ?? "",
  });

  const [newPackage, setNewPackage] = useState({ quantity: "", price: "" });
  const [newVideoPackage, setNewVideoPackage] = useState({
    quantity: "",
    price: "",
  });

  const [errors, setErrors] = useState({});

  const [selectedOrganizer, setSelectedOrganizer] = useState(
    initialData?.organizer
      ? {
          id: initialData.organizer.id,
          name: initialData.organizer.name,
          email: initialData.organizer.email,
        }
      : null,
  );
  const [selectedPhotographer, setSelectedPhotographer] = useState(
    initialData?.photographer || (!isEdit && !isAdmin ? user : null),
  );

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

    if (!Number.isInteger(Number(formData.freeVideosCount)) ||
        Number(formData.freeVideosCount) < 0 ||
        Number(formData.freeVideosCount) > 3) {
      newErrors.freeVideosCount = "Informe uma quantidade inteira entre 0 e 3";
    }

    if (
      (formData.videoEnabled || formData.pricePerVideo !== "") &&
      !validVideoPrice(formData.pricePerVideo)
    ) {
      newErrors.pricePerVideo =
        "Informe um preço positivo com até duas casas decimais";
    }
    if (
      formData.allVideosPrice !== "" &&
      !validVideoPrice(formData.allVideosPrice)
    ) {
      newErrors.allVideosPrice =
        "Informe um preço positivo com até duas casas decimais";
    }

    if (!readOnlyCommissions) {
      for (const [person, key] of [[selectedOrganizer, "organizerCommissionPercentage"], [selectedPhotographer, "photographerCommissionPercentage"]]) {
        if (person && (!/^\d{1,3}(\.\d{1,2})?$/.test(String(formData[key])) || Number(formData[key]) > 100)) {
          newErrors[key] = "Informe a comissão entre 0 e 100, com até duas casas decimais";
        }
      }
      const total = (selectedOrganizer ? Number(formData.organizerCommissionPercentage) : 0)
        + (selectedPhotographer ? Number(formData.photographerCommissionPercentage) : 0);
      if (Math.round(total * 100) > 10000) newErrors.commissions = "A soma das comissões não pode ultrapassar 100%";
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
        pricePerVideo:
          formData.pricePerVideo === "" ? null : formData.pricePerVideo,
        allVideosPrice:
          formData.allVideosPrice === "" ? null : formData.allVideosPrice,
        freePhotosCount: Math.min(
          Math.max(parseInt(formData.freePhotosCount) || 0, 0),
          3,
        ),
        freeVideosCount: Number(formData.freeVideosCount),
        organizerId: selectedOrganizer ? selectedOrganizer.id : null,
        organizerCommissionPercentage: selectedOrganizer
          ? Number(formData.organizerCommissionPercentage)
          : null,
        photographerId: selectedPhotographer?.id || null,
        photographerCommissionPercentage: selectedPhotographer ? Number(formData.photographerCommissionPercentage) : null,
      };
      if (readOnlyCommissions) {
        for (const key of ["organizerId", "organizerCommissionPercentage", "photographerId", "photographerCommissionPercentage"]) delete dataToSubmit[key];
      }
      if (initialData?.approvalStatus === "pending") delete dataToSubmit.isActive;

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
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-2xl font-bold font-sora">
            {approval ? "Revisar e aprovar evento" : isEdit ? "Editar Evento" : "Criar Novo Evento"}
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
          {isEdit && initialData?.approvalStatus === "approved" && (
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

          <div className="space-y-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            {!isEdit && !isAdmin && <p className="text-sm text-muted">O evento ficará aguardando aprovação. Você não poderá editá-lo ou enviar mídias até a liberação pelo administrador.</p>}
            {isEdit && isAdmin && <p className="text-sm text-muted">Alterações nos percentuais recalculam a comissão sobre todas as vendas do evento. Saques anteriores são preservados.</p>}
            {readOnlyCommissions && <p className="text-sm text-muted">Somente o administrador pode alterar os participantes e suas comissões.</p>}
            <CommissionField label="Organizador" selected={selectedOrganizer} search={usersAPI.searchOrganizers} readOnly={readOnlyCommissions} disabled={isSubmitting}
              onSelect={person => { setSelectedOrganizer(person); if (!person) setFormData(prev => ({ ...prev, organizerCommissionPercentage: "" })); }}
              percentage={formData.organizerCommissionPercentage} onPercentageChange={value => setFormData(prev => ({ ...prev, organizerCommissionPercentage: value }))} error={errors.organizerCommissionPercentage} />
            <CommissionField label="Fotógrafo" selected={selectedPhotographer} search={usersAPI.searchPhotographers} fixed={!isAdmin && !isEdit} readOnly={readOnlyCommissions} disabled={isSubmitting}
              onSelect={person => { setSelectedPhotographer(person); if (!person) setFormData(prev => ({ ...prev, photographerCommissionPercentage: "" })); }}
              percentage={formData.photographerCommissionPercentage} onPercentageChange={value => setFormData(prev => ({ ...prev, photographerCommissionPercentage: value }))} error={errors.photographerCommissionPercentage} />
            {errors.commissions && <p className="text-sm text-red-600">{errors.commissions}</p>}
            <p className="text-sm text-muted">As duas comissões incidem sobre a receita bruta paga. A soma não pode ultrapassar 100%.</p>
          </div>

          {/* Preços */}
          <div
            className="space-y-4 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
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
                    style={{ background: "var(--bg)" }}
                  >
                    <span className="flex-1 text-sm text-muted">
                      {pkg.quantity} fotos - R$ {pkg.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(index)}
                      style={{ color: "#FF5050" }}
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
              <p className="mt-1 text-sm text-muted">Ex: 5 fotos por R$ 4,00</p>
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
                outras fotos deste evento (máx. 3). Não se aplica a vídeos.
                Deixe 0 para desativar.
              </p>
            </div>
          </div>

          <div
            className="space-y-4 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <h3 className="text-lg font-semibold font-sora">
              Preços de Vídeos
            </h3>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="videoEnabled"
                checked={formData.videoEnabled}
                onChange={handleChange}
                className="h-4 w-4 accent-lime"
                disabled={isSubmitting}
              />
              Venda de vídeos habilitada
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="pricePerVideo"
                  className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                >
                  Vídeo Avulso (R$)
                </label>
                <input
                  id="pricePerVideo"
                  name="pricePerVideo"
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  value={formData.pricePerVideo}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required={formData.videoEnabled}
                  className={`input ${errors.pricePerVideo ? "border-red-500" : ""}`}
                />
                {errors.pricePerVideo && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.pricePerVideo}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="allVideosPrice"
                  className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                >
                  Preço para Todos os Vídeos (R$)
                </label>
                <input
                  id="allVideosPrice"
                  name="allVideosPrice"
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  value={formData.allVideosPrice}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`input ${errors.allVideosPrice ? "border-red-500" : ""}`}
                />
                {errors.allVideosPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.allVideosPrice}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Pacotes Exclusivos de Vídeos
              </p>
              <div className="space-y-2">
                {formData.videoPricingPackages.map((pack, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <span className="flex-1 text-sm text-muted">
                      {pack.quantity} vídeos - R${" "}
                      {Number(pack.price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      title="Remover pacote de vídeos"
                      aria-label="Remover pacote de vídeos"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          videoPricingPackages:
                            prev.videoPricingPackages.filter(
                              (_, position) => position !== index,
                            ),
                        }))
                      }
                      disabled={isSubmitting}
                      style={{ color: "#FF5050" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 mt-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  aria-label="Quantidade de vídeos do pacote"
                  placeholder="Qtd"
                  value={newVideoPackage.quantity}
                  onChange={(event) =>
                    setNewVideoPackage((prev) => ({
                      ...prev,
                      quantity: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  className="input flex-1 min-w-0"
                />
                <input
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  aria-label="Preço do pacote de vídeos"
                  placeholder="Preço (R$)"
                  value={newVideoPackage.price}
                  onChange={(event) =>
                    setNewVideoPackage((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  className="input flex-1 min-w-0"
                />
                <button
                  type="button"
                  title="Adicionar pacote de vídeos"
                  aria-label="Adicionar pacote de vídeos"
                  className="btn btn-secondary w-10 h-10 p-0 justify-self-end flex items-center justify-center"
                  disabled={
                    isSubmitting ||
                    formData.videoPricingPackages.length >= 100 ||
                    !Number.isInteger(Number(newVideoPackage.quantity)) ||
                    Number(newVideoPackage.quantity) < 1 ||
                    Number(newVideoPackage.quantity) > 1000 ||
                    !validVideoPrice(newVideoPackage.price)
                  }
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      videoPricingPackages: [
                        ...prev.videoPricingPackages,
                        {
                          quantity: Number(newVideoPackage.quantity),
                          price: newVideoPackage.price,
                        },
                      ],
                    }));
                    setNewVideoPackage({ quantity: "", price: "" });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Vídeos grátis na compra */}
            <div>
              <label
                htmlFor="freeVideosCount"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Vídeo(s) Grátis na Compra
              </label>
              <input
                type="number"
                id="freeVideosCount"
                name="freeVideosCount"
                value={formData.freeVideosCount}
                onChange={handleChange}
                step="1"
                min="0"
                max="3"
                className="input"
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.freeVideosCount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.freeVideosCount}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">
                Quantidade de vídeos que o cliente pode levar grátis ao comprar
                outros vídeos deste evento (máx. 3). Não se aplica a fotos.
                Deixe 0 para desativar.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div
            className="flex items-center justify-end space-x-3 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
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
                <span>{approval ? "Aprovar e liberar" : isEdit ? "Salvar Alterações" : "Criar Evento"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function validVideoPrice(value) {
  return (
    /^\d+(\.\d{1,2})?$/.test(String(value)) &&
    Number(value) > 0 &&
    Number(value) <= 99999999.99
  );
}
