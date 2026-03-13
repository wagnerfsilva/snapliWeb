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
        <div className="spinner w-12 h-12 text-primary-600"></div>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Eventos</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalEvents || 0}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Fotos</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalPhotos || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Image className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fotos com Faces</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.photosWithFaces || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Faces</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalFaces || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fotos Vendidas</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.totalPhotosSold || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receita Total</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Chart */}
      {chartData.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Receita no Período
            </h2>

            <div className="flex gap-4">
              {/* Period selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod("3")}
                  className={`px-3 py-1 rounded text-sm ${
                    period === "3"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  3 meses
                </button>
                <button
                  onClick={() => setPeriod("6")}
                  className={`px-3 py-1 rounded text-sm ${
                    period === "6"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  6 meses
                </button>
                <button
                  onClick={() => setPeriod("12")}
                  className={`px-3 py-1 rounded text-sm ${
                    period === "12"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  12 meses
                </button>
              </div>

              {/* Group by selector */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="Receita" fill="#10b981" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Eventos Recentes</h2>
          <Link
            to="/admin/events"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum evento cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(event.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {event.photoCount}
                    </p>
                    <p className="text-xs text-gray-500">fotos</p>
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
