import { useSearchStore } from "../store/searchStore";
import useCartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Check,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import Cart from "../components/Cart";
import SearchResultsGallery from "../components/SearchResultsGallery";
import { groupPhotosByEvent } from "../lib/searchResults";

// Tabela de preços do evento
function PricingTable({ event, mediaType = "photo" }) {
  if (!event) return null;
  const isVideo = mediaType === "video";
  const pricePerPhoto = isVideo ? event.pricePerVideo : event.pricePerPhoto;
  const pricingPackages = isVideo
    ? event.videoPricingPackages
    : event.pricingPackages;
  const allPhotosPrice = isVideo ? event.allVideosPrice : event.allPhotosPrice;
  const freeCount = isVideo ? event.freeVideosCount : event.freePhotosCount;

  // Monta linhas: 1 por X, pacotes, todas
  const rows = [];
  if (pricePerPhoto) {
    rows.push({
      label: isVideo ? "1 vídeo" : "1 foto",
      price: parseFloat(pricePerPhoto),
      highlight: false,
    });
  }
  if (pricingPackages && pricingPackages.length > 0) {
    const sorted = [...pricingPackages].sort((a, b) => a.quantity - b.quantity);
    sorted.forEach((pkg) => {
      rows.push({
        label: `${pkg.quantity} ${isVideo ? "vídeos" : "fotos"}`,
        price: parseFloat(pkg.price),
        priceEach: pricePerPhoto ? parseFloat(pkg.price) / pkg.quantity : null,
        highlight: false,
      });
    });
  }
  if (allPhotosPrice) {
    rows.push({
      label: isVideo ? "Todos os vídeos" : "Todas as fotos",
      price: parseFloat(allPhotosPrice),
      isAll: true,
      highlight: true,
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {freeCount > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--amber-dim)", color: "var(--amber)" }}
        >
          <Zap className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            +{freeCount} {isVideo ? "vídeo" : "foto"}
            {freeCount > 1 ? "s" : ""} grátis nesta compra
          </span>
        </div>
      )}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2.5 gap-4"
            style={
              row.highlight
                ? {
                    background: "var(--amber-dim)",
                    borderTop:
                      i > 0 ? "1px solid rgba(245,158,11,0.15)" : "none",
                  }
                : {
                    background: i % 2 === 0 ? "var(--bg)" : "var(--surface)",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }
            }
          >
            <div className="flex items-center gap-2">
              {row.highlight && (
                <Zap
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: "var(--amber)" }}
                />
              )}
              <span
                className="text-sm font-semibold"
                style={{
                  color: row.highlight ? "var(--amber)" : "var(--text)",
                }}
              >
                {row.label}
              </span>
              {row.highlight && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5"
                  style={{ background: "var(--amber)", color: "#09090B" }}
                >
                  melhor valor
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {row.priceEach && (
                <span className="text-[11px] text-muted tabular-nums">
                  R$ {row.priceEach.toFixed(2)} cada
                </span>
              )}
              <span
                className={`font-bold tabular-nums ${row.highlight ? "text-lg" : "text-base"}`}
                style={{
                  color: row.highlight ? "var(--amber)" : "var(--text)",
                }}
              >
                R$ {row.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { searchResults } = useSearchStore();
  const { addPhoto, items } = useCartStore();
  const navigate = useNavigate();

  const eventGroups = useMemo(
    () => groupPhotosByEvent(searchResults || []),
    [searchResults],
  );
  const multiEvent = eventGroups.length > 1;

  const isPhotoInCart = (photoId) => items.some((item) => item.id === photoId);

  const handleAddToCart = (photo) => {
    addPhoto(photo, photo.eventId, photo.event?.name || "Evento", {
      pricePerPhoto: photo.event?.pricePerPhoto,
      pricingPackages: photo.event?.pricingPackages,
      allPhotosPrice: photo.event?.allPhotosPrice,
      freePhotosCount: photo.event?.freePhotosCount,
      freeVideosCount: photo.event?.freeVideosCount,
      videoEnabled: photo.event?.videoEnabled,
      pricePerVideo: photo.event?.pricePerVideo,
      videoPricingPackages: photo.event?.videoPricingPackages,
      allVideosPrice: photo.event?.allVideosPrice,
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
              Nenhuma mídia encontrada
            </h2>
            <p className="text-muted mb-6">
              Não encontramos fotos com seu rosto. Tente com outra imagem.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="btn btn-primary"
            >
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
            Encontramos {searchResults.length} arquivo
            {searchResults.length > 1 ? "s" : ""}
            {multiEvent && ` em ${eventGroups.length} eventos`}!
          </h1>
          <p className="text-muted">
            Prévias com marca d'água. Originais disponíveis após o pagamento.
          </p>
        </div>

        <SearchResultsGallery
          photos={searchResults}
          renderGroupHeader={(group, visibleMedia, multipleEvents) => {
            if (!visibleMedia.length) return null;
            const allGroupInCart = visibleMedia.every(photo => isPhotoInCart(photo.id));
            return (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex flex-col gap-3 flex-1 max-w-sm">
                  {multipleEvents && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>
                        {group.event?.date
                          ? new Date(group.event.date).toLocaleDateString(
                              "pt-BR",
                            )
                          : ""}
                        {group.event?.location
                          ? ` · ${group.event.location}`
                          : ""}
                      </span>
                    </div>
                  )}
                  {visibleMedia.some(
                    (media) => media.mediaType !== "video",
                  ) && <PricingTable event={group.event} />}
                  {visibleMedia.some(
                    (media) => media.mediaType === "video",
                  ) && <PricingTable event={group.event} mediaType="video" />}
                </div>
                <button
                  onClick={() =>
                    handleAddAllInGroup({ ...group, photos: visibleMedia })
                  }
                  disabled={allGroupInCart}
                  className="btn btn-primary whitespace-nowrap flex items-center gap-2 self-start"
                >
                  {allGroupInCart ? (
                    <>
                      <Check className="h-4 w-4" />
                      Todos no Carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Selecionar Todos ({visibleMedia.length})
                    </>
                  )}
                </button>
              </div>
            );
          }}
          renderAction={(photo, className) => isPhotoInCart(photo.id) ? (
            <button type="button" disabled className={`${className} btn-success`}>
              <Check className="h-3 w-3" />
              No Carrinho
            </button>
          ) : (
            <button type="button" onClick={() => handleAddToCart(photo)} className={`${className} btn-primary`}>
              <ShoppingCart className="h-3 w-3" />
              Adicionar
            </button>
          )}
        />

        {/* Actions */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => navigate("/search")}
            className="btn btn-secondary"
          >
            Nova Busca
          </button>
        </div>

        {/* Cart */}
        <Cart />

      </div>
    </div>
  );
}
