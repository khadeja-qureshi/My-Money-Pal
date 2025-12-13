// src/pages/BudgetAndGoalsPage.jsx
import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import { getCategoriesAPI, addCategoryAPI } from "../api/categories";
import {
  getBudgetsAPI,
  addBudgetAPI,
  updateBudgetAPI,
  deleteBudgetAPI,
} from "../api/budgets";
import {
  getGoalsAPI,
  addGoalAPI,
  contributeGoalAPI,
  deleteGoalAPI,
  updateGoalAPI,
} from "../api/goals";

export default function BudgetAndGoalsPage() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [budgetForm, setBudgetForm] = useState({
    category_id: "",
    amount_limit: "",
  });

  const [goalForm, setGoalForm] = useState({
    goal_name: "",
    target_amount: "",
    category_id: "",
    deadline: "",
    notify_enabled: false, 
  });

  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [error, setError] = useState(null);

  // custom category for Budget
  const [showBudgetCategoryInput, setShowBudgetCategoryInput] = useState(false);
  const [newBudgetCategoryName, setNewBudgetCategoryName] = useState("");

  // custom category for Goals
  const [showGoalCategoryInput, setShowGoalCategoryInput] = useState(false);
  const [newGoalCategoryName, setNewGoalCategoryName] = useState("");

  const [showEditGoalCategoryInput, setShowEditGoalCategoryInput] =
    useState(false);
  const [newEditGoalCategoryName, setNewEditGoalCategoryName] = useState("");

  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoalForm, setEditGoalForm] = useState({
    goal_name: "",
    target_amount: "",
    category_id: "",
    deadline: "",
    notify_enabled: false, 
  });

  const loadAll = async () => {
    try {
      setError(null);
      const [cats, bds, gls] = await Promise.all([
        getCategoriesAPI(),
        getBudgetsAPI(),
        getGoalsAPI(),
      ]);

      setCategories(Array.isArray(cats) ? cats : []);
      setBudgets(Array.isArray(bds) ? bds : []);
      setGoals(Array.isArray(gls) ? gls : []);
    } catch (err) {
      console.error("loadAll failed:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to load budgets/goals. Is the backend running and are you logged in?"
      );
      setCategories([]);
      setBudgets([]);
      setGoals([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleBudgetChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setBudgetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setGoalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditGoalChange = (e) => {
    setError(null);
    const { name, value } = e.target;
    setEditGoalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBudgetCategorySelect = (e) => {
    const value = e.target.value;
    if (value === "__custom") {
      setShowBudgetCategoryInput(true);
    } else {
      setShowBudgetCategoryInput(false);
      setNewBudgetCategoryName("");
      handleBudgetChange(e);
    }
  };

  const handleGoalCategorySelect = (e) => {
    const value = e.target.value;
    if (value === "__custom") {
      setShowGoalCategoryInput(true);
    } else {
      setShowGoalCategoryInput(false);
      setNewGoalCategoryName("");
      handleGoalChange(e);
    }
  };

  const handleEditGoalCategorySelect = (e) => {
    const value = e.target.value;
    if (value === "__custom") {
      setShowEditGoalCategoryInput(true);
    } else {
      setShowEditGoalCategoryInput(false);
      setNewEditGoalCategoryName("");
      handleEditGoalChange(e);
    }
  };

  const createBudgetCategory = async () => {
    if (!newBudgetCategoryName.trim()) return;
    try {
      const data = await addCategoryAPI({
        name: newBudgetCategoryName.trim(),
        type: "expense",
      });
      const newId = data?.category_id;
      await loadAll();
      if (newId) {
        setBudgetForm((prev) => ({ ...prev, category_id: String(newId) }));
      }
      setNewBudgetCategoryName("");
      setShowBudgetCategoryInput(false);
    } catch (err) {
      console.error("add custom budget category failed:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to add custom category for budget."
      );
    }
  };

  const createGoalCategory = async () => {
    if (!newGoalCategoryName.trim()) return;
    try {
      const data = await addCategoryAPI({
        name: newGoalCategoryName.trim(),
        type: "expense",
      });
      const newId = data?.category_id;
      await loadAll();
      if (newId) {
        setGoalForm((prev) => ({ ...prev, category_id: String(newId) }));
      }
      setNewGoalCategoryName("");
      setShowGoalCategoryInput(false);
    } catch (err) {
      console.error("add custom goal category failed:", err);
      setError(
        err?.response?.data?.error || "Failed to add custom category for goal."
      );
    }
  };

  const createEditGoalCategory = async () => {
    if (!newEditGoalCategoryName.trim()) return;
    try {
      const data = await addCategoryAPI({
        name: newEditGoalCategoryName.trim(),
        type: "expense",
      });
      const newId = data?.category_id;
      await loadAll();
      if (newId) {
        setEditGoalForm((prev) => ({ ...prev, category_id: String(newId) }));
      }
      setNewEditGoalCategoryName("");
      setShowEditGoalCategoryInput(false);
    } catch (err) {
      console.error("add custom edit-goal category failed:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to add custom category for goal (edit)."
      );
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudgetId) {
        await updateBudgetAPI(editingBudgetId, {
          category_id: budgetForm.category_id || null,
          amount_limit: Number(budgetForm.amount_limit),
        });
      } else {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await addBudgetAPI({
          category_id: budgetForm.category_id || null,
          amount_limit: Number(budgetForm.amount_limit),
          month,
          year,
        });
      }

      setBudgetForm({ category_id: "", amount_limit: "" });
      setEditingBudgetId(null);
      await loadAll();
    } catch (err) {
      console.error("save budget failed:", err);
      setError(err?.response?.data?.error || "Failed to save budget");
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      await addGoalAPI({
        goal_name: goalForm.goal_name,
        target_amount: Number(goalForm.target_amount),
        category_id: goalForm.category_id
          ? Number(goalForm.category_id)
          : null,
        deadline: goalForm.deadline, 
        notify_enabled: goalForm.notify_enabled, 
      });

      setGoalForm({
        goal_name: "",
        target_amount: "",
        category_id: "",
        deadline: "",
        notify_enabled: false,
      });
      await loadAll();
    } catch (err) {
      console.error("addGoal failed:", err);
      setError(err?.response?.data?.error || "Failed to add goal");
    }
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    if (!contributeGoalId) return;

    const goal = goals.find((g) => g.goal_id === contributeGoalId);
    if (!goal) return;

    const amountNum = Number(contributeAmount);
    const currentSaved = Number(goal.current_saved);
    const targetAmount = Number(goal.target_amount);

    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    if (currentSaved >= targetAmount) {
      alert("This goal is already fully funded.");
      return;
    }

    const remaining = targetAmount - currentSaved;
    if (amountNum > remaining) {
      alert(
        `Amount exceeds remaining goal by ${(amountNum - remaining).toFixed(
          2
        )}. Max allowed: ${remaining.toFixed(2)}`
      );
      return;
    }

    if (goal.deadline) {
      const today = new Date();
      const deadlineDate = new Date(goal.deadline);
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffMs = deadlineDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        alert(`Heads up: this goal's deadline is in ${diffDays} day(s).`);
      } else if (diffDays < 0) {
        alert("Note: this goal's deadline has already passed.");
      }
    }

    try {
      await contributeGoalAPI(contributeGoalId, amountNum);
      setContributeAmount("");
      setContributeGoalId(null);
      await loadAll();
      alert("Contribution saved!");
    } catch (err) {
      console.error("contributeGoal failed:", err);
      const msg =
        err?.response?.data?.error ||
        "Something went wrong while saving your contribution.";
      setError(msg);
      alert(msg);
    }
  };

  const startEditBudget = (b) => {
    setEditingBudgetId(b.budget_id);
    setBudgetForm({
      category_id: b.category_id ? String(b.category_id) : "",
      amount_limit: String(b.amount_limit),
    });
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await deleteBudgetAPI(budgetId);

      if (editingBudgetId === budgetId) {
        setEditingBudgetId(null);
        setBudgetForm({ category_id: "", amount_limit: "" });
      }

      await loadAll();
    } catch (err) {
      console.error("delete budget failed:", err);
      setError(err?.response?.data?.error || "Failed to delete budget");
    }
  };

  const startEditGoal = (g) => {
    setEditGoalId(g.goal_id);
    setEditGoalForm({
      goal_name: g.goal_name || "",
      target_amount: g.target_amount || "",
      category_id: g.category_id ? String(g.category_id) : "",
      deadline: g.deadline ? g.deadline.split("T")[0] : "",
      notify_enabled: Boolean(g.notify_enabled), 
    });
    setShowEditGoalCategoryInput(false);
    setNewEditGoalCategoryName("");
  };

  const submitEditGoal = async (e) => {
    e.preventDefault();
    try {
      await updateGoalAPI(editGoalId, {
        goal_name: editGoalForm.goal_name,
        target_amount: Number(editGoalForm.target_amount),
        category_id: editGoalForm.category_id
          ? Number(editGoalForm.category_id)
          : null,
        deadline: editGoalForm.deadline || null,
        notify_enabled: editGoalForm.notify_enabled, 
      });
      setEditGoalId(null);
      setEditGoalForm({
        goal_name: "",
        target_amount: "",
        category_id: "",
        deadline: "",
        notify_enabled: false,
      });
      await loadAll();
    } catch (err) {
      console.error("updateGoal failed:", err);
      setError(err?.response?.data?.error || "Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoalAPI(goalId);
      await loadAll();
    } catch (err) {
      console.error("deleteGoal failed:", err);
      setError(err?.response?.data?.error || "Failed to delete goal");
    }
  };

  const getStatusDisplay = (status) => {
    switch ((status || "").toLowerCase()) {
      case "completed":
        return { className: "status-badge completed", label: "✅ Completed" };
      case "in progress":
        return {
          className: "status-badge in-progress",
          label: "⏳ In Progress",
        };
      case "pending":
        return { className: "status-badge pending", label: "⏳ Pending" };
      default:
        return { className: "status-badge pending", label: "⏳ Pending" };
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <h1 className="page-title">Budgets & Savings Goals</h1>
          {error && <p className="error-text">{error}</p>}

          <div className="two-column">
            <section className="panel">
              <h2 className="section-title">Monthly Budgets</h2>

              {editingBudgetId && (
                <p className="hint-text">
                  You&apos;re editing an existing budget. Update the limit or
                  category and click <strong>Update Budget</strong>.
                </p>
              )}

              <form className="stack-form" onSubmit={handleBudgetSubmit}>
                <label>
                  Category
                  <select
                    name="category_id"
                    value={budgetForm.category_id}
                    onChange={handleBudgetCategorySelect}
                  >
                    <option value="">Select category</option>
                    {(Array.isArray(categories) ? categories : []).map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom">➕ Add custom category</option>
                  </select>
                </label>

                {showBudgetCategoryInput && (
                  <div className="inline-form mt-2">
                    <input
                      placeholder="New category name"
                      value={newBudgetCategoryName}
                      onChange={(e) =>
                        setNewBudgetCategoryName(e.target.value)
                      }
                    />
                    <button type="button" onClick={createBudgetCategory}>
                      Save category
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setShowBudgetCategoryInput(false);
                        setNewBudgetCategoryName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <label>
                  Limit
                  <input
                    name="amount_limit"
                    type="number"
                    step="0.01"
                    value={budgetForm.amount_limit}
                    onChange={handleBudgetChange}
                    required
                  />
                </label>

                <button type="submit">
                  {editingBudgetId ? "Update Budget" : "Add Budget"}
                </button>

                {editingBudgetId && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setEditingBudgetId(null);
                      setBudgetForm({ category_id: "", amount_limit: "" });
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </form>

              
              <ul className="list budget-list">
                {(Array.isArray(budgets) ? budgets : []).map((b) => {
                  const limit = Number(b.amount_limit || 0);
                  const spent = Number(b.spent_total ?? 0); 
                  const pct =
                    limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

                  let statusClass = "budget-status-badge budget-status-ok";
                  let statusLabel = "On track";

                  if (limit > 0) {
                    if (spent >= limit) {
                      statusClass =
                        "budget-status-badge budget-status-danger";
                      statusLabel = "Over budget";
                    } else if (spent >= 0.8 * limit) {
                      statusClass =
                        "budget-status-badge budget-status-warning";
                      statusLabel = "Near limit";
                    }
                  }

                  const monthStr = String(b.month).padStart(2, "0");

                  return (
                    <li key={b.budget_id} className="budget-list-item">
                      <div className="budget-row">
                        <div className="budget-row-top">
                          <div className="budget-list-main">
                            <span className="budget-category">
                              {b.category_name || "All"}
                            </span>
                            <span className="budget-meta">
                              {monthStr}/{b.year}
                            </span>
                          </div>

                          <div className="budget-actions">
                            <button
                              type="button"
                              className="list-action-btn"
                              onClick={() => startEditBudget(b)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="list-action-btn list-action-btn-danger"
                              onClick={() => handleDeleteBudget(b.budget_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="budget-row-middle">
                          <div className="budget-progress-bar">
                            <div
                              className="budget-progress-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="budget-progress-meta">
                            <span>
                              Spent {spent.toFixed(2)} / {limit.toFixed(2)}
                            </span>
                            <span className={statusClass}>{statusLabel}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {(!Array.isArray(budgets) || budgets.length === 0) && (
                  <li>No budgets yet.</li>
                )}
              </ul>
            </section>

          
            <section className="panel">
              <h2 className="section-title">Savings Goals</h2>

              <form className="stack-form" onSubmit={handleGoalSubmit}>
                <label>
                  Goal Name
                  <input
                    name="goal_name"
                    value={goalForm.goal_name}
                    onChange={handleGoalChange}
                    required
                  />
                </label>
                <label>
                  Target Amount
                  <input
                    name="target_amount"
                    type="number"
                    step="0.01"
                    value={goalForm.target_amount}
                    onChange={handleGoalChange}
                    required
                  />
                </label>

                <label>
                  Deadline{" "}
                  <span style={{ color: "#666", fontSize: "0.9em" }}>
                    (required)
                  </span>
                  <input
                    name="deadline"
                    type="date"
                    value={goalForm.deadline}
                    onChange={handleGoalChange}
                    required
                  />
                </label>

                <label>
                  Category (optional)
                  <select
                    name="category_id"
                    value={goalForm.category_id}
                    onChange={handleGoalCategorySelect}
                  >
                    <option value="">None</option>
                    {(Array.isArray(categories) ? categories : []).map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom">➕ Add custom category</option>
                  </select>
                </label>

                {showGoalCategoryInput && (
                  <div className="inline-form mt-2">
                    <input
                      placeholder="New category name"
                      value={newGoalCategoryName}
                      onChange={(e) =>
                        setNewGoalCategoryName(e.target.value)
                      }
                    />
                    <button type="button" onClick={createGoalCategory}>
                      Save category
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setShowGoalCategoryInput(false);
                        setNewGoalCategoryName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                
                <label
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={goalForm.notify_enabled}
                    onChange={(e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        notify_enabled: e.target.checked,
                      }))
                    }
                  />
                  <span>Email reminder before deadline</span>
                </label>

                <button type="submit">Add Goal</button>
              </form>

              <div className="goals-list">
                {(Array.isArray(goals) ? goals : []).map((g) => {
                  const statusDisplay = getStatusDisplay(g.status);

                  const today = new Date();
                  let deadlineStyle = { margin: "0.5rem 0" };

                  if (g.deadline) {
                    const deadlineDate = new Date(g.deadline);
                    today.setHours(0, 0, 0, 0);
                    deadlineDate.setHours(0, 0, 0, 0);
                    const diffMs = deadlineDate - today;
                    const diffDays = Math.round(
                      diffMs / (1000 * 60 * 60 * 24)
                    );

                    if (diffDays <= 1 && diffDays >= 0) {
                      deadlineStyle = {
                        color: "#b71c1c",
                        fontWeight: "600",
                        margin: "0.5rem 0",
                      };
                    }
                  }

                  const progressNum = Number(g.progress ?? 0);

                  return (
                    <div key={g.goal_id} className="goal-card">
                      <div className="goal-header">
                        <h3>{g.goal_name}</h3>
                        <span className={statusDisplay.className}>
                          {statusDisplay.label}
                        </span>
                        <div className="goal-actions">
                          <button
                            className="list-action-btn"
                            type="button"
                            onClick={() => startEditGoal(g)}
                          >
                            Edit
                          </button>
                          <button
                            className="list-action-btn list-action-btn-danger"
                            type="button"
                            onClick={() => handleDeleteGoal(g.goal_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p>
                        {Number(g.current_saved).toFixed(2)} /{" "}
                        {Number(g.target_amount).toFixed(2)}{" "}
                        {Number(g.current_saved) >=
                          Number(g.target_amount) && "(goal reached)"}
                      </p>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progressNum}%` }}
                        />
                      </div>
                      <p className="progress-text">
                        {progressNum.toFixed(2)}% complete ·{" "}
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                          }}
                        >
                          Email reminders:{" "}
                          {g.notify_enabled ? "ON" : "OFF"}
                        </span>
                      </p>

                      <p style={deadlineStyle}>
                        Deadline:{" "}
                        {g.deadline ? g.deadline.split("T")[0] : "None"}
                      </p>

                      <div className="goal-footer">
                      <button
                       type="button"
                        className="goal-addfunds-btn"
                        onClick={() => setContributeGoalId(g.goal_id)}
                        disabled={g.status === "Completed"}
                      >
                       Add Funds
                      </button>
                       </div>


                      {contributeGoalId === g.goal_id && (
                        <form
                          className="inline-form mt-2"
                          onSubmit={handleContributeSubmit}
                        >
                          <input
                            type="number"
                            step="0.01"
                            value={contributeAmount}
                            onChange={(e) =>
                              setContributeAmount(e.target.value)
                            }
                            required
                            placeholder="Amount"
                          />
                          <button type="submit">Save</button>
                        </form>
                      )}
                    </div>
                  );
                })}
                {(!Array.isArray(goals) || goals.length === 0) && (
                  <p>No goals yet.</p>
                )}
              </div>
            </section>
          </div>

          
          {editGoalId && (
            <section className="panel mt-4">
              <h2>Edit Goal</h2>
              <form className="stack-form" onSubmit={submitEditGoal}>
                <label>
                  Goal Name
                  <input
                    name="goal_name"
                    value={editGoalForm.goal_name}
                    onChange={handleEditGoalChange}
                    required
                  />
                </label>

                <label>
                  Target Amount
                  <input
                    name="target_amount"
                    type="number"
                    step="0.01"
                    value={editGoalForm.target_amount}
                    onChange={handleEditGoalChange}
                    required
                  />
                </label>

                <label>
                  Deadline{" "}
                  <span style={{ color: "#666", fontSize: "0.9em" }}>
                    (required)
                  </span>
                  <input
                    name="deadline"
                    type="date"
                    value={editGoalForm.deadline}
                    onChange={handleEditGoalChange}
                    required
                  />
                </label>

                <label>
                  Category (optional)
                  <select
                    name="category_id"
                    value={editGoalForm.category_id}
                    onChange={handleEditGoalCategorySelect}
                  >
                    <option value="">None</option>
                    {(Array.isArray(categories) ? categories : []).map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom">➕ Add custom category</option>
                  </select>
                </label>

                {showEditGoalCategoryInput && (
                  <div className="inline-form mt-2">
                    <input
                      placeholder="New category name"
                      value={newEditGoalCategoryName}
                      onChange={(e) =>
                        setNewEditGoalCategoryName(e.target.value)
                      }
                    />
                    <button type="button" onClick={createEditGoalCategory}>
                      Save category
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setShowEditGoalCategoryInput(false);
                        setNewEditGoalCategoryName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                
                <label
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editGoalForm.notify_enabled}
                    onChange={(e) =>
                      setEditGoalForm((prev) => ({
                        ...prev,
                        notify_enabled: e.target.checked,
                      }))
                    }
                  />
                  <span>Email reminder before deadline</span>
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit">Update Goal</button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setEditGoalId(null);
                      setEditGoalForm({
                        goal_name: "",
                        target_amount: "",
                        category_id: "",
                        deadline: "",
                        notify_enabled: false,
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
