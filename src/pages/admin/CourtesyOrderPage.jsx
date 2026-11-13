import { useState } from "react";
import toast from "react-hot-toast";
import { ordersAPI, searchAPI } from "../../lib/api";
import MediaPreview from "../../components/MediaPreview";

const MAX_ITEMS = 1000;

export default function CourtesyOrderPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [eventId, setEventId] = useState("");
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [order, setOrder] = useState(null);
  const busy = searching || creating;
  const events = [...new Map(photos.map(photo => [photo.eventId, photo.event])).values()];
  const visiblePhotos = photos.filter(photo => !eventId || photo.eventId === eventId);
  const visibleSelected = visiblePhotos.filter(photo => selected.includes(photo.id)).length;
  const hiddenSelected = selected.length - visibleSelected;

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
    setEventId("");
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

  const selectVisible = () => {
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
          <div className="flex flex-wrap gap-4 items-center">
            <label htmlFor="courtesy-event">Evento</label>
            <select id="courtesy-event" className="input" value={eventId} onChange={event => setEventId(event.target.value)} disabled={busy}>
              <option value="">Todos os eventos encontrados</option>
              {events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </div>
          <p>Revise os resultados: o reconhecimento facial pode incluir outras pessoas.</p>
          <div className="flex flex-wrap gap-3 items-center">
            <button type="button" className="btn btn-secondary" disabled={busy || !visiblePhotos.length} onClick={selectVisible}>Selecionar resultados do filtro</button>
            <button type="button" className="btn btn-secondary" disabled={busy || !selected.length} onClick={() => setSelected([])}>Limpar seleção</button>
            <span role="status">{selected.length} / {MAX_ITEMS} selecionados{hiddenSelected > 0 ? ` (${hiddenSelected} fora do filtro)` : ""}</span>
          </div>
          {!visiblePhotos.length && <p className="text-muted">Nenhum arquivo encontrado.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visiblePhotos.map(photo => (
              <article key={photo.id} className="rounded-xl border border-white/10 overflow-hidden">
                <div className="aspect-video bg-black/20">
                  <MediaPreview media={photo} controls={photo.mediaType === "video"} className="w-full h-full object-contain" />
                </div>
                <label className="flex gap-3 p-3 items-start">
                  <input type="checkbox" checked={selected.includes(photo.id)} disabled={busy} onChange={() => toggle(photo.id)} />
                  <span className="min-w-0">
                    <span className="block break-all">{photo.originalFilename}</span>
                    <span className="block text-sm text-muted">{photo.event.name} - {photo.mediaType === "video" ? "Vídeo" : "Foto"}</span>
                  </span>
                </label>
              </article>
            ))}
          </div>
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
