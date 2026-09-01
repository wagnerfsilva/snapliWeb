import { useState, useEffect } from "react";
import { withdrawalsAPI } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import {
  Wallet,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "#FFC800", bg: "rgba(255,200,0,0.12)", icon: Clock },
  approved: { label: "Aprovado", color: "#38BDF8", bg: "rgba(56,189,248,0.12)", icon: CheckCircle },
  paid: { label: "Pago", color: "#00D4AA", bg: "rgba(0,212,170,0.12)", icon: DollarSign },
  rejected: { label: "Rejeitado", color: "#FF5050", bg: "rgba(255,80,80,0.12)", icon: XCircle },
};

const NEXT_ACTIONS = {
  pending: [
    { status: "approved", label: "Aprovar", className: "btn-primary" },
    { status: "rejected", label: "Rejeitar", className: "bg-red-600 text-white hover:bg-red-700" },
  ],
  approved: [
    { status: "paid", label: "Marcar como Pago", className: "btn-primary" },
    { status: "rejected", label: "Rejeitar", className: "bg-red-600 text-white hover:bg-red-700" },
  ],
};

export default function WithdrawalsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await withdrawalsAPI.getAll(
        statusFilter ? { status: statusFilter } : {}
      );
      if (response.data.success) {
        setRequests(response.data.data.withdrawalRequests);
      }
    } catch (error) {
      toast.error("Erro ao carregar solicitações de resgate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const response = await withdrawalsAPI.updateStatus(id, { status });
      if (response.data.success) {
        toast.success("Solicitação atualizada!");
        loadRequests();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao atualizar solicitação"
      );
    } finally {
      setProcessingId(null);
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
        <h1 className="text-3xl font-bold font-sora">Resgates</h1>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="paid">Pago</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet className="h-16 w-16 text-dim mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhuma solicitação de resgate
          </h2>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const actions = isAdmin ? NEXT_ACTIONS[req.status] || [] : [];

            return (
              <div key={req.id} className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold font-sora">
                        {req.event?.name || "Evento"}
                      </h3>
                      <span
                        className="badge flex items-center gap-1"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    {isAdmin && req.organizer && (
                      <p className="text-sm text-muted">
                        Organizador: {req.organizer.name} ({req.organizer.email})
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    {req.notes && (
                      <p className="text-sm text-muted mt-2">
                        Observação: {req.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-lime">
                      R${" "}
                      {parseFloat(req.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {actions.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {actions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() =>
                              handleUpdateStatus(req.id, action.status)
                            }
                            className={`btn ${action.className} text-sm`}
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              action.label
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
