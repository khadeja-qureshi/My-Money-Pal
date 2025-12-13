import axios from "./axiosInstance";

export function getTransactionsAPI() {
  return axios.get("/transactions").then((res) => res.data);
}

export function addTransactionAPI(body) {
  return axios.post("/transactions", body);
}

export function deleteTransactionAPI(id) {
  return axios.delete(`/transactions/${id}`);
}

export function updateTransactionAPI(id, body) {
  return axios.put(`/transactions/${id}`, body).then((res) => res.data);
}