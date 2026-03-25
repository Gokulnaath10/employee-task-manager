import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployees } from "../api/employeeApi";

const blank = { name: "", email: "", role: "", department: "", status: "Active" };

const statusPill = { Active: "pill-green", Inactive: "pill-red", "On Leave": "pill-yellow" };

function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => { load(currentPage); }, [currentPage]);

  async function load(page) {
    try {
      setIsLoading(true);
      // res = { data: [...], pagination: { total, page, totalPages, hasNextPage, hasPrevPage } }
      const res = await getEmployees(page, 5);
      // res is { data, pagination } from new backend — or a plain array from old
      const data = Array.isArray(res) ? res : (res.data ?? []);
      const pag = Array.isArray(res) ? { total: res.length, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } : res.pagination;
      setEmployees(data);
      setPagination(pag);
    } catch {
      setError("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      setIsSubmitting(true);
      if (editId) {
        const updated = await updateEmployee(editId, form);
        setEmployees(list => list.map(emp => emp._id === editId ? updated : emp));
      } else {
        await createEmployee(form);
        // New items land on page 1 (sorted by -createdAt), go there
        if (currentPage === 1) load(1);
        else setCurrentPage(1);
      }
      setForm(blank);
      setEditId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onEdit(emp) {
    setEditId(emp._id);
    setForm({ name: emp.name, email: emp.email, role: emp.role, department: emp.department, status: emp.status });
    setError("");
  }

  async function onDelete(id) {
    setError("");
    try {
      setDeletingId(id);
      await deleteEmployee(id);
      if (editId === id) { setEditId(null); setForm(blank); }
      load(currentPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  }

  function onCancel() { setEditId(null); setForm(blank); setError(""); }

  async function onImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setImportMsg("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importEmployees(data);
      setImportMsg(result.message);
      if (currentPage === 1) load(1);
      else setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid JSON file");
    } finally {
      e.target.value = ""; // reset file input so same file can be re-imported
    }
  }

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Employee Task Manager</span>
      </nav>

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Employees</h1>
            <p>{pagination.total} employee{pagination.total !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {error && <div className="banner banner-error">{error}</div>}
        {importMsg && <div className="banner banner-info">{importMsg}</div>}

        <div style={{ marginBottom: 16 }}>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            Import JSON
            <input type="file" accept=".json" onChange={onImport} style={{ display: "none" }} />
          </label>
        </div>

        <div className="grid">
          {/* Form */}
          <div className="card">
            <h2>{editId ? "Edit Employee" : "Add Employee"}</h2>
            <p>{editId ? "Update the employee details below." : "Fill in the details to add a new employee."}</p>

            <form className="form" onSubmit={onSubmit}>
              {[["name", "Name"], ["email", "Email"], ["role", "Job Role"], ["department", "Department"]].map(([field, label]) => (
                <div className="field" key={field}>
                  <label>{label}</label>
                  <input
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    value={form[field]}
                    onChange={onChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    required
                  />
                </div>
              ))}

              <div className="field">
                <label>Status</label>
                <select name="status" value={form.status} onChange={onChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>On Leave</option>
                </select>
              </div>

              <div className="form-actions">
                <button className="btn btn-blue" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editId ? "Update" : "Add Employee"}
                </button>
                {editId && (
                  <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="card">
            <h2>All Employees</h2>
            <p>Click <strong>View Tasks</strong> to manage tasks for an employee.</p>

            {isLoading ? (
              <div className="banner banner-info">Loading...</div>
            ) : employees.length === 0 ? (
              <div className="empty">No employees yet. Add one using the form.</div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp._id}>
                          <td>
                            <div className="td-name">{emp.name}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>{emp.email}</div>
                          </td>
                          <td>{emp.role}</td>
                          <td>{emp.department}</td>
                          <td>
                            <span className={`pill ${statusPill[emp.status] || "pill-gray"}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            <div className="actions">
                              <button className="btn btn-blue btn-sm" onClick={() => navigate(`/employees/${emp._id}/tasks`, { state: { name: emp.name } })}>
                                View Tasks
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(emp)}>Edit</button>
                              <button className="btn btn-red btn-sm" onClick={() => onDelete(emp._id)} disabled={deletingId === emp._id}>
                                {deletingId === emp._id ? "..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                <div className="pagination">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    ← Prev
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {pagination.totalPages} &nbsp;({pagination.total} total)
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeesPage;
