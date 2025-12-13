import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import {
  getTransactionsAPI,
  addTransactionAPI,
  deleteTransactionAPI,
  updateTransactionAPI,
} from "../api/transactions";
import { getCategoriesAPI, addCategoryAPI } from "../api/categories";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    date: "",
    category_id: "",
    note: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  // custom category 
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const loadData = async () => {
    try {
      setError(null);
      const [txs, cats] = await Promise.all([
        getTransactionsAPI(),
        getCategoriesAPI(),
      ]);

      setTransactions(Array.isArray(txs) ? txs : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error("Load transactions/categories failed:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load data. Is the backend running and are you logged in?"
      );
      setTransactions([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      type: "expense",
      amount: "",
      date: "",
      category_id: "",
      note: "",
    });
    setEditingId(null);
    setShowCategoryInput(false);
    setNewCategoryName("");
  };

  const handleChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (e) => {
    const value = e.target.value;
    if (value === "__custom") {
      setShowCategoryInput(true);
    } else {
      setShowCategoryInput(false);
      setNewCategoryName("");
      setForm((prev) => ({ ...prev, category_id: value }));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const data = await addCategoryAPI({
        name: newCategoryName.trim(),
        type: form.type, // income or expense
      });

      const newId = data.category_id;
      await loadData();
      setForm((prev) => ({ ...prev, category_id: String(newId) }));
      setShowCategoryInput(false);
      setNewCategoryName("");
    } catch (err) {
      console.error("Add custom category failed:", err);
      setError(
        err.response?.data?.error || "Failed to add custom category."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        category_id: form.category_id || null,
      };

      if (editingId) {
        await updateTransactionAPI(editingId, payload);
      } else {
        await addTransactionAPI(payload);
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Save transaction failed:", err);
      setError(err.response?.data?.error || "Failed to save transaction");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransactionAPI(id);
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) {
      console.error("Delete transaction failed:", err);
      setError(err.response?.data?.error || "Failed to delete transaction");
    }
  };

  const startEdit = (t) => {
    setEditingId(t.transaction_id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      date: t.date,
      category_id: t.category_id ? String(t.category_id) : "",
      note: t.note || "",
    });
    setShowCategoryInput(false);
    setNewCategoryName("");
  };

  const hasTransactions =
    Array.isArray(transactions) && transactions.length > 0;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Transactions</h1>
              <p className="page-subtitle">
                Quickly record your income & expenses and keep your history
                organised.
              </p>
            </div>
          </div>

         
          <section className="panel">
            <div className="transactions-header">
              <h2 className="section-title">
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </h2>
              {editingId && (
                <span className="badge badge-edit">Editing existing entry</span>
              )}
            </div>

            <form
              className="inline-form transaction-form"
              onSubmit={handleSubmit}
            >
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
                required
              />

              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <select
                name="category_id"
                value={form.category_id || ""}
                onChange={handleCategorySelect}
              >
                <option value="">Uncategorized</option>
                {(Array.isArray(categories) ? categories : []).map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
                <option value="__custom">➕ Add custom category</option>
              </select>

              <input
                name="note"
                placeholder="Note"
                value={form.note}
                onChange={handleChange}
              />

              <button type="submit">
                {editingId ? "Update" : "Add Transaction"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="link-button"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </form>

            {showCategoryInput && (
              <div className="inline-form mt-2">
                <input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button type="button" onClick={handleCreateCategory}>
                  Save category
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setShowCategoryInput(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {error && <p className="error-text mt-2">{error}</p>}
          </section>

          
          <section className="panel">
            <div className="transactions-header">
              <h2 className="section-title">Transaction History</h2>
              {hasTransactions && (
                <p className="history-hint">
                  Use Edit to adjust an entry or Delete to remove it.
                </p>
              )}
            </div>

            {hasTransactions ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Note</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.transaction_id}>
                      <td>{t.date}</td>
                      <td>{t.category_name || "—"}</td>
                      <td>{t.note || "—"}</td>
                      <td>
                        <span
                          className={
                            t.type === "income"
                              ? "txn-tag txn-tag-income"
                              : "txn-tag txn-tag-expense"
                          }
                        >
                          {t.type === "income" ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td
                        className={
                          t.type === "income" ? "text-green" : "text-red"
                        }
                      >
                        {t.type === "income" ? "+" : "-"}{" "}
                        {Number(t.amount).toFixed(2)}
                      </td>
                      <td>
                        <div className="txn-actions">
                          <button
                            className="list-action-btn"
                            type="button"
                            onClick={() => startEdit(t)}
                          >
                            Edit
                          </button>
                          <button
                            className="list-action-btn list-action-btn-danger"
                            type="button"
                            onClick={() => handleDelete(t.transaction_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🧾</span>
                <p className="empty-text">
                  You don’t have any transactions yet. Add your first income or
                  expense above to see it here.
                </p>
              </div>
            )}
          </section>
        </div>

        
        <style>{`
          .page-subtitle {
            margin: 4px 0 0;
            font-size: 0.9rem;
            color: #6b7280;
          }

          .transactions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .history-hint {
            margin: 0;
            font-size: 0.8rem;
            color: #9ca3af;
          }

          .badge {
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .badge-edit {
            background: rgba(129, 140, 248, 0.12);
            color: #4f46e5;
            border: 1px solid rgba(129, 140, 248, 0.5);
          }

          .transaction-form {
            row-gap: 10px;
            column-gap: 10px;
          }

          .txn-tag {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .txn-tag-income {
            background: #ecfdf3;
            color: #15803d;
          }

          .txn-tag-expense {
            background: #fef2f2;
            color: #b91c1c;
          }

          .txn-actions {
            display: flex;
            gap: 6px;
            justify-content: flex-end;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 2rem;
            text-align: center;
            background: #f9fafb;
            border-radius: 12px;
            border: 2px dashed #e5e7eb;
          }

          .empty-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            opacity: 0.6;
          }

          .empty-text {
            color: #6b7280;
            font-size: 0.92rem;
            margin: 0;
            line-height: 1.6;
          }
        `}</style>
      </main>
    </div>
  );
}
