// src/api/auth.js
import axios from "./axiosInstance";

export function signupAPI(payload) {
  return axios.post("/signup", payload).then((res) => res.data);
}

export function loginAPI(email, password) {
  return axios.post("/login", { email, password }).then((res) => res.data);
}


export function forgotPasswordAPI(email, security_answer) {
  return axios
    .post("/forgot-password", { email, security_answer })
    .then((res) => res.data);
}

export function resetPasswordAPI(payload) {
  return axios.post("/reset-password", payload).then((res) => res.data);
}
