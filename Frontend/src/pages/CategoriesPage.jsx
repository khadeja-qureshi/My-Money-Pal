import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import {
  getCategoriesAPI,
  addCategoryAPI,
  deleteCategoryAPI,
} from "../api/categories";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState(null);

  const load = async () => {
  try {
    setError(null);
    const cats = await getCategoriesAPI();
    console.log("getCategoriesAPI response:", cats);
    if (Array.isArray(cats)) {
      setCategories(cats);
    } else if (Array.isArray(cats?.categories)) {
      setCategories(cats.categories);
    } else {
      setCategories([]);
      setError("Unexpected categories response from server");
    }
  } catch (err) {
    console.error("Load categories failed:", err);
    setError(
      err.response?.data?.error ||
        "Failed to load categories. Is the backend running and are you logged in?"
    );
    setCategories([]);
  }
};


  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await addCategoryAPI({ name, type });
      setName("");
      setType("expense");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add category");
    }
  };

  const handleDelete = async (id) => {
    await deleteCategoryAPI(id);
    await load();
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Categories</h1>
        <form className="inline-form" onSubmit={handleSubmit}>
          <input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button type="submit">Add</button>
        </form>
        {error && <p className="error-text">{error}</p>}

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.category_id}>
                <td>{c.name}</td>
                <td>{c.type}</td>
                <td>
                  <button
                    className="link-button"
                    onClick={() => handleDelete(c.category_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
