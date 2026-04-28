import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { photosAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Image,
  Loader2,
  Trash2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function EventGalleryPage() {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [id, page]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const response = await photosAPI.getGallery(id, { page, limit: 24 });
      if (response.data.success) {
        const data = response.data.data;
        setPhotos(data.photos || []);
        setEventInfo(data.event || null);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      toast.error("Erro ao carregar fotos do evento");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;

    setIsDeletingId(photoId);
    try {
      const response = await photosAPI.delete(photoId);
      if (response.data.success) {
        toast.success("Foto excluída com sucesso!");
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setTotal((prev) => prev - 1);
        if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      }
    } catch (error) {
      toast.error("Erro ao excluir foto");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleRetry = async (photoId) => {
    try {
      await photosAPI.retryProcessing(photoId);
      toast.success("Reprocessamento iniciado!");
      loadPhotos();
    } catch (error) {
      toast.error("Erro ao reprocessar foto");
    }
  };

  const navigatePhoto = (direction) => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/admin/events/${id}`}
          className="inline-flex items-center text-muted hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Detalhes do Evento
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-sora">
              {eventInfo ? `Fotos - ${eventInfo.name}` : "Fotos do Evento"}
            </h1>
            <p className="text-sm text-muted mt-1">
              {total} foto{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
            </p>
          </div>

          <button onClick={loadPhotos} className="btn btn-secondary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-lime" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && photos.length === 0 && (
        <div className="text-center py-16">
          <Image className="h-16 w-16 text-dim mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            Nenhuma foto encontrada
          </h2>
          <p className="text-muted mb-4">
            Faça upload de fotos para este evento.
          </p>
          <Link
            to={`/admin/events/${id}/upload`}
            className="btn btn-primary inline-flex items-center"
          >
            Upload de Fotos
          </Link>
        </div>
      )}

      {/* Photo grid */}
      {!isLoading && photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-white/10"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="aspect-square cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.watermarkedUrl}
                    alt="Foto do evento"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    disabled={isDeletingId === photo.id}
                    className="p-1.5 rounded-full" style={{ background: 'var(--surface)' }}
                    title="Excluir"
                  >
                    {isDeletingId === photo.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#FF5050' }} />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" style={{ color: '#FF5050' }} />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-muted truncate">
                    {photo.faceCount != null ? `${photo.faceCount} rosto${photo.faceCount !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary flex items-center space-x-1 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <span className="text-sm text-muted">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary flex items-center space-x-1 disabled:opacity-50"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous */}
            {photos.findIndex((p) => p.id === selectedPhoto.id) > 0 && (
              <button
                onClick={() => navigatePhoto(-1)}
                className="absolute left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <img
              src={selectedPhoto.watermarkedUrl}
              alt="Foto do evento"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />

            {/* Next */}
            {photos.findIndex((p) => p.id === selectedPhoto.id) <
              photos.length - 1 && (
              <button
                onClick={() => navigatePhoto(1)}
                className="absolute right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Photo info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center space-x-3">
                {selectedPhoto.faceCount != null && (
                  <span className="text-xs text-gray-300">
                    {selectedPhoto.faceCount} rosto{selectedPhoto.faceCount !== 1 ? "s" : ""} detectado{selectedPhoto.faceCount !== 1 ? "s" : ""}
                  </span>
                )}
                {selectedPhoto.createdAt && (
                  <span className="text-xs text-gray-300">
                    {new Date(selectedPhoto.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
