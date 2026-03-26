const Task = require("../models/Task");

const cache = {};

async function getTasks(req, res) {
  try {
    const cacheKey = `${req.params.employeeId}:${JSON.stringify(req.query)}`;
    if (cache[cacheKey]) {
      console.log("tasks cache hit:", cacheKey);
      return res.json(cache[cacheKey]);
    }

    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { employeeId };
    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    cache[cacheKey] = result;
    console.log("tasks cache miss:", cacheKey);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function createTask(req, res) {
  try {
    const { title, description, status, priority } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const task = await Task.create({ title, description, status, priority, employeeId: req.params.employeeId });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function updateTask(req, res) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.json(task);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.json({ message: "Task deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
