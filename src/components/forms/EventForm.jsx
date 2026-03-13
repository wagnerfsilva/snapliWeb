import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

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
  });

  const [newPackage, setNewPackage] = useState({ quantity: "", price: "" });

  const [errors, setErrors] = useState({});

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
      };

      await onSuccess(dataToSubmit);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Editar Evento" : "Criar Novo Evento"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
            <p className="mt-1 text-sm text-gray-500">
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
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Evento ativo
              </label>
            </div>
          )}

          {/* Preços */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Configuração de Preços
            </h3>

            {/* Preço por foto */}
            <div>
              <label
                htmlFor="pricePerPhoto"
                className="block text-sm font-medium text-gray-700 mb-2"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pacotes de Fotos
              </label>
              <div className="space-y-2">
                {formData.pricingPackages.map((pkg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-1 text-sm text-gray-700">
                      {pkg.quantity} fotos - R$ {pkg.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(index)}
                      className="text-red-600 hover:text-red-800"
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
              <p className="mt-1 text-sm text-gray-500">
                Ex: 5 fotos por R$ 4,00
              </p>
            </div>

            {/* Preço todas as fotos */}
            <div>
              <label
                htmlFor="allPhotosPrice"
                className="block text-sm font-medium text-gray-700 mb-2"
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
              <p className="mt-1 text-sm text-gray-500">
                Deixe em branco se não quiser oferecer essa opção
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
