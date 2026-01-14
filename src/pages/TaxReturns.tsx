import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Trash2, Edit } from "lucide-react";
import {
  returns,
  formatCurrency,
  formatDate,
  FILING_STATUSES,
  TAX_YEARS,
  type TaxReturn,
} from "@/lib/tauri";

export default function TaxReturns() {
  const [returnsList, setReturnsList] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaxYear, setNewTaxYear] = useState(2024);
  const [newFilingStatus, setNewFilingStatus] = useState("single");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const list = await returns.list();
      setReturnsList(list);
    } catch (error) {
      console.error("Failed to load returns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await returns.create(newTaxYear, newFilingStatus);
      setShowCreateModal(false);
      loadReturns();
    } catch (error) {
      console.error("Failed to create return:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tax return?")) return;
    try {
      await returns.delete(id);
      loadReturns();
    } catch (error) {
      console.error("Failed to delete return:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed":
        return "badge-success";
      case "in_progress":
        return "badge-primary";
      case "draft":
        return "badge-warning";
      default:
        return "badge-gray";
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Returns</h1>
          <p className="text-gray-500 mt-1">Manage your tax return filings</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          New Return
        </button>
      </div>

      {/* Returns Grid */}
      {returnsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {returnsList.map((ret, index) => (
            <motion.div
              key={ret.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{ret.tax_year} Tax Return</h3>
                    <p className="text-sm text-gray-500">
                      {ret.filing_status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(ret.status)}`}>{ret.status}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Income</span>
                  <span className="font-medium">{formatCurrency(ret.gross_income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deductions</span>
                  <span className="font-medium text-success-600">
                    -{formatCurrency(ret.total_deductions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxable Income</span>
                  <span className="font-medium">{formatCurrency(ret.taxable_income)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-700 font-medium">Total Tax</span>
                  <span className="font-bold text-gray-900">{formatCurrency(ret.total_tax)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">Updated {formatDate(ret.updated_at)}</span>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ret.id)}
                    className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tax returns yet</h3>
          <p className="text-gray-500 mb-6">Create your first tax return to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Create Tax Return
          </button>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Tax Return</h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Tax Year</label>
                  <select
                    value={newTaxYear}
                    onChange={(e) => setNewTaxYear(parseInt(e.target.value))}
                    className="input"
                  >
                    {TAX_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Filing Status</label>
                  <select
                    value={newFilingStatus}
                    onChange={(e) => setNewFilingStatus(e.target.value)}
                    className="input"
                  >
                    {FILING_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="btn btn-primary flex-1"
                  >
                    {isCreating ? <div className="spinner spinner-sm" /> : "Create"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
