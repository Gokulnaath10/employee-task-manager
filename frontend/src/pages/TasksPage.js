import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getTasks, createTask, updateTask, deleteTask } from "../api/taskApi";

const blank = { title: "", description: "", status: "Pending", priority: "Medium" };

const priorityPill = { Low: "pill-blue", Medium: "pill-orange", High: "pill-red" };
const statusPill = { Pending: "pill-yellow", Completed: "pill-green" };

function TasksPage() {
  const { employeeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const employeeName = location.state?.name || "Employee";

  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { load(); }, [employeeId]);

  async function load() {
    try {
      setIsLoading(true);
      setTasks(await getTasks(employeeId));
    } catch {
      setError("Failed to load tasks");
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
        const updated = await updateTask(employeeId, editId, form);
        setTasks(list => list.map(t => t._id === editId ? updated : t));
      } else {
        const created = await createTask(employeeId, form);
        setTasks(list => [created, ...list]);
      }
      setForm(blank);
      setEditId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onEdit(task) {
    setEditId(task._id);
    setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority });
    setError("");
  }

  async function onDelete(id) {
    setError("");
    try {
      setDeletingId(id);
      await deleteTask(employeeId, id);
      setTasks(list => list.filter(t => t._id !== id));
      if (editId === id) { setEditId(null); setForm(blank); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  }

  function onCancel() { setEditId(null); setForm(blank); setError(""); }

  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  const pending = tasks.filter(t => t.status === "Pending").length;
  const completed = tasks.filter(t => t.status === "Completed").length;

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Employee Task Manager</span>
        <span className="nav-sep">/</span>
        <span className="nav-title">{employeeName}</span>
      </nav>

      <div className="page">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Employees
        </button>

        <div className="page-header">
          <div>
            <h1>{employeeName}'s Tasks</h1>
            <p>{pending} pending · {completed} completed</p>
          </div>
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <div className="grid">
          {/* Form */}
          <div className="card">
            <h2>{editId ? "Edit Task" : "Add Task"}</h2>
            <p>{editId ? "Update the task details below." : "Add a new task for this employee."}</p>

            <form className="form" onSubmit={onSubmit}>
              <div className="field">
                <label>Title</label>
                <input name="title" value={form.title} onChange={onChange} placeholder="Enter task title" required />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={onChange} placeholder="Optional description" rows={3} />
              </div>

              <div className="field">
                <label>Status</label>
                <select name="status" value={form.status} onChange={onChange}>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="field">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={onChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div className="form-actions">
                <button className="btn btn-blue" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editId ? "Update" : "Add Task"}
                </button>
                {editId && (
                  <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="card">
            <h2>Task List</h2>
            <p>Manage all tasks assigned to {employeeName}.</p>

            <div className="filters">
              {["All", "Pending", "Completed"].map(s => (
                <button key={s} className={`filter-btn${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
                  {s}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="banner banner-info">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="empty">
                {filter === "All" ? "No tasks yet. Add one using the form." : `No ${filter.toLowerCase()} tasks.`}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(task => (
                      <tr key={task._id}>
                        <td>
                          <div className="td-name">{task.title}</div>
                          {task.description && (
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{task.description}</div>
                          )}
                        </td>
                        <td>
                          <span className={`pill ${priorityPill[task.priority]}`}>{task.priority}</span>
                        </td>
                        <td>
                          <span className={`pill ${statusPill[task.status]}`}>{task.status}</span>
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
                            <button className="btn btn-red btn-sm" onClick={() => onDelete(task._id)} disabled={deletingId === task._id}>
                              {deletingId === task._id ? "..." : "Delete"}
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

export default TasksPage;
