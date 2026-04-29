import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ImageIcon,
  Smartphone,
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
  const [originalUrls, setOriginalUrls] = useState({});
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState(null);

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

      // Pre-fetch original URLs for all photos so we can show originals
      const urls = {};
      await Promise.all(
        response.data.photos.map(async (photo) => {
          try {
            const res = await api.get(`/downloads/${token}/photo/${photo.id}`);
            urls[photo.id] = res.data.downloadUrl;
          } catch {
            // ignore - will fall back to previewUrl
          }
        }),
      );
      setOriginalUrls(urls);
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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    // On iOS, open a blank tab SYNCHRONOUSLY (before any await),
    // otherwise Safari blocks the popup as it no longer counts
    // as a user gesture after an async call.
    let newTab = null;
    if (isIOS) {
      newTab = window.open("about:blank", "_blank");
    }

    try {
      setDownloading((prev) => ({ ...prev, [photoId]: true }));

      // Use pre-fetched URL or fetch a fresh one
      let downloadUrl = originalUrls[photoId];
      if (!downloadUrl) {
        const response = await api.get(`/downloads/${token}/photo/${photoId}`);
        downloadUrl = response.data.downloadUrl;
      }

      if (isIOS) {
        // iOS: open in new tab for user to long-press and save
        if (newTab) {
          newTab.location.href = downloadUrl;
        } else {
          window.open(downloadUrl, "_blank");
        }
      } else if (isAndroid) {
        // Android: try direct download via anchor tag
        try {
          const resp = await fetch(downloadUrl);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch {
          // Fallback: open in new tab like iOS
          window.open(downloadUrl, "_blank");
        }
      } else {
        // Desktop: S3 URL já vem com Content-Disposition: attachment
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

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
      if (newTab) newTab.close();
      alert("Erro ao fazer download. Tente novamente.");
    } finally {
      setDownloading((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    setDownloadAllProgress({ done: 0, total: photos.length });

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        let downloadUrl = originalUrls[photo.id];
        if (!downloadUrl) {
          const response = await api.get(`/downloads/${token}/photo/${photo.id}`);
          downloadUrl = response.data.downloadUrl;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          window.open(downloadUrl, '_blank');
          await new Promise(r => setTimeout(r, 1500));
        } else {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = photo.originalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        console.error(`Erro ao baixar ${photo.originalFilename}:`, err);
      }
      setDownloadAllProgress({ done: i + 1, total: photos.length });
    }

    setDownloadingAll(false);
    setDownloadAllProgress(null);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime mx-auto"></div>
          <p className="mt-4 text-muted">Carregando suas fotos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md w-full card p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF5050' }} />
          <h2 className="text-2xl font-bold font-sora mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(order?.downloadExpiresAt);

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold font-sora mb-2">
                Suas Fotos Estão Prontas! 🎉
              </h1>
              <p className="text-muted">
                Olá, <strong className="text-white">{order?.customerName}</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-dim">Pedido</div>
              <div className="font-mono text-sm text-muted">
                #{order?.id?.substring(0, 8)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl p-4" style={{ background: 'rgba(56,189,248,0.08)' }}>
              <div className="flex items-center mb-2" style={{ color: '#38BDF8' }}>
                <ImageIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">Total de Fotos</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {photos.length}
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,170,0.08)' }}>
              <div className="flex items-center mb-2" style={{ color: '#00D4AA' }}>
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Pagamento</span>
              </div>
              <div className="text-2xl font-bold text-white">
                R$ {parseFloat(order?.totalAmount || 0).toFixed(2)}
              </div>
              <div className="text-sm mt-1" style={{ color: '#00D4AA' }}>
                Confirmado em {formatDate(order?.paidAt)}
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: daysRemaining > 7 ? 'rgba(56,189,248,0.08)' : 'rgba(255,200,0,0.08)' }}
            >
              <div
                className="flex items-center mb-2"
                style={{ color: daysRemaining > 7 ? '#38BDF8' : '#FFC800' }}
              >
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">Disponível por</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {daysRemaining} dias
              </div>
              <div
                className="text-sm mt-1"
                style={{ color: daysRemaining > 7 ? '#38BDF8' : '#FFC800' }}
              >
                Até{" "}
                {new Date(order?.downloadExpiresAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>

          {daysRemaining <= 7 && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.2)' }}>
              <p style={{ color: '#FFC800' }}>
                ⚠️ <strong>Atenção:</strong> Seu período de download está
                terminando. Faça o download de todas as suas fotos o quanto
                antes!
              </p>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-sora">Suas Fotos</h2>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="btn btn-primary flex items-center gap-2"
            >
              {downloadingAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark"></div>
                  {downloadAllProgress
                    ? `Baixando ${downloadAllProgress.done}/${downloadAllProgress.total}...`
                    : 'Preparando...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Baixar Todas ({photos.length})
                </>
              )}
            </button>
          </div>

          {/* Mobile download tip */}
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 md:hidden" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#38BDF8' }} />
            <p className="text-sm text-muted">
              <strong className="text-white">Dica:</strong> Ao clicar em "Baixar", a foto abrirá em
              uma nova aba. Segure o dedo sobre a imagem e toque em{" "}
              <strong className="text-white">"Salvar Imagem"</strong> ou{" "}
              <strong className="text-white">"Adicionar às Fotos"</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-white/10"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                {/* Photo Preview */}
                <div className="aspect-video relative" style={{ background: '#1a1a1e' }}>
                  <img
                    src={originalUrls[photo.id] || photo.previewUrl}
                    alt={photo.originalFilename}
                    className="w-full h-full object-cover"
                  />
                  {photo.downloadedAt && (
                    <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full flex items-center" style={{ background: 'rgba(0,212,170,0.9)', color: '#09090B' }}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Baixada
                    </div>
                  )}
                </div>

                {/* Photo Info */}
                <div className="p-4">
                  <div className="text-sm font-medium mb-2 truncate">
                    {photo.originalFilename}
                  </div>

                  <div className="text-xs text-dim mb-3 space-y-1">
                    <div>
                      {photo.width} × {photo.height}px
                    </div>
                    <div>{formatFileSize(photo.fileSize)}</div>
                    {photo.event && (
                      <div className="text-lime font-medium">
                        {photo.event.name}
                      </div>
                    )}
                    {photo.downloadCount > 0 && (
                      <div style={{ color: '#00D4AA' }}>
                        Downloads: {photo.downloadCount}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handleDownload(photo.id, photo.originalFilename)
                    }
                    disabled={downloading[photo.id]}
                    className="w-full btn btn-primary flex items-center justify-center"
                  >
                    {downloading[photo.id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark mr-2"></div>
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
        <div className="mt-6 rounded-xl p-6 text-center" style={{ background: 'var(--lime-dim)' }}>
          <h3 className="font-semibold text-lime mb-2">
            💾 Downloads Ilimitados
          </h3>
          <p className="text-muted text-sm">
            Você pode baixar suas fotos quantas vezes quiser durante o período
            de {getDaysRemaining(order?.downloadExpiresAt)} dias. As fotos
            originais em alta resolução serão baixadas sem marca d'água.
          </p>
        </div>

        {/* Support */}
        <div className="mt-4 text-center text-dim text-sm">
          <p>Problemas com o download? Entre em contato conosco.</p>
          <p className="mt-2">Email: {order?.customerEmail}</p>
        </div>
      </div>
    </div>
  );
}
