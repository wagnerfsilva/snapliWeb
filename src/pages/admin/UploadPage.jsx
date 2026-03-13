import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { eventsAPI, photosAPI } from "../../lib/api";
import toast from "react-hot-toast";
import { Upload, Image, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function UploadPage() {
  const { id } = useParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (id && events.length > 0) {
      setSelectedEvent(id);
    }
  }, [id, events]);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll({
        page: 1,
        limit: 100,
        isActive: true,
      });
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      toast.error("Erro ao carregar eventos");
    }
  };

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento");
      return;
    }

    if (files.length === 0) {
      toast.error("Adicione pelo menos uma foto");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("eventId", selectedEvent);

    files.forEach(({ file }) => {
      formData.append("photos", file);
    });

    try {
      const response = await photosAPI.upload(formData, (progressEvent) => {
        // Upload representa 70% do progresso total
        const uploadProgress = Math.round(
          (progressEvent.loaded * 70) / progressEvent.total,
        );
        setUploadProgress(uploadProgress);
      });

      // Upload completo, iniciando processamento (70% -> 90%)
      setUploadProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadProgress(85);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadProgress(95);

      if (response.data.success) {
        // Processamento concluído
        setUploadProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(response.data.message);
        setFiles([]);
        setSelectedEvent("");
        setUploadProgress(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload de Fotos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selection */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Evento
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input"
              disabled={isUploading}
            >
              <option value="">Escolha um evento...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} -{" "}
                  {new Date(event.date).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div className="card">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-primary-400"
              } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive
                  ? "Solte as imagens aqui"
                  : "Arraste fotos aqui ou clique para selecionar"}
              </p>
              <p className="text-sm text-gray-500">
                Formatos aceitos: JPEG, PNG, WebP (máx. 10MB cada)
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="card">
              <div className="flex items-center mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary-600 mr-2" />
                <span className="text-sm font-medium">
                  Fazendo upload... {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="flex space-x-4">
              <button
                onClick={handleUpload}
                disabled={isUploading || !selectedEvent}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  `Enviar ${files.length} foto(s)`
                )}
              </button>
              <button
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="btn btn-secondary"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Fotos Selecionadas ({files.length})
            </h3>

            {files.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Nenhuma foto selecionada
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {files.map((item, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!isUploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
