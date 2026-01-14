import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingDown,
  FileText,
  Calculator,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { returns, formatCurrency, formatPercent, type TaxReturn } from "@/lib/tauri";

export default function Dashboard() {
  const [recentReturns, setRecentReturns] = useState<TaxReturn[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalDeductions: 0,
    estimatedTax: 0,
    effectiveRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const returnsList = await returns.list();
      setRecentReturns(returnsList.slice(0, 3));

      // Calculate aggregate stats from returns
      if (returnsList.length > 0) {
        const totalIncome = returnsList.reduce((sum, r) => sum + r.gross_income, 0);
        const totalDeductions = returnsList.reduce((sum, r) => sum + r.total_deductions, 0);
        const totalTax = returnsList.reduce((sum, r) => sum + r.total_tax, 0);
        
        setStats({
          totalIncome,
          totalDeductions,
          estimatedTax: totalTax,
          effectiveRate: totalIncome > 0 ? totalTax / totalIncome : 0,
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Income",
      value: formatCurrency(stats.totalIncome),
      icon: DollarSign,
      color: "text-success-600",
      bgColor: "bg-success-100",
    },
    {
      label: "Total Deductions",
      value: formatCurrency(stats.totalDeductions),
      icon: TrendingDown,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
    },
    {
      label: "Estimated Tax",
      value: formatCurrency(stats.estimatedTax),
      icon: FileText,
      color: "text-warning-600",
      bgColor: "bg-warning-100",
    },
    {
      label: "Effective Rate",
      value: formatPercent(stats.effectiveRate),
      icon: Calculator,
      color: "text-danger-600",
      bgColor: "bg-danger-100",
    },
  ];

  const quickActions = [
    { label: "Calculate Tax", path: "/calculator", description: "Estimate your federal and state taxes" },
    { label: "Add Deduction", path: "/deductions", description: "Track deductible expenses" },
    { label: "Upload Document", path: "/documents", description: "Scan and store tax documents" },
    { label: "Ask AI Assistant", path: "/chat", description: "Get help with tax questions" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your tax information for 2024</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={action.path}
                className="card p-4 flex items-center justify-between group hover:border-primary-200 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Returns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tax Returns</h2>
          <Link to="/returns" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>

        {recentReturns.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Tax Year</th>
                  <th>Filing Status</th>
                  <th>Gross Income</th>
                  <th>Total Tax</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReturns.map((ret) => (
                  <tr key={ret.id}>
                    <td className="font-medium">{ret.tax_year}</td>
                    <td>{ret.filing_status.replace(/_/g, " ")}</td>
                    <td className="tabular-nums">{formatCurrency(ret.gross_income)}</td>
                    <td className="tabular-nums">{formatCurrency(ret.total_tax)}</td>
                    <td>
                      <span
                        className={`badge ${
                          ret.status === "filed"
                            ? "badge-success"
                            : ret.status === "draft"
                            ? "badge-warning"
                            : "badge-gray"
                        }`}
                      >
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tax returns yet</p>
            <Link to="/returns" className="btn btn-primary mt-4">
              Create Your First Return
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
