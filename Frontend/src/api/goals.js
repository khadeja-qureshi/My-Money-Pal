import axios from "./axiosInstance";

export function getGoalsAPI() {
  return axios
    .get("/goals")
    .then((res) => (Array.isArray(res.data) ? res.data : []))
    .catch((error) => {
      console.error(
        "Error fetching goals:",
        error.response?.data || error.message
      );
      return [];
    });
}

export function addGoalAPI(body) {
  return axios.post("/goals", body).then((res) => res.data);
}

export function contributeGoalAPI(goalId, amount) {
  return axios
    .post(`/goals/${goalId}/contribute`, { amount })
    .then((res) => res.data);
}

export function deleteGoalAPI(id) {
  return axios.delete(`/goals/${id}`).then((res) => res.data);
}

export function updateGoalAPI(id, body) {
  return axios.put(`/goals/${id}`, body).then((res) => res.data);
}
