import { useState, useEffect } from "react";
import { ordersAPI } from "../../lib/api";
import toast from "react-hot-toast";
import {
  RefreshCw,
  ExternalLink,
  Copy,
  Loader2,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const STATUS_CONFIG = {
  paid: { label: "Pago", color: "#00D4AA", bg: "rgba(0,212,170,0.12)", icon: CheckCircle },
  completed: { label: "Completo", color: "#00D4AA", bg: "rgba(0,212,170,0.12)", icon: CheckCircle },
  pending: { label: "Pendente", color: "#FFC800", bg: "rgba(255,200,0,0.12)", icon: Clock },
  processing: { label: "Processando", color: "#FFC800", bg: "rgba(255,200,0,0.12)", icon: Clock },
  cancelled: { label: "Cancelado", color: "#FF5050", bg: "rgba(255,80,80,0.12)", icon: XCircle },
  refunded: { label: "Estornado", color: "#FF5050", bg: "rgba(255,80,80,0.12)", icon: XCircle },
};

export default function EventSales({ eventId }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingOrderId, setSyncingOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [eventId]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getByEvent(eventId);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (orderId) => {
    setSyncingOrderId(orderId);
    try {
      const response = await ordersAPI.syncWithAsaas(orderId);
      if (response.data.success) {
        if (response.data.synced) {
          toast.success(`Sincronizado! ${response.data.changes.join(", ")}`);
          loadOrders();
        } else {
          toast.success(`Asaas: ${response.data.asaasStatus} — Sem alterações`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao sincronizar");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const copyDownloadLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const paidOrders = orders.filter(o => ["paid", "completed"].includes(o.status));
  const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const totalPhotos = paidOrders.reduce((sum, o) => sum + o.photoCount, 0);

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-lime" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold font-sora">Vendas</h2>
        <button
          onClick={loadOrders}
          className="btn btn-secondary flex items-center space-x-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl" style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.15)" }}>
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-5 w-5 text-lime" />
            <div>
              <p className="text-xs text-muted">Compradores</p>
              <p className="text-xl font-bold">{paidOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)" }}>
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-teal" />
            <div>
              <p className="text-xs text-muted">Receita</p>
              <p className="text-xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5" style={{ color: "#A855F7" }} />
            <div>
              <p className="text-xs text-muted">Fotos Vendidas</p>
              <p className="text-xl font-bold">{totalPhotos}</p>
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma venda registrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 text-muted font-medium">Cliente</th>
                <th className="text-left py-3 px-2 text-muted font-medium">Email</th>
                <th className="text-center py-3 px-2 text-muted font-medium">Fotos</th>
                <th className="text-right py-3 px-2 text-muted font-medium">Valor</th>
                <th className="text-center py-3 px-2 text-muted font-medium">Status</th>
                <th className="text-center py-3 px-2 text-muted font-medium">Data</th>
                <th className="text-center py-3 px-2 text-muted font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                const isPending = order.status === "pending" || order.status === "processing";

                return (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-2 font-medium">{order.customerName}</td>
                    <td className="py-3 px-2 text-muted">{order.customerEmail}</td>
                    <td className="py-3 px-2 text-center">{order.photoCount}</td>
                    <td className="py-3 px-2 text-right font-mono">
                      R$ {parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: config.bg, color: config.color }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{config.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-muted">
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleDateString("pt-BR")
                        : new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Sync with Asaas */}
                        {isPending && order.paymentId && (
                          <button
                            onClick={() => handleSync(order.id)}
                            disabled={syncingOrderId === order.id}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Sincronizar com Asaas"
                          >
                            {syncingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-lime" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-lime" />
                            )}
                          </button>
                        )}

                        {/* Copy download link */}
                        {order.downloadUrl && (
                          <button
                            onClick={() => copyDownloadLink(order.downloadUrl)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Copiar link de download"
                          >
                            <Copy className="h-4 w-4 text-muted hover:text-white" />
                          </button>
                        )}

                        {/* Open download link */}
                        {order.downloadUrl && (
                          <a
                            href={order.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Abrir link de download"
                          >
                            <ExternalLink className="h-4 w-4 text-muted hover:text-white" />
                          </a>
                        )}

                        {/* Pending without payment */}
                        {isPending && !order.paymentId && (
                          <span className="text-xs text-muted">Sem pagamento</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
