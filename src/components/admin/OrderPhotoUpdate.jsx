import { useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { ordersAPI } from "../../lib/api";
import SearchResultsGallery from "../SearchResultsGallery";

export default function OrderPhotoUpdate({ order, eventId, onClose, onUpdated }) {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [previewToken, setPreviewToken] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = searching || saving;

  const search = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Envie uma imagem JPG, PNG ou WebP de até 10 MB.");
      return;
    }
    setSearching(true);
    setPhotos([]);
    setSelected([]);
    setPreviewToken(null);
    setSearched(false);
    try {
      const formData = new FormData();
      formData.append("searchPhoto", file);
      const response = await ordersAPI.previewPhotoUpdate(order.id, eventId, formData);
      if (!response.data.success) throw new Error(response.data.error || "Erro ao buscar novas fotos");
      setPhotos(response.data.data.photos);
      setPreviewToken(response.data.data.previewToken);
      setSearched(true);
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || "Erro ao buscar novas fotos");
    } finally {
      setSearching(false);
    }
  };

  const confirm = async () => {
    if (busy || !selected.length || !previewToken) return;
    setSaving(true);
    try {
      const response = await ordersAPI.confirmPhotoUpdate(order.id, eventId, { previewToken, photoIds: selected });
      if (!response.data.success) throw new Error(response.data.error || "Erro ao adicionar fotos");
      toast.success(`${response.data.data.addedCount} foto(s) adicionada(s). Pagamento preservado.`);
      onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || "Erro ao adicionar fotos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-4 sm:p-8">
      <section role="dialog" aria-modal="true" aria-labelledby="photo-update-title" className="card max-w-6xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="photo-update-title" className="text-xl font-semibold font-sora">Buscar novas fotos</h2>
            <p className="text-muted">{order.customerName} · {order.customerEmail}</p>
          </div>
          <button type="button" className="btn btn-secondary" aria-label="Fechar atualização de fotos" disabled={busy} onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p>Envie uma foto do rosto da pessoa. A busca considera apenas novas fotos deste evento, adicionadas após o pagamento e que ainda não estão no pedido.</p>
        <label className="block space-y-2">
          <span>Foto de referência</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={search} className="block" />
          <span className="text-sm text-muted block">Até 10 MB. A foto de referência não é salva. A prévia vale por 15 minutos.</span>
        </label>
        {searching && <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando novas fotos...</p>}
        {searched && (
          <div className="space-y-4">
            <p role="status">{photos.length} foto(s) encontrada(s). {selected.length} selecionada(s).</p>
            {!photos.length ? <p className="text-muted">Nenhuma nova foto encontrada para esta referência.</p> : (
              <>
                <p>Confira a pessoa em cada foto antes de confirmar: o reconhecimento facial pode incluir outras pessoas.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setSelected(photos.map(photo => photo.id))}>Selecionar todas</button>
                  <button type="button" className="btn btn-secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>Limpar seleção</button>
                </div>
                <SearchResultsGallery
                  photos={photos}
                  disabled={busy}
                  renderGroupHeader={group => <h3 className="font-semibold mb-4">{group.event?.name}</h3>}
                  renderAction={(photo, className) => {
                    const isSelected = selected.includes(photo.id);
                    return (
                      <button
                        type="button"
                        className={`${className} ${isSelected ? "btn-success" : "btn-primary"}`}
                        disabled={busy}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(current => isSelected ? current.filter(id => id !== photo.id) : [...current, photo.id])}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {isSelected ? "Selecionada" : "Selecionar"}
                      </button>
                    );
                  }}
                />
              </>
            )}
          </div>
        )}
        <p className="text-sm text-muted">As fotos serão liberadas no mesmo link. O valor pago, a comissão e o prazo de download não serão alterados.</p>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" disabled={busy || !selected.length || !previewToken} onClick={confirm}>
            {saving ? "Adicionando..." : `Confirmar inclusão de ${selected.length} foto(s)`}
          </button>
        </div>
      </section>
    </div>
  );
}
