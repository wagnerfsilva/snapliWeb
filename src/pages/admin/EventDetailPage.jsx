import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { eventsAPI, photosAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Calendar,
  MapPin,
  Image,
  Loader2,
  ArrowLeft,
  Edit2,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import EventForm from "../../components/forms/EventForm";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEventDetails();
    loadStatistics();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      const response = await eventsAPI.getById(id);
      if (response.data.success) {
        setEvent(response.data.data.event);
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do evento");
      navigate("/admin/events");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await eventsAPI.getStatistics(id);
      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleUpdateEvent = async (formData) => {
    try {
      const response = await eventsAPI.update(id, formData);
      if (response.data.success) {
        toast.success("Evento atualizado com sucesso!");
        setShowEditModal(false);
        loadEventDetails();
        loadStatistics();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar evento");
      throw error;
    }
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const response = await eventsAPI.delete(id);
      if (response.data.success) {
        toast.success("Evento excluído com sucesso!");
        navigate("/admin/events");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir evento");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Evento não encontrado
        </h2>
        <Link to="/admin/events" className="btn btn-primary mt-4">
          Voltar para Eventos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/events"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Eventos
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              {event.isActive ? (
                <span className="badge badge-success">Ativo</span>
              ) : (
                <span className="badge badge-danger">Inativo</span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(event.date).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {event.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Descrição
          </h2>
          <p className="text-gray-600 whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Photos */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Fotos</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics.totalPhotos}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Image className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Processadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {statistics.processingStatuses.completed}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Processing */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Processando</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {statistics.processingStatuses.processing +
                    statistics.processingStatuses.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Com Erro</p>
                <p className="text-3xl font-bold text-red-600">
                  {statistics.processingStatuses.failed}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Recognition Stats */}
      {statistics && statistics.totalFaces > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reconhecimento Facial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Rostos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalFaces}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Image className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fotos com Rostos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.photosWithFaces}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to={`/admin/events/${id}/upload`}
            className="btn btn-primary flex items-center justify-center space-x-2"
          >
            <Upload className="h-5 w-5" />
            <span>Upload de Fotos</span>
          </Link>

          <Link
            to={`/admin/events/${id}/photos`}
            className="btn btn-secondary flex items-center justify-center space-x-2"
          >
            <Image className="h-5 w-5" />
            <span>Ver Fotos do Evento</span>
          </Link>
        </div>
      </div>

      {/* Event Info */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do Evento
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Criado por</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {event.creator?.name || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {event.creator?.email || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Data de criação
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(event.createdAt).toLocaleString("pt-BR")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Última atualização
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(event.updatedAt).toLocaleString("pt-BR")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EventForm
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUpdateEvent}
          initialData={event}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Excluir Evento
              </h2>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o evento{" "}
              <strong>{event.name}</strong>?
              {statistics && statistics.totalPhotos > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Este evento possui {statistics.totalPhotos} foto(s). Você
                  precisará excluí-las primeiro.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEvent}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2"
                disabled={
                  isDeleting || (statistics && statistics.totalPhotos > 0)
                }
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
