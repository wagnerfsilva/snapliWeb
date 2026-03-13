import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { searchAPI } from "../lib/api";
import { useSearchStore } from "../store/searchStore";
import toast from "react-hot-toast";
import { Upload, Camera, Loader2, AlertCircle, X } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Encontre suas Fotos
          </h1>
          <p className="text-lg text-gray-600">
            Envie uma foto com seu rosto para encontrar todas as fotos onde você
            aparece
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas para melhor resultado:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use uma foto clara com seu rosto bem visível</li>
                <li>
                  Evite fotos com óculos escuros ou acessórios que cubram o
                  rosto
                </li>
                <li>Certifique-se de ter boa iluminação</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="card">
          {!preview ? (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-primary-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {isDragActive
                    ? "Solte a imagem aqui"
                    : "Arraste uma foto aqui ou clique para selecionar"}
                </p>
                <p className="text-sm text-gray-500">
                  Formatos aceitos: JPEG, PNG, WebP (máx. 10MB)
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleCameraCapture}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Camera className="h-5 w-5" />
                  <span>Usar Câmera</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-96 mx-auto rounded-lg shadow-md"
                />
              </div>

              {isLoading ? (
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                  <p className="text-gray-600">Buscando suas fotos...</p>
                </div>
              ) : (
                <div className="flex justify-center space-x-4">
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
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Capturar Foto</h3>
                <button
                  onClick={closeCamera}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
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
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Camera className="h-5 w-5" />
                  <span>Capturar Foto</span>
                </button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
