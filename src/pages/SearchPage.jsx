import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { searchAPI } from "../lib/api";
import { useSearchStore } from "../store/searchStore";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";

export default function SearchPage() {
  const navigate = useNavigate();
  const { setSearchResults, setIsSearching, setUploadedImage, setSearchError } =
    useSearchStore();
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      handleSearch(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSearch = async (file) => {
    setIsLoading(true);
    setIsSearching(true);
    setSearchError(null);

    try {
      const formData = new FormData();
      formData.append("searchPhoto", file);

      const response = await searchAPI.searchByFace(formData);

      if (response.data.success) {
        setSearchResults(response.data.data.photos);
        setUploadedImage(preview);
        toast.success(response.data.message);
        navigate("/results");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Erro ao buscar fotos";
      setSearchError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);

      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      if (error.name === "NotAllowedError") {
        toast.error(
          "Permissão para acessar câmera negada. Por favor, permita o acesso.",
        );
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada no dispositivo.");
      } else {
        toast.error(
          "Erro ao acessar câmera. Verifique as permissões do navegador.",
        );
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        setPreview(URL.createObjectURL(file));
        handleSearch(file);
        closeCamera();
      },
      "image/jpeg",
      0.95,
    );
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  return (
    <div className="flex-1 max-w-[720px] mx-auto w-full px-6 py-12 sm:py-16">
      {/* Heading */}
      <h1 className="font-sora font-extrabold text-center mb-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
        Encontre suas <em className="not-italic text-lime">Fotos</em>
      </h1>
      <p className="text-center text-muted text-lg mb-8">
        Envie uma foto com seu rosto para encontrar todas as fotos onde você aparece
      </p>

      {/* Tips */}
      <div className="rounded-xl p-5 mb-8" style={{ background: 'var(--surface)', borderLeft: '3px solid var(--lime)' }}>
        <div className="flex items-center gap-2 font-semibold text-sm text-lime mb-2">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          Dicas pra melhor resultado
        </div>
        <ul className="space-y-1">
          {[
            "Foto clara, rosto bem visível",
            "Sem óculos escuros ou acessórios cobrindo o rosto",
            "Boa iluminação faz diferença",
          ].map((tip) => (
            <li key={tip} className="text-sm text-muted pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55rem] before:w-1.5 before:h-1.5 before:rounded-full before:bg-dim">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Upload Card */}
      <div className="card mb-6">
        {!preview ? (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-lime bg-lime-dim"
                  : "border-white/10 hover:border-lime hover:bg-lime-dim"
              }`}
            >
              <input {...getInputProps()} />
              <svg className={`w-14 h-14 mx-auto mb-4 transition-colors ${isDragActive ? 'text-lime' : 'text-dim'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <h3 className="text-base font-semibold mb-1">
                {isDragActive
                  ? "Solte a imagem aqui"
                  : "Arraste uma foto aqui ou clique pra selecionar"}
              </h3>
              <p className="text-sm text-dim">JPEG, PNG, WebP — máx. 10MB</p>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleCameraCapture}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span>Usar câmera</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <img
                src={preview}
                alt="Preview"
                className="max-h-96 mx-auto rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-lime mx-auto mb-2" />
                <p className="text-muted">Buscando suas fotos...</p>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setPreview(null);
                    setSearchError(null);
                  }}
                  className="btn btn-secondary"
                >
                  Trocar Foto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-sora">Capturar Foto</h3>
              <button
                onClick={closeCamera}
                className="text-muted hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden mb-4" style={{ background: '#000' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span>Capturar Foto</span>
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
