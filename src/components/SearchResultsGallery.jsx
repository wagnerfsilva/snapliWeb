import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { groupPhotosByEvent } from "../lib/searchResults";
import MediaPreview from "./MediaPreview";

export default function SearchResultsGallery({
  photos,
  renderGroupHeader,
  renderAction,
  disabled = false,
}) {
  const eventGroups = useMemo(() => groupPhotosByEvent(photos), [photos]);
  const multiEvent = eventGroups.length > 1;
  const [activeTab, setActiveTab] = useState(0);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [lightbox, setLightbox] = useState(null);
  const hasVideos = photos.some(photo => photo.mediaType === "video");

  useEffect(() => {
    if (!lightbox) return undefined;
    const lastIndex = lightbox.list.length - 1;
    const onKeyDown = event => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowLeft")
        setLightbox(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }));
      if (event.key === "ArrowRight")
        setLightbox(prev => ({ ...prev, index: Math.min(lastIndex, prev.index + 1) }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  return (
    <>
      {hasVideos && (
        <div className="flex gap-1 mb-6" role="tablist" aria-label="Resultados por tipo">
          {[
            { value: "all", label: "Todos" },
            { value: "photo", label: "Fotos" },
            { value: "video", label: "Vídeos" },
          ].map(filter => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={mediaFilter === filter.value}
              disabled={disabled}
              className={`btn ${mediaFilter === filter.value ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMediaFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {multiEvent && (
        <div
          className="flex gap-1 mb-6 overflow-x-auto pb-1"
          style={{ borderBottom: "2px solid var(--border)" }}
          role="tablist"
          aria-label="Resultados por evento"
        >
          {eventGroups.map((group, index) => (
            <button
              key={group.eventId}
              type="button"
              role="tab"
              aria-selected={activeTab === index}
              disabled={disabled}
              onClick={() => setActiveTab(index)}
              className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap"
              style={activeTab === index ? {
                background: "var(--lime)",
                color: "#09090B",
                borderBottom: "2px solid var(--lime)",
                marginBottom: "-2px",
              } : { color: "var(--muted)", background: "transparent" }}
            >
              {group.event?.name || "Evento"}
              <span className="ml-2 text-xs opacity-70">({group.photos.length})</span>
            </button>
          ))}
        </div>
      )}

      {eventGroups.map((group, index) => {
        if (multiEvent && index !== activeTab) return null;
        const visibleMedia = group.photos.filter(media =>
          mediaFilter === "all" || (media.mediaType || "photo") === mediaFilter
        );
        return (
          <div key={group.eventId}>
            {renderGroupHeader(group, visibleMedia, multiEvent)}
            {!visibleMedia.length && (
              <p className="text-muted mb-6">Nenhum arquivo deste tipo neste evento.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
              {visibleMedia.map((photo, photoIndex) => (
                <div
                  key={photo.id}
                  className="group relative rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-white/20"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="aspect-square relative cursor-pointer"
                    style={{ background: "var(--bg)" }}
                    role="button"
                    tabIndex={0}
                    aria-label={photo.mediaType === "video" ? "Assistir prévia do vídeo" : "Ampliar foto"}
                    onClick={() => setLightbox({ list: visibleMedia, index: photoIndex })}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setLightbox({ list: visibleMedia, index: photoIndex });
                      }
                    }}
                  >
                    <MediaPreview media={photo} className="w-full h-full object-contain" />
                    {photo.mediaType === "video" && photo.previewUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="p-3 rounded-full bg-black/60 text-white">
                          <Play className="h-5 w-5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    {photo.mediaType === "video" && (
                      <p className="text-xs text-muted mb-1">Vídeo · {Math.ceil((photo.durationMs || 0) / 1000)}s</p>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      {!multiEvent && <span className="text-xs font-medium truncate">{photo.event?.name}</span>}
                      <span className={`badge badge-info text-[10px] px-1.5 py-0.5 whitespace-nowrap ${multiEvent ? "w-full text-center" : "ml-1"}`}>
                        {Math.round(photo.similarity)}% match
                      </span>
                    </div>
                    {!multiEvent && (
                      <p className="text-[10px] text-dim mb-2">{new Date(photo.event?.date).toLocaleDateString("pt-BR")}</p>
                    )}
                    {renderAction(photo, "w-full btn btn-sm text-xs py-1.5 flex items-center justify-center gap-1 mt-1")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {lightbox && (() => {
        const current = lightbox.list[lightbox.index];
        const go = step => setLightbox(prev => ({ ...prev, index: prev.index + step }));
        return (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-label="Prévia do arquivo"
            aria-modal="true"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center gap-3"
              onClick={event => event.stopPropagation()}
            >
              <button type="button" onClick={() => setLightbox(null)} aria-label="Fechar" className="absolute -top-10 right-0 text-white hover:text-gray-300">
                <X className="h-6 w-6" />
              </button>
              {lightbox.index > 0 && (
                <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <MediaPreview key={current.id} media={current} controls className="max-w-full max-h-[75vh] object-contain rounded-lg" />
              {lightbox.index < lightbox.list.length - 1 && (
                <button type="button" onClick={() => go(1)} aria-label="Próximo" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
              <div className="w-full flex items-center justify-between gap-3 px-1">
                <span className="text-xs text-gray-300">{current.mediaType === "video" ? "Vídeo" : "Foto"} · prévia com marca d'água</span>
                {renderAction(current, "btn btn-sm text-xs flex items-center gap-1")}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
