import axios from "./axiosInstance";

export function getProfileAPI() {
  return axios.get("/profile").then((res) => res.data);
}

export function updateProfileAPI(body) {
  return axios.put("/profile", body).then((res) => res.data);
}
