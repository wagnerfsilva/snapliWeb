import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Plus } from "lucide-react";
import { ordersAPI, searchAPI } from "../../lib/api";
import SearchResultsGallery from "../../components/SearchResultsGallery";

const MAX_ITEMS = 1000;

export default function CourtesyOrderPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [order, setOrder] = useState(null);
  const busy = searching || creating;
  const eventCount = new Set(photos.map(photo => photo.eventId)).size;

  const search = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Envie uma imagem JPG, PNG ou WebP de até 10 MB.");
      return;
    }
    setSearching(true);
    setPhotos([]);
    setSelected([]);
    setOrder(null);
    setSearched(false);
    try {
      const formData = new FormData();
      formData.append("searchPhoto", file);
      const response = await searchAPI.searchByFace(formData);
      if (!response.data.success) throw new Error(response.data.message || "Erro ao buscar arquivos");
      setPhotos(response.data.data.photos);
      setSearched(true);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Erro ao buscar arquivos");
    } finally {
      setSearching(false);
    }
  };

  const toggle = id => {
    if (selected.includes(id)) {
      setSelected(selected.filter(value => value !== id));
    } else if (selected.length >= MAX_ITEMS) {
      toast.error(`O limite é de ${MAX_ITEMS} arquivos por pedido.`);
    } else {
      setSelected([...selected, id]);
    }
  };

  const selectVisible = visiblePhotos => {
    const combined = [...new Set([...selected, ...visiblePhotos.map(photo => photo.id)])];
    if (combined.length > MAX_ITEMS) {
      toast.error(`O limite é de ${MAX_ITEMS} arquivos. Selecione menos arquivos.`);
      return;
    }
    setSelected(combined);
  };

  const createOrder = async event => {
    event.preventDefault();
    if (busy || order) return;
    if (!customerName.trim() || !selected.length) {
      toast.error("Informe o nome e selecione ao menos um arquivo.");
      return;
    }
    setCreating(true);
    try {
      const response = await ordersAPI.createCourtesy({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        items: selected.map(photoId => ({ photoId })),
      });
      setOrder(response.data.order);
      toast.success("Pedido cortesia criado!");
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Erro ao criar cortesia");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(order.downloadUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie o link abaixo.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-sora">Pedidos cortesia</h1>
        <p className="text-muted mt-2">Busque por uma foto da pessoa e libere os arquivos selecionados sem pagamento.</p>
      </header>

      <section className="card space-y-3">
        <label className="block font-medium" htmlFor="courtesy-photo">Foto de referência</label>
        <input id="courtesy-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={search} />
        <p className="text-sm text-muted">JPG, PNG ou WebP, até 10 MB. Busca em todos os eventos ativos.</p>
        {searching && <p role="status">Buscando fotos e vídeos...</p>}
      </section>

      {searched && !order && (
        <section className="card space-y-4">
          <h2 className="text-2xl font-bold font-sora">
            Encontramos {photos.length} arquivo{photos.length !== 1 ? "s" : ""}
            {eventCount > 1 && ` em ${eventCount} eventos`}!
          </h2>
          <p>Revise os resultados: o reconhecimento facial pode incluir outras pessoas.</p>
          {!photos.length ? (
            <div className="text-muted">
              <p>Nenhum arquivo encontrado.</p>
              <p role="status">0 de 0 selecionados</p>
            </div>
          ) : (
            <SearchResultsGallery
              photos={photos}
              disabled={busy}
              renderGroupHeader={(group, visibleMedia) => {
                const visibleSelected = visibleMedia.filter(photo => selected.includes(photo.id)).length;
                const hiddenSelected = selected.length - visibleSelected;
                const allSelected = visibleMedia.length > 0 && visibleSelected === visibleMedia.length;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted">
                        {group.event?.date ? new Date(group.event.date).toLocaleDateString("pt-BR") : ""}
                        {group.event?.location ? ` · ${group.event.location}` : ""}
                      </p>
                      <p role="status">
                        {selected.length} de {photos.length} selecionados
                        {hiddenSelected > 0 ? ` (${hiddenSelected} fora do filtro)` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>
                        Limpar seleção
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary whitespace-nowrap flex items-center gap-2 self-start"
                        disabled={busy || !visibleMedia.length || allSelected}
                        onClick={() => selectVisible(visibleMedia)}
                      >
                        <Check className="h-4 w-4" />
                        {allSelected ? "Todos selecionados" : `Selecionar Todos (${visibleMedia.length})`}
                      </button>
                    </div>
                  </div>
                );
              }}
              renderAction={(photo, className) => {
                const isSelected = selected.includes(photo.id);
                return (
                  <button
                    type="button"
                    className={`${className} ${isSelected ? "btn-success" : "btn-primary"}`}
                    disabled={busy}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Remover" : "Selecionar"} ${photo.originalFilename}`}
                    onClick={() => toggle(photo.id)}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {isSelected ? "Selecionado" : "Selecionar"}
                  </button>
                );
              }}
            />
          )}
        </section>
      )}

      {searched && !order && photos.length > 0 && (
        <form className="card space-y-4" onSubmit={createOrder}>
          <h2 className="text-lg font-semibold">Destinatário e confirmação</h2>
          <label className="block">Nome do destinatário
            <input className="input mt-2" value={customerName} onChange={event => setCustomerName(event.target.value)} maxLength={255} required disabled={busy} />
          </label>
          <label className="block">E-mail (opcional, sem envio automático)
            <input className="input mt-2" type="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} maxLength={255} disabled={busy} />
          </label>
          <p>{selected.length} arquivo(s) - Cortesia, sem cobrança. Link válido por 90 dias.</p>
          <p className="text-sm text-muted">Qualquer pessoa com o link poderá visualizar e baixar os originais, sem login. Confira todos os arquivos selecionados antes de criar.</p>
          <button className="btn btn-primary" type="submit" disabled={busy || !selected.length || !customerName.trim()}>
            {creating ? "Criando cortesia..." : "Criar pedido cortesia"}
          </button>
        </form>
      )}

      {order && (
        <section className="card space-y-4" aria-label="Pedido cortesia criado">
          <h2 className="text-lg font-semibold">Cortesia criada para {order.customerName}</h2>
          <p>{order.itemCount} arquivo(s). Válido até {new Date(order.downloadExpiresAt).toLocaleString("pt-BR")}.</p>
          <label className="block">Link público de download
            <input className="input mt-2" readOnly value={order.downloadUrl} onFocus={event => event.target.select()} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={copyLink}>Copiar link</button>
            <a className="btn btn-secondary" href={order.downloadUrl} target="_blank" rel="noopener noreferrer">Abrir portal</a>
          </div>
          <p className="text-sm text-muted">Compartilhe manualmente. O link também está disponível nos pedidos de cada evento. Para criar outra cortesia, envie uma nova foto de referência.</p>
        </section>
      )}
    </div>
  );
}
