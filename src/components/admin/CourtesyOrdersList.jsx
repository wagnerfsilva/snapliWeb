import { useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { ordersAPI } from "../../lib/api";

const PAGE_SIZE = 20;
const formatDate = value => value ? new Date(value).toLocaleString("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "—";

export default function CourtesyOrdersList() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const busy = loading || deletingId !== null;

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await ordersAPI.getCourtesies({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }, controller.signal);
        if (controller.signal.aborted) return;
        setTotal(response.data.total);
        if (!response.data.orders.length && page > 0) {
          setPage(Math.max(0, Math.ceil(response.data.total / PAGE_SIZE) - 1));
          return;
        }
        setOrders(response.data.orders);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.error || "Não foi possível carregar as cortesias.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, refresh]);

  const copyLink = async order => {
    try {
      await navigator.clipboard.writeText(order.downloadUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Abra o portal e copie o endereço.");
    }
  };

  const remove = async order => {
    if (busy || !window.confirm(
      `Remover a cortesia de "${order.customerName}"? O link deixará de funcionar. As fotos e vídeos originais serão preservados. Esta ação não pode ser desfeita.`
    )) return;
    setDeletingId(order.id);
    try {
      await ordersAPI.deleteCourtesy(order.id);
      toast.success("Cortesia removida e link desativado.");
      setRefresh(value => value + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || "Não foi possível remover a cortesia.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="card p-4" aria-label="Cortesias criadas" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold">Cortesias criadas <span className="text-sm text-muted font-normal">({total})</span></h2>
        <button type="button" className="btn btn-secondary btn-sm flex items-center gap-2" onClick={() => setRefresh(value => value + 1)} disabled={busy}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-muted py-3">Carregando cortesias...</p>
      ) : error ? (
        <div role="alert" className="text-sm py-3">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button>
        </div>
      ) : !orders.length ? (
        <p className="text-sm text-muted py-3">Nenhuma cortesia criada.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th className="px-2 py-2 font-medium">Destinatário</th>
                  <th className="px-2 py-2 font-medium text-center">Arquivos</th>
                  <th className="px-2 py-2 font-medium whitespace-nowrap">Criada em</th>
                  <th className="px-2 py-2 font-medium whitespace-nowrap">Validade</th>
                  <th className="px-2 py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-2 py-2">
                      <p className="font-medium max-w-48 truncate" title={order.customerName}>{order.customerName}</p>
                      <p className="text-xs text-muted font-mono">#{order.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-2 py-2 text-center">{order.itemCount}</td>
                    <td className="px-2 py-2 text-muted whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-2 py-2 text-muted whitespace-nowrap">
                      {formatDate(order.downloadExpiresAt)}
                      {order.downloadExpiresAt && new Date(order.downloadExpiresAt) < new Date() && (
                        <span className="block text-xs text-amber-400">Expirada</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-40" aria-label={`Copiar link de ${order.customerName}`} title="Copiar link" onClick={() => copyLink(order)} disabled={busy || !order.downloadUrl}>
                          <Copy className="h-4 w-4" />
                        </button>
                        {order.downloadUrl && (
                          <a href={order.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10" aria-label={`Abrir portal de ${order.customerName}`} title="Abrir portal">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button type="button" className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-40 flex items-center gap-1" aria-label={`Remover cortesia de ${order.customerName}`} onClick={() => remove(order)} disabled={busy}>
                          {deletingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          <span className="text-xs">Remover</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 text-xs text-muted">
            <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total} cortesias</span>
            {total > PAGE_SIZE && (
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy || page === 0} onClick={() => setPage(value => value - 1)}>Anterior</button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={busy || (page + 1) * PAGE_SIZE >= total} onClick={() => setPage(value => value + 1)}>Próxima</button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
