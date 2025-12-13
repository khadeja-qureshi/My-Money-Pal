// src/api/categories.js
import axios from "./axiosInstance";


export function getCategoriesAPI() {
  return axios.get("/categories").then((res) => res.data);
}


export function addCategoryAPI(body) {
  return axios.post("/categories", body).then((res) => res.data);
}


export function deleteCategoryAPI(id) {
  return axios.delete(`/categories/${id}`).then((res) => res.data);
}


export function updateCategoryAPI(id, body) {
  return axios.put(`/categories/${id}`, body).then((res) => res.data);
}
