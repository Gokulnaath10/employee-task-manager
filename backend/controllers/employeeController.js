const Employee = require("../models/Employee");
const Task = require("../models/Task");

async function getEmployees(req, res) {
  try {
    // MongoDB pagination: parse page & limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit; // e.g. page 2, limit 5 → skip 5

    // countDocuments() uses the index — much faster than .length on .find()
    const total = await Employee.countDocuments();
    const totalPages = Math.ceil(total / limit);

    // .lean() returns plain JS objects instead of Mongoose Documents → faster reads
    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: employees,
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

async function createEmployee(req, res) {
  try {
    const { name, email, role, department, status } = req.body;
    if (!name || !email || !role || !department) {
      return res.status(400).json({ message: "Name, email, role and department are required" });
    }
    const employee = await Employee.create({ name, email, role, department, status });
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
    res.json({ message: "Employee and their tasks deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
