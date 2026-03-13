import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import api from "../lib/api";

export default function DownloadPortalPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchOrderDetails();
  }, [token]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/downloads/${token}`);
      setOrder(response.data.order);
      setPhotos(response.data.photos);
    } catch (err) {
      console.error("Erro ao carregar pedido:", err);
      if (err.response?.status === 404) {
        setError("Token inválido ou expirado");
      } else if (err.response?.status === 410) {
        setError("O período de download expirou");
      } else if (err.response?.status === 403) {
        setError("Este pedido ainda não foi pago");
      } else {
        setError("Erro ao carregar suas fotos. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photoId, filename) => {
    try {
      setDownloading((prev) => ({ ...prev, [photoId]: true }));

      const response = await api.get(`/downloads/${token}/photo/${photoId}`);
      const { downloadUrl } = response.data;

      // Open download URL in new tab
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update photo status
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                downloadCount: (p.downloadCount || 0) + 1,
                downloadedAt: new Date(),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Erro ao fazer download:", err);
      alert("Erro ao gerar link de download. Tente novamente.");
    } finally {
      setDownloading((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas fotos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(order?.downloadExpiresAt);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Suas Fotos Estão Prontas! 🎉
              </h1>
              <p className="text-gray-600">
                Olá, <strong>{order?.customerName}</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Pedido</div>
              <div className="font-mono text-sm">
                #{order?.id?.substring(0, 8)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center text-blue-700 mb-2">
                <ImageIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">Total de Fotos</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {photos.length}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center text-green-700 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Pagamento</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                R$ {parseFloat(order?.totalAmount || 0).toFixed(2)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Confirmado em {formatDate(order?.paidAt)}
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${daysRemaining > 7 ? "bg-blue-50" : "bg-yellow-50"}`}
            >
              <div
                className={`flex items-center mb-2 ${daysRemaining > 7 ? "text-blue-700" : "text-yellow-700"}`}
              >
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">Disponível por</span>
              </div>
              <div
                className={`text-2xl font-bold ${daysRemaining > 7 ? "text-blue-900" : "text-yellow-900"}`}
              >
                {daysRemaining} dias
              </div>
              <div
                className={`text-sm mt-1 ${daysRemaining > 7 ? "text-blue-600" : "text-yellow-600"}`}
              >
                Até{" "}
                {new Date(order?.downloadExpiresAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>

          {daysRemaining <= 7 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Seu período de download está
                terminando. Faça o download de todas as suas fotos o quanto
                antes!
              </p>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Suas Fotos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Photo Preview */}
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={photo.previewUrl}
                    alt={photo.originalFilename}
                    className="w-full h-full object-cover"
                  />
                  {photo.downloadedAt && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Baixada
                    </div>
                  )}
                </div>

                {/* Photo Info */}
                <div className="p-4">
                  <div className="text-sm font-medium text-gray-900 mb-2 truncate">
                    {photo.originalFilename}
                  </div>

                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <div>
                      {photo.width} × {photo.height}px
                    </div>
                    <div>{formatFileSize(photo.fileSize)}</div>
                    {photo.event && (
                      <div className="text-blue-600 font-medium">
                        {photo.event.name}
                      </div>
                    )}
                    {photo.downloadCount > 0 && (
                      <div className="text-green-600">
                        Downloads: {photo.downloadCount}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handleDownload(photo.id, photo.originalFilename)
                    }
                    disabled={downloading[photo.id]}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloading[photo.id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Original
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">
            💾 Downloads Ilimitados
          </h3>
          <p className="text-blue-700 text-sm">
            Você pode baixar suas fotos quantas vezes quiser durante o período
            de {getDaysRemaining(order?.downloadExpiresAt)} dias. As fotos
            originais em alta resolução serão baixadas sem marca d'água.
          </p>
        </div>

        {/* Support */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Problemas com o download? Entre em contato conosco.</p>
          <p className="mt-2">Email: {order?.customerEmail}</p>
        </div>
      </div>
    </div>
  );
}
