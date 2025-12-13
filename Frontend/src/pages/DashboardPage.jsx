// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import { getDashboardAPI, getCategorySpendingAPI } from "../api/dashboard";
import { getTransactionsAPI } from "../api/transactions";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#6366F1",
  "#F97316",
  "#22C55E",
  "#EC4899",
  "#0EA5E9",
  "#A855F7",
];

const CHART_COLORS = {
  income: "#22C55E",
  expense: "#EF4444",
};

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(year, parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
  });
  const [categorySpending, setCategorySpending] = useState([]);
  const [incomeExpenseByMonth, setIncomeExpenseByMonth] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setError(null);

      // 1) summary
      const dashboard = await getDashboardAPI();
      setSummary(dashboard);

      // 2) category spending pie data
      const cat = await getCategorySpendingAPI();

      const pieDataRaw = (Array.isArray(cat) ? cat : []).map((c) => ({
        name: c.category,
        value: Number(c.total_spent || 0),
      }));

      //  categories that actually have spending
      const pieData = pieDataRaw.filter((item) => item.value > 0);

      setCategorySpending(pieData);

      // 3) monthly income vs expense from transactions
      const txs = await getTransactionsAPI();
      let txList = [];
      if (Array.isArray(txs)) {
        txList = txs;
      } else if (Array.isArray(txs?.transactions)) {
        txList = txs.transactions;
      }

      const map = {};
      txList.forEach((t) => {
        const key = getMonthKey(t.date);
        if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
        const amt = Number(t.amount);
        if (t.type === "income") map[key].income += amt;
        else map[key].expense += amt;
      });

      const months = Object.values(map).sort((a, b) =>
        a.month.localeCompare(b.month)
      );
      const last6 = months.slice(-6).map((m) => ({
        ...m,
        monthLabel: formatMonthLabel(m.month),
      }));
      setIncomeExpenseByMonth(last6);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load dashboard data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-inner">
            <div className="page-header">
              <h1 className="page-title">Dashboard</h1>
            </div>
            <div className="kpi-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="kpi-card skeleton">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-value"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div className="page-header">
            <h1 className="page-title">Dashboard</h1>
          </div>

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={loadData} className="btn-retry">
                Try Again
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card income-card">
              <div className="kpi-header">
                <span className="kpi-icon">📈</span>
                <h2>Total Income</h2>
              </div>
              <p className="kpi-value">
                PKR{" "}
                {Number(summary.total_income).toLocaleString("en-PK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="kpi-card expense-card">
              <div className="kpi-header">
                <span className="kpi-icon">📉</span>
                <h2>Total Expense</h2>
              </div>
              <p className="kpi-value">
                PKR{" "}
                {Number(summary.total_expenses).toLocaleString("en-PK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="kpi-card balance-card">
              <div className="kpi-header">
                <span className="kpi-icon">💰</span>
                <h2>Balance</h2>
              </div>
              <p className="kpi-value">
                PKR{" "}
                {Number(summary.balance).toLocaleString("en-PK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Category Spending</h3>
              {categorySpending.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p className="empty-text">
                    Add some <strong>expense</strong> transactions with a
                    category to see this chart.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name }) => name}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `PKR ${Number(value).toFixed(2)}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Income vs Expense</h3>
              {incomeExpenseByMonth.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p className="empty-text">
                    Add some income and expense transactions with different
                    dates to see this chart.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={incomeExpenseByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        `PKR ${Number(value).toFixed(2)}`
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill={CHART_COLORS.income}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill={CHART_COLORS.expense}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .error-banner {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border: 1px solid #fca5a5;
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
          }

          .error-banner p {
            color: #991b1b;
            margin: 0;
            font-weight: 500;
          }

          .btn-retry {
            padding: 0.5rem 1rem;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-retry:hover {
            background: #b91c1c;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .kpi-card {
            padding: 1.75rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
            border: 1px solid #f3f4f6;
          }

          .kpi-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          .income-card {
            border-left: 4px solid #22c55e;
            background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
          }

          .expense-card {
            border-left: 4px solid #ef4444;
            background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
          }

          .balance-card {
            border-left: 4px solid #3b82f6;
            background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
          }

          .kpi-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }

          .kpi-icon {
            font-size: 1.5rem;
            line-height: 1;
          }

          .kpi-header h2 {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 600;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .kpi-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #111827;
            margin: 0;
            letter-spacing: -0.5px;
          }

          .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
          }

          .chart-card {
            padding: 1.75rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid #f3f4f6;
          }

          .chart-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #111827;
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #f3f4f6;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 2rem;
            text-align: center;
            background: #f9fafb;
            border-radius: 12px;
            border: 2px dashed #e5e7eb;
          }

          .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          .empty-text {
            color: #6b7280;
            font-size: 0.9375rem;
            margin: 0;
            line-height: 1.6;
          }

          .skeleton {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .skeleton-line {
            height: 16px;
            background: #e5e7eb;
            border-radius: 4px;
            width: 60%;
            margin-bottom: 1rem;
          }

          .skeleton-value {
            height: 32px;
            background: #d1d5db;
            border-radius: 6px;
            width: 80%;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          @media (max-width: 768px) {
            .kpi-grid {
              grid-template-columns: 1fr;
            }

            .charts-grid {
              grid-template-columns: 1fr;
            }

            .kpi-value {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
