const express = require("express");
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require("../controllers/employeeController");

const router = express.Router();

router.route("/").get(getEmployees).post(createEmployee);
router.route("/:id").put(updateEmployee).delete(deleteEmployee);

module.exports = router;
