const Task = require("../models/Task");

async function getTasks(req, res) {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Build filter — include status if provided (Pending / Completed)
    const filter = { employeeId };
    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    // Run both queries in parallel with the same filter
    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function createTask(req, res) {
  try {
    const { title, description, status, priority } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const task = await Task.create({ title, description, status, priority, employeeId: req.params.employeeId });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function updateTask(req, res) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
