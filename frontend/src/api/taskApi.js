import apiClient from "./apiClient";

export const getTasks = (employeeId, page = 1, limit = 5, status = "") => {
  const params = { page, limit };
  if (status && status !== "All") params.status = status;
  return apiClient.get(`/employees/${employeeId}/tasks`, { params }).then(r => r.data);
};
export const createTask = (employeeId, data) => apiClient.post(`/employees/${employeeId}/tasks`, data).then(r => r.data);
export const updateTask = (employeeId, id, data) => apiClient.put(`/employees/${employeeId}/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (employeeId, id) => apiClient.delete(`/employees/${employeeId}/tasks/${id}`).then(r => r.data);
