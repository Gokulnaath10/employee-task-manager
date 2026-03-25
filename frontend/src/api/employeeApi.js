import apiClient from "./apiClient";

export const getEmployees = (page = 1, limit = 5) => apiClient.get("/employees", { params: { page, limit } }).then(r => r.data);
export const createEmployee = (data) => apiClient.post("/employees", data).then(r => r.data);
export const updateEmployee = (id, data) => apiClient.put(`/employees/${id}`, data).then(r => r.data);
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`).then(r => r.data);
export const importEmployees = (data) => apiClient.post("/employees/import", data).then(r => r.data);
