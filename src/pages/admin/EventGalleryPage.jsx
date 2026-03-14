import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { photosAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Image,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function EventGalleryPage() {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
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
        setPhotos((prev) => prev.filter((p) => p._id !== photoId));
        setTotal((prev) => prev - 1);
        if (selectedPhoto?._id === photoId) setSelectedPhoto(null);
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

  const getStatusBadge = (status) => {
    const map = {
      completed: { label: "Processada", cls: "bg-green-100 text-green-700" },
      processing: { label: "Processando", cls: "bg-yellow-100 text-yellow-700" },
      pending: { label: "Pendente", cls: "bg-gray-100 text-gray-700" },
      failed: { label: "Erro", cls: "bg-red-100 text-red-700" },
    };
    const info = map[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.cls}`}>
        {info.label}
      </span>
    );
  };

  const navigatePhoto = (direction) => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p._id === selectedPhoto._id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const getPhotoUrl = (photo) => {
    return photo.thumbnailUrl || photo.watermarkedUrl || photo.originalUrl || photo.url;
  };

  const getFullPhotoUrl = (photo) => {
    return photo.watermarkedUrl || photo.originalUrl || photo.url || photo.thumbnailUrl;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/admin/events/${id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Detalhes do Evento
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fotos do Evento</h1>
            <p className="text-sm text-gray-500 mt-1">
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
          <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && photos.length === 0 && (
        <div className="text-center py-16">
          <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma foto encontrada
          </h2>
          <p className="text-gray-500 mb-4">
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
                key={photo._id}
                className="group relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div
                  className="aspect-square cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={getPhotoUrl(photo)}
                    alt={photo.originalName || "Foto"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(photo.processingStatus)}
                </div>

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  {photo.processingStatus === "failed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(photo._id);
                      }}
                      className="p-1.5 bg-white rounded-full shadow hover:bg-yellow-50"
                      title="Reprocessar"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-yellow-600" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo._id);
                    }}
                    disabled={isDeletingId === photo._id}
                    className="p-1.5 bg-white rounded-full shadow hover:bg-red-50"
                    title="Excluir"
                  >
                    {isDeletingId === photo._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </button>
                </div>

                {/* File name */}
                <div className="p-2">
                  <p className="text-xs text-gray-500 truncate">
                    {photo.originalName || "Sem nome"}
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

              <span className="text-sm text-gray-600">
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
            {photos.findIndex((p) => p._id === selectedPhoto._id) > 0 && (
              <button
                onClick={() => navigatePhoto(-1)}
                className="absolute left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <img
              src={getFullPhotoUrl(selectedPhoto)}
              alt={selectedPhoto.originalName || "Foto"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />

            {/* Next */}
            {photos.findIndex((p) => p._id === selectedPhoto._id) <
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
              <p className="text-white text-sm font-medium">
                {selectedPhoto.originalName || "Sem nome"}
              </p>
              <div className="flex items-center space-x-3 mt-1">
                {getStatusBadge(selectedPhoto.processingStatus)}
                {selectedPhoto.facesDetected !== undefined && (
                  <span className="text-xs text-gray-300">
                    {selectedPhoto.facesDetected} rosto{selectedPhoto.facesDetected !== 1 ? "s" : ""} detectado{selectedPhoto.facesDetected !== 1 ? "s" : ""}
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
