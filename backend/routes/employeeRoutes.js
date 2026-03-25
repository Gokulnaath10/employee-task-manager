const express = require("express");
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployees } = require("../controllers/employeeController");

const router = express.Router();

router.route("/").get(getEmployees).post(createEmployee);
router.post("/import", importEmployees);
router.route("/:id").put(updateEmployee).delete(deleteEmployee);

module.exports = router;
