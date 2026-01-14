import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt, Trash2, DollarSign } from "lucide-react";
import { deductions, formatCurrency, formatDate, type Deduction } from "@/lib/tauri";

export default function Deductions() {
  const [deductionsList, setDeductionsList] = useState<Deduction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    isItemized: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [list, cats] = await Promise.all([
        deductions.getAll(),
        deductions.getCategories(),
      ]);
      setDeductionsList(list);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load deductions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.category || !formData.description || !formData.amount) return;

    setIsSubmitting(true);
    try {
      await deductions.add(
        formData.category,
        formData.description,
        parseFloat(formData.amount),
        formData.isItemized
      );
      setShowAddModal(false);
      setFormData({ category: "", description: "", amount: "", isItemized: true });
      loadData();
    } catch (error) {
      console.error("Failed to add deduction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deduction?")) return;
    try {
      await deductions.delete(id);
      loadData();
    } catch (error) {
      console.error("Failed to delete deduction:", error);
    }
  };

  const filteredDeductions =
    filter === "all"
      ? deductionsList
      : deductionsList.filter((d) => d.category === filter);

  const totalDeductions = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medical: "bg-red-100 text-red-700",
      charitable: "bg-purple-100 text-purple-700",
      mortgage_interest: "bg-blue-100 text-blue-700",
      state_local_taxes: "bg-green-100 text-green-700",
      business: "bg-orange-100 text-orange-700",
      education: "bg-cyan-100 text-cyan-700",
      home_office: "bg-yellow-100 text-yellow-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
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
          <h1 className="text-2xl font-bold text-gray-900">Deductions</h1>
          <p className="text-gray-500 mt-1">Track and manage tax-deductible expenses</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Add Deduction
        </button>
      </div>

      {/* Summary Card */}
      <div className="card p-6 bg-gradient-to-br from-success-600 to-success-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total Deductions</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalDeductions)}</p>
            <p className="text-sm opacity-75 mt-2">
              {filteredDeductions.length} deduction{filteredDeductions.length !== 1 ? "s" : ""}
              {filter !== "all" ? ` in ${filter.replace(/_/g, " ")}` : ""}
            </p>
          </div>
          <Receipt className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn btn-sm ${filter === cat ? "btn-primary" : "btn-secondary"}`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Deductions List */}
      {filteredDeductions.length > 0 ? (
        <div className="space-y-3">
          {filteredDeductions.map((ded, index) => (
            <motion.div
              key={ded.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ded.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${getCategoryColor(ded.category)}`}>
                      {ded.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(ded.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-success-600">
                  {formatCurrency(ded.amount)}
                </span>
                <button
                  onClick={() => handleDelete(ded.id)}
                  className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deductions yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your tax-deductible expenses</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Add Your First Deduction
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add Deduction</h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Doctor visit co-pay"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isItemized}
                    onChange={(e) => setFormData({ ...formData, isItemized: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Itemized deduction</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={isSubmitting || !formData.category || !formData.description || !formData.amount}
                    className="btn btn-primary flex-1"
                  >
                    {isSubmitting ? <div className="spinner spinner-sm" /> : "Add"}
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
