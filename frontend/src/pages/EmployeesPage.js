import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api/employeeApi";

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

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setIsLoading(true);
      setEmployees(await getEmployees());
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
        const created = await createEmployee(form);
        setEmployees(list => [created, ...list]);
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
      setEmployees(list => list.filter(e => e._id !== id));
      if (editId === id) { setEditId(null); setForm(blank); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  }

  function onCancel() { setEditId(null); setForm(blank); setError(""); }

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Employee Task Manager</span>
      </nav>

      <div className="page">
        <div className="page-header">
          <div>
            <h1>Employees</h1>
            <p>{employees.length} employee{employees.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {error && <div className="banner banner-error">{error}</div>}

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
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeesPage;
