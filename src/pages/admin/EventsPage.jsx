import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  Image,
  Loader2,
} from "lucide-react";
import EventForm from "../../components/forms/EventForm";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        <Loader2 className="h-12 w-12 animate-spin text-lime" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-sora">Eventos</h1>

        <div className="flex items-center space-x-3">
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
          <Calendar className="h-16 w-16 text-dim mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhum evento cadastrado
          </h2>
          <p className="text-muted mb-6">
            Comece criando seu primeiro evento
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Criar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Fotos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Total Vendido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Ticket Médio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const totalRevenue = parseFloat(event.totalRevenue || 0);
                  const paidOrdersCount = parseInt(event.paidOrdersCount || 0);
                  const avgTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-6 py-4">
                        <Link to={`/admin/events/${event.id}`} className="block">
                          <div className="text-sm font-medium hover:text-lime transition-colors">
                            {event.name}
                          </div>
                          {event.description && (
                            <div className="text-sm text-dim line-clamp-1 mt-1">
                              {event.description}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(event.date).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted">
                          <Image className="h-4 w-4 mr-2" />
                          {event.photoCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {totalRevenue > 0
                            ? `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : <span className="text-muted">—</span>}
                        </div>
                        {paidOrdersCount > 0 && (
                          <div className="text-xs text-dim mt-0.5">{paidOrdersCount} pedido{paidOrdersCount !== 1 ? "s" : ""}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {avgTicket > 0
                            ? `R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : <span className="text-muted">—</span>}
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
                  );
                })}
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
