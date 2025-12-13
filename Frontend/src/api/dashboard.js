// src/api/dashboard.js
import axios from "./axiosInstance";

export function getDashboardAPI() {
  return axios.get("/dashboard").then((res) => res.data);
}


export function getIncomeExpenseAPI() {
  return axios.get("/charts/income-expense").then((res) => res.data);
}

export function getCategorySpendingAPI() {
  return axios.get("/charts/category-spending").then((res) => res.data);
}
