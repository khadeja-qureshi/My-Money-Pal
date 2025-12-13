import axios from "./axiosInstance";

export function getBudgetsAPI() {
  return axios.get("/budgets").then((res) => res.data);
}

export function addBudgetAPI(body) {
  return axios.post("/budgets", body).then((res) => res.data);
}

export function updateBudgetAPI(id, body) {
  return axios.put(`/budgets/${id}`, body).then((res) => res.data);
}

export function deleteBudgetAPI(id) {
  return axios.delete(`/budgets/${id}`).then((res) => res.data);
}
