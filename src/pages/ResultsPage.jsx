import { useSearchStore } from "../store/searchStore";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Check, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import Cart from "../components/Cart";

// Agrupa fotos por eventId e retorna array ordenado pelo nome do evento
function groupPhotosByEvent(photos) {
  const map = {};
  photos.forEach((photo) => {
    const id = photo.eventId;
    if (!map[id]) {
      map[id] = { eventId: id, event: photo.event, photos: [] };
    }
    map[id].photos.push(photo);
  });
  return Object.values(map).sort((a, b) =>
    (a.event?.name || "").localeCompare(b.event?.name || "")
  );
}

// Tabela de preços do evento
function PricingTable({ event }) {
  if (!event) return null;
  const { pricePerPhoto, pricingPackages, allPhotosPrice } = event;

  // Monta linhas: 1 por X, pacotes, todas
  const rows = [];
  if (pricePerPhoto) {
    rows.push({ label: "1 foto", price: parseFloat(pricePerPhoto), highlight: false });
  }
  if (pricingPackages && pricingPackages.length > 0) {
    const sorted = [...pricingPackages].sort((a, b) => a.quantity - b.quantity);
    sorted.forEach((pkg) => {
      rows.push({
        label: `${pkg.quantity} fotos`,
        price: parseFloat(pkg.price),
        priceEach: pricePerPhoto ? (parseFloat(pkg.price) / pkg.quantity) : null,
        highlight: false,
      });
    });
  }
  if (allPhotosPrice) {
    rows.push({
      label: "Todas as fotos",
      price: parseFloat(allPhotosPrice),
      isAll: true,
      highlight: true,
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-2.5 gap-4"
          style={
            row.highlight
              ? { background: 'var(--lime-dim)', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }
              : { background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }
          }
        >
          <div className="flex items-center gap-2">
            {row.highlight && <Zap className="h-3.5 w-3.5 text-lime flex-shrink-0" />}
            <span
              className="text-sm font-semibold"
              style={{ color: row.highlight ? 'var(--lime)' : 'var(--text)' }}
            >
              {row.label}
            </span>
            {row.highlight && (
              <span className="text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5"
                style={{ background: 'var(--lime)', color: '#09090B' }}>
                melhor valor
              </span>
            )}
          </div>
          <div className="text-right">
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: row.highlight ? 'var(--lime)' : 'var(--text)' }}
            >
              R$ {row.price.toFixed(2)}
            </span>
            {row.priceEach && (
              <p className="text-[11px] text-muted">
                R$ {row.priceEach.toFixed(2)} cada
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const { searchResults } = useSearchStore();
  const { addPhoto, items } = useCartStore();
  const navigate = useNavigate();

  const eventGroups = useMemo(() => groupPhotosByEvent(searchResults || []), [searchResults]);
  const multiEvent = eventGroups.length > 1;

  const [activeTab, setActiveTab] = useState(0);

  const isPhotoInCart = (photoId) => items.some((item) => item.id === photoId);

  const handleAddToCart = (photo) => {
    addPhoto(photo, photo.eventId, photo.event?.name || "Evento", {
      pricePerPhoto: photo.event?.pricePerPhoto,
      pricingPackages: photo.event?.pricingPackages,
      allPhotosPrice: photo.event?.allPhotosPrice,
    });
  };

  const handleAddAllInGroup = (group) => {
    group.photos.forEach((photo) => {
      if (!isPhotoInCart(photo.id)) handleAddToCart(photo);
    });
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Search className="h-16 w-16 text-dim mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-sora mb-2">
              Nenhuma foto encontrada
            </h2>
            <p className="text-muted mb-6">
              Não encontramos fotos com seu rosto. Tente com outra imagem.
            </p>
            <button onClick={() => navigate("/search")} className="btn btn-primary">
              Nova Busca
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-sora mb-2">
            Encontramos {searchResults.length} foto{searchResults.length > 1 ? "s" : ""}
            {multiEvent && ` em ${eventGroups.length} eventos`}!
          </h1>
          <p className="text-muted">
            Todas as fotos são exibidas com marca d'água. Adquira as originais em alta resolução.
          </p>
        </div>

        {/* Tab bar — only when 2+ events */}
        {multiEvent && (
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ borderBottom: '2px solid var(--border)' }}>
            {eventGroups.map((group, idx) => (
              <button
                key={group.eventId}
                onClick={() => setActiveTab(idx)}
                className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap"
                style={
                  activeTab === idx
                    ? { background: 'var(--lime)', color: '#09090B', borderBottom: '2px solid var(--lime)', marginBottom: '-2px' }
                    : { color: 'var(--text-muted)', background: 'transparent' }
                }
              >
                {group.event?.name || "Evento"}
                <span className="ml-2 text-xs opacity-70">
                  ({group.photos.length})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tab content — iterate over visible groups */}
        {eventGroups.map((group, idx) => {
          if (multiEvent && idx !== activeTab) return null;

          const allGroupInCart = group.photos.every((p) => isPhotoInCart(p.id));

          return (
            <div key={group.eventId}>
              {/* Event info + select-all row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex flex-col gap-3 flex-1 max-w-sm">
                  {multiEvent && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>
                        {group.event?.date
                          ? new Date(group.event.date).toLocaleDateString("pt-BR")
                          : ""}
                        {group.event?.location ? ` · ${group.event.location}` : ""}
                      </span>
                    </div>
                  )}
                  <PricingTable event={group.event} />
                </div>
                <button
                  onClick={() => handleAddAllInGroup(group)}
                  disabled={allGroupInCart}
                  className="btn btn-primary whitespace-nowrap flex items-center gap-2 self-start"
                >
                  {allGroupInCart ? (
                    <>
                      <Check className="h-4 w-4" />
                      Todas no Carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Selecionar Todas ({group.photos.length})
                    </>
                  )}
                </button>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                {group.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-white/20"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="aspect-square">
                      <img
                        src={photo.watermarkedUrl}
                        alt={photo.originalFilename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        {!multiEvent && (
                          <span className="text-xs font-medium truncate">
                            {photo.event?.name}
                          </span>
                        )}
                        <span className={`badge badge-info text-[10px] px-1.5 py-0.5 whitespace-nowrap ${multiEvent ? 'w-full text-center' : 'ml-1'}`}>
                          {Math.round(photo.similarity)}% match
                        </span>
                      </div>

                      {!multiEvent && (
                        <p className="text-[10px] text-dim mb-2">
                          {new Date(photo.event?.date).toLocaleDateString("pt-BR")}
                        </p>
                      )}

                      {isPhotoInCart(photo.id) ? (
                        <button
                          disabled
                          className="w-full btn btn-success btn-sm text-xs py-1.5 flex items-center justify-center gap-1 mt-1"
                        >
                          <Check className="h-3 w-3" />
                          No Carrinho
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(photo)}
                          className="w-full btn btn-primary btn-sm text-xs py-1.5 flex items-center justify-center gap-1 mt-1"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="mt-4 flex justify-center">
          <button onClick={() => navigate("/search")} className="btn btn-secondary">
            Nova Busca
          </button>
        </div>

        {/* Cart */}
        <Cart />
      </div>
    </div>
  );
}
