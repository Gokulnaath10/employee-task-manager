const Employee = require("../models/Employee");
const Task = require("../models/Task");

const cache = {};

async function getEmployees(req, res) {
  try {
    const cacheKey = JSON.stringify(req.query);
    if (cache[cacheKey]) {
      console.log("employees cache hit:", cacheKey);
      return res.json(cache[cacheKey]);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [total, employees] = await Promise.all([
      Employee.countDocuments(),
      Employee.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: employees,
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
    console.log("employees cache miss:", cacheKey);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function createEmployee(req, res) {
  try {
    const { name, email, role, department, status } = req.body;
    if (!name || !email || !role || !department) {
      return res.status(400).json({ message: "Name, email, role and department are required" });
    }
    const employee = await Employee.create({ name, email, role, department, status });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.status(201).json(employee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
}

async function updateEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.json(employee);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    await Task.deleteMany({ employeeId: req.params.id });
    Object.keys(cache).forEach(k => delete cache[k]);
    res.json({ message: "Employee and their tasks deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

async function importEmployees(req, res) {
  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "JSON must be a non-empty array" });
    }

    // Separate employee fields from tasks
    const employeeDocs = records.map(({ tasks, ...emp }) => emp);

    // insertMany — one DB operation for all employees
    const inserted = await Employee.insertMany(employeeDocs, { ordered: false });

    // Build tasks array only for employees that have a tasks field
    const taskDocs = [];
    inserted.forEach((emp, i) => {
      const tasks = records[i].tasks;
      if (Array.isArray(tasks) && tasks.length > 0) {
        tasks.forEach(t => taskDocs.push({ ...t, employeeId: emp._id }));
      }
    });

    // insertMany tasks only if any exist
    if (taskDocs.length > 0) {
      await Task.insertMany(taskDocs, { ordered: false });
    }

    Object.keys(cache).forEach(k => delete cache[k]);
    res.status(201).json({
      message: `Imported ${inserted.length} employee${inserted.length !== 1 ? "s" : ""} and ${taskDocs.length} task${taskDocs.length !== 1 ? "s" : ""}`,
      employees: inserted.length,
      tasks: taskDocs.length,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "One or more emails already exist" });
    }
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployees };
