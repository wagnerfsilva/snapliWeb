import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  MapPin,
  Image,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import EventForm from "../../components/forms/EventForm";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ page: 1, limit: 100 });
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      toast.error("Erro ao carregar eventos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (formData) => {
    try {
      const response = await eventsAPI.create(formData);
      if (response.data.success) {
        toast.success("Evento criado com sucesso!");
        setShowCreateModal(false);
        loadEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao criar evento");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Visualização em Lista"
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum evento cadastrado
          </h2>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro evento
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Criar Primeiro Evento
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/admin/events/${event.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {event.name}
                </h3>
                {event.isActive ? (
                  <span className="badge badge-success">Ativo</span>
                ) : (
                  <span className="badge badge-danger">Inativo</span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.date).toLocaleDateString("pt-BR")}
                </div>

                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                )}

                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  {event.photoCount} foto(s)
                </div>
              </div>

              {event.description && (
                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {event.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fotos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/admin/events/${event.id}`} className="block">
                        <div className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {event.name}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {event.description}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(event.date).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {event.location || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Image className="h-4 w-4 mr-2" />
                        {event.photoCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.isActive ? (
                        <span className="badge badge-success">Ativo</span>
                      ) : (
                        <span className="badge badge-danger">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <EventForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateEvent}
        />
      )}
    </div>
  );
}
