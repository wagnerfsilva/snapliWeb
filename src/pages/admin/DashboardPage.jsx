import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchAPI, eventsAPI } from "../../lib/api";
import {
  Calendar,
  Image,
  Users,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [period, setPeriod] = useState("12");
  const [groupBy, setGroupBy] = useState("month");

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [period, groupBy]);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, eventsResponse] = await Promise.all([
        searchAPI.getStatistics(),
        eventsAPI.getAll({
          page: 1,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (eventsResponse.data.success) {
        setRecentEvents(eventsResponse.data.data.events);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesData = async () => {
    try {
      const response = await searchAPI.getSalesStatistics({
        period,
        groupBy,
      });

      if (response.data.success) {
        setSalesData(response.data.data.sales);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de vendas:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12 text-lime"></div>
      </div>
    );
  }

  // Format period label for chart
  const formatPeriodLabel = (periodStr) => {
    if (!periodStr) return "";

    if (groupBy === "day") {
      const [year, month, day] = periodStr.split("-");
      return `${day}/${month}/${year}`;
    } else if (groupBy === "year") {
      return periodStr;
    } else {
      // month
      const [year, month] = periodStr.split("-");
      const date = new Date(year, month - 1);
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
    }
  };

  // Prepare chart data
  const chartData = salesData.map((sale) => ({
    period: formatPeriodLabel(sale.period),
    Receita: parseFloat(sale.revenue),
  }));

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-sora mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Total de Eventos</p>
              <p className="text-3xl font-bold">
                {stats?.totalEvents || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--lime-dim)' }}>
              <Calendar className="h-8 w-8 text-lime" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Total de Fotos</p>
              <p className="text-3xl font-bold">
                {stats?.totalPhotos || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,212,170,0.12)' }}>
              <Image className="h-8 w-8 text-teal" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Fotos com Faces</p>
              <p className="text-3xl font-bold">
                {stats?.photosWithFaces || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.12)' }}>
              <Users className="h-8 w-8" style={{ color: '#A855F7' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Total de Faces</p>
              <p className="text-3xl font-bold">
                {stats?.totalFaces || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.12)' }}>
              <TrendingUp className="h-8 w-8" style={{ color: '#FB923C' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Fotos Vendidas</p>
              <p className="text-3xl font-bold">
                {stats?.totalPhotosSold || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(56,189,248,0.12)' }}>
              <ShoppingCart className="h-8 w-8" style={{ color: '#38BDF8' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Receita Total</p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,212,170,0.12)' }}>
              <DollarSign className="h-8 w-8 text-teal" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Chart */}
      {chartData.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-sora">
              Receita no Período
            </h2>

            <div className="flex gap-4">
              {/* Period selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod("3")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    period === "3"
                      ? "text-dark"
                      : "text-muted hover:text-white"
                  }`}
                  style={period === "3" ? { background: 'var(--lime)' } : { background: 'var(--bg)' }}
                >
                  3 meses
                </button>
                <button
                  onClick={() => setPeriod("6")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    period === "6"
                      ? "text-dark"
                      : "text-muted hover:text-white"
                  }`}
                  style={period === "6" ? { background: 'var(--lime)' } : { background: 'var(--bg)' }}
                >
                  6 meses
                </button>
                <button
                  onClick={() => setPeriod("12")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    period === "12"
                      ? "text-dark"
                      : "text-muted hover:text-white"
                  }`}
                  style={period === "12" ? { background: 'var(--lime)' } : { background: 'var(--bg)' }}
                >
                  12 meses
                </button>
              </div>

              {/* Group by selector */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="input !w-auto !py-1 !px-3 text-sm"
              >
                <option value="day">Por dia</option>
                <option value="month">Por mês</option>
                <option value="year">Por ano</option>
              </select>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="period" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ background: '#1C1C21', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FAFAFA' }}
                  labelStyle={{ color: "#FAFAFA" }}
                />
                <Legend />
                <Bar dataKey="Receita" fill="#C8FF00" name="Receita (R$)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-sora">Eventos Recentes</h2>
          <Link
            to="/admin/events"
            className="text-lime hover:opacity-70 font-medium transition-opacity"
          >
            Ver todos →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <p className="text-muted text-center py-8">
            Nenhum evento cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                className="block p-4 rounded-xl transition-all hover:ring-1 hover:ring-white/10"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {event.name}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {new Date(event.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-lime">
                      {event.photoCount}
                    </p>
                    <p className="text-xs text-dim">fotos</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
