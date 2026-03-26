# Complete Code Explanation — Employee Task Manager
# Every file · Every line · Every word explained

---

## HOW TO READ THIS DOCUMENT

Each file is broken into lines. Under every line you will find:
- **What it does** — the purpose of this line
- **Word-by-word** — why each specific word/keyword was used there

---

---

# 1. `backend/models/Employee.js`

**Purpose of this file:** Defines the shape/structure of an Employee record in MongoDB. Think of it as a blueprint that tells MongoDB "every employee must have these exact fields".

---

```js
const mongoose = require("mongoose");
```

- `const` — declares a variable that will never be reassigned (a constant).
- `mongoose` — the name we give to the imported library. We use this name to access Mongoose features throughout the file.
- `require` — Node.js built-in function to import (load) an external package.
- `"mongoose"` — the name of the package we installed via `npm install mongoose`. Mongoose is a library that lets JavaScript talk to MongoDB.

---

```js
const employeeSchema = new mongoose.Schema(
```

- `const employeeSchema` — we store the schema (blueprint) in a variable called `employeeSchema`.
- `new` — creates a new instance (a fresh object) from a class.
- `mongoose.Schema` — a class provided by Mongoose. It defines what fields a document (record) in MongoDB can have.
- `(` — opens the argument list we pass to Schema.

---

```js
  {
    name: { type: String, required: true, trim: true },
```

- `{` — opens an object. This object contains all the fields.
- `name:` — the field name. Every employee document will have a `name` property.
- `type: String` — tells Mongoose that `name` must be text (a string), not a number or date.
- `required: true` — if someone tries to save an employee without a name, Mongoose will reject it with an error.
- `trim: true` — automatically removes spaces from the start and end (e.g. `"  John  "` becomes `"John"`).

---

```js
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
```

- `email:` — the field name.
- `type: String` — must be text.
- `required: true` — cannot be empty.
- `unique: true` — no two employees can have the same email. MongoDB creates a unique index for this.
- `trim: true` — removes surrounding spaces.
- `lowercase: true` — automatically converts email to lowercase so `"JOHN@MAIL.COM"` is stored as `"john@mail.com"`, preventing duplicates.

---

```js
    role: { type: String, required: true, trim: true },
```

- `role:` — job title, e.g. "Developer" or "Designer".
- Same options as name: must be text, required, trimmed.

---

```js
    department: { type: String, required: true, trim: true },
```

- `department:` — e.g. "Engineering" or "HR". Same rules as above.

---

```js
    status: { type: String, enum: ["Active", "Inactive", "On Leave"], default: "Active" },
```

- `status:` — the employment status of the employee.
- `type: String` — stored as text.
- `enum: ["Active", "Inactive", "On Leave"]` — `enum` means "only these exact values are allowed". If someone sends `"Fired"`, Mongoose rejects it.
- `default: "Active"` — if no status is provided when creating an employee, it automatically becomes `"Active"`.

---

```js
  },
  { timestamps: true }
```

- `}` — closes the fields object.
- `,` — separates the two arguments to `mongoose.Schema`.
- `{ timestamps: true }` — this is the second argument (options). `timestamps: true` tells Mongoose to automatically add two fields to every document: `createdAt` (when it was created) and `updatedAt` (when it was last changed). You don't have to set these manually.

---

```js
);
```

- `)` — closes the `mongoose.Schema(...)` call.
- `;` — ends the statement.

---

```js
module.exports = mongoose.model("Employee", employeeSchema);
```

- `module.exports` — in Node.js, `module.exports` is what gets returned when another file does `require("./models/Employee")`. We're exporting (sharing) the model.
- `=` — assigns the result.
- `mongoose.model` — creates a Model from the schema. A Model is a class that lets you do database operations: `Employee.find()`, `Employee.create()`, etc.
- `"Employee"` — the name of the model. Mongoose uses this to determine the collection name in MongoDB. It automatically lowercases and pluralizes it → the collection becomes `employees`.
- `employeeSchema` — the blueprint we defined above. We're saying "use this schema for the Employee model".

---

---

# 2. `backend/models/Task.js`

**Purpose:** Blueprint for a Task record in MongoDB. Each task belongs to one employee.

---

```js
const mongoose = require("mongoose");
```
Same as Employee.js — loads the Mongoose library.

---

```js
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
```

- `title:` — the name of the task, e.g. "Fix login bug". Required and trimmed.

---

```js
    description: { type: String, trim: true, default: "" },
```

- `description:` — extra details about the task.
- No `required: true` here — description is optional.
- `default: ""` — if no description provided, it stores an empty string instead of `null`.

---

```js
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
```

- `status:` — is the task done or not?
- `enum: ["Pending", "Completed"]` — only these two values allowed.
- `default: "Pending"` — new tasks start as Pending.

---

```js
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
```

- `priority:` — how urgent is this task?
- `enum: ["Low", "Medium", "High"]` — three levels allowed.
- `default: "Medium"` — if not specified, defaults to Medium.

---

```js
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
```

- `employeeId:` — stores which employee this task belongs to.
- `type: mongoose.Schema.Types.ObjectId` — an ObjectId is MongoDB's special ID type (a 24-character hex string like `"507f1f77bcf86cd799439011"`). We use this type to store a reference to another document.
- `ref: "Employee"` — tells Mongoose "this ObjectId points to a document in the Employee model". This enables `.populate()` which can auto-fetch the employee's details.
- `required: true` — a task must always belong to an employee.

---

```js
  },
  { timestamps: true }
);
```

Same as Employee — adds `createdAt` and `updatedAt` automatically.

---

```js
module.exports = mongoose.model("Task", taskSchema);
```

Creates and exports the Task model. MongoDB collection will be named `tasks`.

---

---

# 3. `backend/controllers/employeeController.js`

**Purpose:** Contains all the business logic for employee operations — get all, create, update, delete. Controllers receive the HTTP request, do database work, and send back a response.

---

```js
const Employee = require("../models/Employee");
const Task = require("../models/Task");
```

- `require("../models/Employee")` — `../` means "go up one folder" (from `controllers/` to `backend/`), then into `models/Employee.js`.
- We import Task here too because when we delete an employee, we also delete their tasks.

---

```js
async function getEmployees(req, res) {
```

- `async` — this function does database work which takes time. `async` means the function returns a Promise and we can use `await` inside it.
- `function getEmployees` — the name of this function. Descriptive: "get all employees".
- `req` — short for "request". Contains everything the client sent: headers, body, params, etc.
- `res` — short for "response". We use this to send data back to the client.

---

```js
  try {
```

- `try` — starts a block of code that might fail (e.g. database could be down). If anything inside fails, JavaScript jumps to the `catch` block instead of crashing.

---

```js
    const employees = await Employee.find().sort({ createdAt: -1 });
```

- `await` — pauses execution here until the database query finishes. Without `await`, the code would continue before we have the data.
- `Employee.find()` — fetches ALL documents from the `employees` collection. Returns an array.
- `.sort({ createdAt: -1 })` — sorts results by `createdAt` in descending order (`-1`). So newest employees appear first. `1` would mean ascending (oldest first).

---

```js
    res.json(employees);
```

- `res.json(employees)` — sends the employees array back to the client as JSON (JavaScript Object Notation), the standard data format for APIs. Automatically sets the `Content-Type: application/json` header.

---

```js
  } catch {
    res.status(500).json({ message: "Server error" });
  }
```

- `catch` — if anything in `try` throws an error (e.g. DB connection failed), this runs.
- `res.status(500)` — sets the HTTP status code to 500, which means "Internal Server Error". Status codes tell the client what happened: 200=OK, 400=Bad Request, 404=Not Found, 500=Server Error.
- `.json({ message: "Server error" })` — sends a JSON object with an error message.

---

```js
async function createEmployee(req, res) {
  try {
    const { name, email, role, department, status } = req.body;
```

- `const { name, email, role, department, status } = req.body` — destructuring. `req.body` contains the JSON data sent by the client (the form values). We extract specific fields from it into separate variables.

---

```js
    if (!name || !email || !role || !department) {
      return res.status(400).json({ message: "Name, email, role and department are required" });
    }
```

- `if (!name || !email || !role || !department)` — validates that required fields were provided. `!name` is `true` if name is empty/null/undefined.
- `||` — means "or". If ANY of these is missing, we reject the request.
- `return res.status(400)` — `return` stops the function here. Status 400 means "Bad Request" (the client sent bad data).

---

```js
    const employee = await Employee.create({ name, email, role, department, status });
```

- `Employee.create(...)` — creates and saves a new document in MongoDB in one step.
- `{ name, email, role, department, status }` — shorthand for `{ name: name, email: email, ... }` in modern JavaScript.

---

```js
    res.status(201).json(employee);
```

- `201` — HTTP status "Created". Specifically means a new resource was successfully created (as opposed to 200 which means "OK" for general success).

---

```js
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
```

- `error.code === 11000` — MongoDB error code 11000 specifically means "duplicate key violation". This happens when someone tries to create an employee with an email that already exists (because of `unique: true`). We catch this specifically to give a helpful message instead of a generic server error.

---

```js
async function updateEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
```

- `Employee.findByIdAndUpdate` — finds a document by its `_id` and updates it. Three arguments:
  1. `req.params.id` — the ID from the URL, e.g. `/api/employees/507f1f77...` → `req.params.id = "507f1f77..."`.
  2. `req.body` — the new values to apply.
  3. `{ new: true, runValidators: true }` — options:
     - `new: true` — return the updated document (by default it returns the OLD document).
     - `runValidators: true` — run schema validations (like `required`, `enum`) on the update too. By default, updates skip validation.

---

```js
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
```

- `if (!employee)` — if the ID didn't match any document, `findByIdAndUpdate` returns `null`.
- `404` — "Not Found". The requested resource doesn't exist.

---

```js
async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    await Task.deleteMany({ employeeId: req.params.id });
```

- `Employee.findByIdAndDelete` — finds and deletes the document in one step.
- `Task.deleteMany({ employeeId: req.params.id })` — deletes ALL tasks that belong to this employee. This is a "cascading delete" — when you delete an employee, their tasks disappear too. `deleteMany` deletes multiple documents matching the filter.

---

```js
    res.json({ message: "Employee and their tasks deleted" });
```

Sends a success message. No specific status needed since 200 is the default.

---

```js
module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
```

- Exports all four functions as an object so routes can import them.

---

---

# 4. `backend/controllers/taskController.js`

**Purpose:** Business logic for task operations — get, create, update, delete tasks for a specific employee.

---

```js
const Task = require("../models/Task");
```

Only needs the Task model (not Employee).

---

```js
async function getTasks(req, res) {
  try {
    const tasks = await Task.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
```

- `Task.find({ employeeId: req.params.employeeId })` — finds tasks WHERE employeeId matches. `req.params.employeeId` comes from the URL: `/api/employees/:employeeId/tasks`.
- Only tasks for that specific employee are returned, not all tasks.

---

```js
async function createTask(req, res) {
  try {
    const { title, description, status, priority } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const task = await Task.create({ title, description, status, priority, employeeId: req.params.employeeId });
```

- `employeeId: req.params.employeeId` — automatically attaches the employee's ID to the task. The client doesn't need to send this — we get it from the URL parameter.

---

```js
async function updateTask(req, res) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
```

- `req.params.id` — the task's ID from the URL: `/api/employees/:employeeId/tasks/:id`.

---

```js
async function deleteTask(req, res) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
```

Finds and deletes the task. Sends success message if found.

---

```js
module.exports = { getTasks, createTask, updateTask, deleteTask };
```

Exports all four task functions.

---

---

# 5. `backend/routes/employeeRoutes.js`

**Purpose:** Maps URLs to controller functions. Tells Express "when someone calls GET /employees, run getEmployees".

---

```js
const express = require("express");
```

Loads Express to create a router.

---

```js
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require("../controllers/employeeController");
```

- Destructuring import — pulls out exactly the four functions we need from the controller file.

---

```js
const router = express.Router();
```

- `express.Router()` — creates a mini-app that handles a subset of routes. We mount this at `/api/employees` in `index.js`, so all routes here are relative to that.

---

```js
router.route("/").get(getEmployees).post(createEmployee);
```

- `router.route("/")` — matches the base path (which is `/api/employees` when mounted).
- `.get(getEmployees)` — when a GET request comes in (client is fetching data), run `getEmployees`.
- `.post(createEmployee)` — when a POST request comes in (client is sending new data), run `createEmployee`.
- This chains two HTTP methods on the same path cleanly.

---

```js
router.route("/:id").put(updateEmployee).delete(deleteEmployee);
```

- `"/:id"` — a dynamic segment. `:id` is a placeholder. So `/api/employees/abc123` → `req.params.id = "abc123"`.
- `.put(updateEmployee)` — PUT means replace/update a resource.
- `.delete(deleteEmployee)` — DELETE means remove it.

---

```js
module.exports = router;
```

Exports the router so `index.js` can use it.

---

---

# 6. `backend/routes/taskRoutes.js`

**Purpose:** Maps task URLs to task controller functions. Tasks are nested under employees.

---

```js
const router = express.Router({ mergeParams: true });
```

- `{ mergeParams: true }` — this is the key difference from employeeRoutes. When task routes are mounted at `/api/employees/:employeeId/tasks`, the `:employeeId` parameter is defined in the parent route (in `index.js`), not in this router. By default, child routers cannot see parent route params. `mergeParams: true` merges the parent's params into `req.params`, so `req.params.employeeId` is accessible in task controller functions.

---

```js
router.route("/").get(getTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);
```

- Same pattern as employee routes. `/` → get all or create. `/:id` → update or delete a specific task.

---

---

# 7. `backend/index.js`

**Purpose:** The entry point of the backend server. Sets up Express, connects to MongoDB, registers all routes, and starts listening for requests.

---

```js
const express = require("express");
```

Loads Express — the web framework for Node.js. It handles routing, middleware, HTTP parsing.

---

```js
const cors = require("cors");
```

- `cors` — stands for Cross-Origin Resource Sharing. Browsers block JavaScript from calling APIs on different domains by default (security feature). CORS middleware adds special headers to responses telling the browser "yes, this API allows requests from other origins".

---

```js
const dotenv = require("dotenv");
```

- `dotenv` — loads environment variables from a `.env` file into `process.env`. Environment variables store secrets (like database passwords) outside of code.

---

```js
const connectDB = require("./config/db");
```

- Imports a function that connects to MongoDB. Kept in a separate file to keep `index.js` clean.

---

```js
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/taskRoutes");
```

Imports the route definitions we created.

---

```js
dotenv.config();
```

- Reads the `.env` file and loads variables into `process.env`. Must be called before any code tries to read `process.env.MONGO_URI`, etc.

---

```js
connectDB();
```

Calls the database connection function immediately when the server starts.

---

```js
const app = express();
```

- Creates the Express application. `app` is the main object we use to configure middleware and routes.

---

```js
const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
```

- `process.env.CLIENT_URLS` — an environment variable that can contain a comma-separated list of allowed frontend URLs.
- `|| "http://localhost:3000"` — fallback: if the env var is not set, default to localhost.
- `.split(",")` — splits the string by comma into an array: `"http://a.com,http://b.com"` → `["http://a.com", "http://b.com"]`.
- `.map((o) => o.trim())` — removes whitespace from each URL.
- `.filter(Boolean)` — removes any empty strings from the array.

---

```js
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
}));
```

- `app.use(...)` — registers middleware. Middleware runs on every request before route handlers.
- `origin(origin, callback)` — custom function to check if the request's origin is allowed.
- `!origin` — requests without an origin header (like server-to-server calls, Postman) are always allowed.
- `allowedOrigins.includes(origin)` — if the request comes from an allowed domain, permit it.
- `callback(null, true)` — `null` means no error, `true` means allowed.
- `callback(new Error(...))` — rejects the request with a CORS error.

---

```js
app.use(express.json());
```

- Middleware that parses incoming request bodies. When the frontend sends JSON (like a form submission), this converts the raw text into a JavaScript object accessible via `req.body`.

---

```js
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
```

- A simple health check endpoint. You can visit `/api/health` to confirm the server is running. `{ status: "ok" }` is the response.

---

```js
app.use("/api/employees", employeeRoutes);
```

- Mounts the employee router at `/api/employees`. All routes in `employeeRoutes` are prefixed with this. So `router.route("/")` becomes `/api/employees` and `router.route("/:id")` becomes `/api/employees/:id`.

---

```js
app.use("/api/employees/:employeeId/tasks", taskRoutes);
```

- Mounts the task router at `/api/employees/:employeeId/tasks`. So task routes become `/api/employees/abc123/tasks` and `/api/employees/abc123/tasks/xyz456`.

---

```js
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- `process.env.PORT` — hosting platforms (like Heroku) set this automatically. For local development it's not set, so we use `5002`.
- `app.listen(PORT, callback)` — starts the HTTP server on the specified port. The callback runs when the server is ready.
- `console.log(...)` — prints to the terminal so you know the server started.

---

---

# 8. `netlify/functions/api.js`

**Purpose:** This is the Netlify serverless function. Instead of running a permanent server, this file is called on-demand by Netlify every time an API request comes in. It wraps the Express app using `serverless-http`.

---

```js
const serverless = require("serverless-http");
```

- `serverless-http` — a package that converts an Express app into a function that Netlify (or AWS Lambda) can call. Normally Express runs as a persistent server, but serverless functions are called once per request and shut down. This package handles that translation.

---

```js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
```

Same libraries as `backend/index.js` but without dotenv (Netlify provides env vars automatically from the dashboard).

---

```js
const employeeRoutes = require("../../backend/routes/employeeRoutes");
const taskRoutes = require("../../backend/routes/taskRoutes");
```

- `../../` — goes up two folders (from `netlify/functions/` to the repo root), then into `backend/routes/`. This reuses the same route files — we don't duplicate them.

---

```js
const app = express();

app.use(cors());
app.use(express.json());
```

Creates a fresh Express app and adds CORS + JSON parsing. CORS here uses `cors()` with no arguments — allows all origins (simpler for a public app).

---

```js
app.use("/api/employees", employeeRoutes);
app.use("/api/employees/:employeeId/tasks", taskRoutes);
```

Same route mounting as `backend/index.js`.

---

```js
let isConnected = false;
```

- `let` — like `const` but the value can change. We start with `false` (not connected yet).
- This variable persists across invocations of the function (within the same Lambda container). Netlify/AWS reuses containers to avoid the overhead of reconnecting to MongoDB on every single request.

---

```js
module.exports.handler = async (event, context) => {
```

- `module.exports.handler` — Netlify looks for a function named `handler` on the exported object. This is the entry point Netlify calls.
- `event` — contains request details (URL, method, body, headers).
- `context` — Lambda execution context (time remaining, function name, etc.).

---

```js
  context.callbackWaitsForEmptyEventLoop = false;
```

- Without this, AWS Lambda (which powers Netlify Functions) waits for all async operations to finish before it considers the function done — including the open MongoDB connection. This would cause timeouts. Setting it to `false` tells Lambda "the function is done when we call the callback, don't wait for the event loop to drain".

---

```js
  if (!isConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
  }
```

- `if (!isConnected)` — only connect to MongoDB if we haven't already. If the container is reused, the connection already exists.
- `mongoose.connect(process.env.MONGO_URI)` — connects to MongoDB Atlas. `MONGO_URI` is the connection string you set in Netlify's environment variables dashboard.
- `isConnected = true` — marks that we're connected so future calls skip this.

---

```js
  return serverless(app)(event, context);
```

- `serverless(app)` — wraps the Express `app` and returns a new function that understands Lambda's `event`/`context` format.
- `(event, context)` — immediately calls that function with the current request.
- `return` — returns the result (the HTTP response) back to Netlify.

---

---

# 9. `netlify.toml`

**Purpose:** Configuration file for Netlify. Tells Netlify how to build the project, where the output is, where the functions are, and how to handle URL routing.

---

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/build"
```

- `[build]` — the build section.
- `command` — the shell command Netlify runs to build the project:
  - `cd frontend` — change directory into the frontend folder.
  - `&&` — run the next command only if the previous succeeded.
  - `npm install` — installs React and other frontend dependencies.
  - `&&` — again.
  - `npm run build` — runs the `build` script in `frontend/package.json`, which compiles React into static HTML/CSS/JS files.
- `publish = "frontend/build"` — tells Netlify where the compiled files are. These are the files Netlify serves to visitors.

---

```toml
[functions]
  directory = "netlify/functions"
```

- `[functions]` — the functions section.
- `directory = "netlify/functions"` — tells Netlify where to find serverless functions. Every `.js` file in this folder becomes a callable function endpoint.

---

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200
  force = true
```

- `[[redirects]]` — double brackets means this is an array item (there can be multiple redirect rules).
- `from = "/api/*"` — matches any URL starting with `/api/`. The `*` is a wildcard.
- `to = "/.netlify/functions/api"` — redirects to the serverless function named `api` (which is our `netlify/functions/api.js`).
- `status = 200` — this is a "proxy" redirect (200 = OK), not a real redirect (301/302). The user's browser URL doesn't change — Netlify internally forwards the request to the function.
- `force = true` — even if a static file exists at `/api/...`, always use this redirect rule.

---

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- This rule handles the React single-page app (SPA). When a user visits `/employees/abc/tasks` directly (or refreshes the page), Netlify doesn't have that HTML file — React handles routing in the browser. This rule sends ALL unknown URLs to `/index.html`, where React takes over and renders the right page.

---

---

# 10. `package.json` (root)

**Purpose:** The root `package.json` lists dependencies needed by the Netlify serverless function. Netlify automatically installs these when deploying.

---

```json
{
  "name": "employee-task-manager",
```

- `name` — the project name. Used by npm to identify the package.

---

```json
  "version": "1.0.0",
```

- `version` — the current version of the project. Follows semantic versioning: major.minor.patch.

---

```json
  "private": true,
```

- `private: true` — prevents accidentally publishing this package to the npm registry (npm publish would fail). It's a private project, not a shareable library.

---

```json
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "mongoose": "^8.12.1",
    "serverless-http": "^3.2.0"
  }
```

- `dependencies` — packages that the app needs to run.
- `"cors": "^2.8.5"` — the CORS middleware. `^` means "accept any version ≥ 2.8.5 that is still 2.x.x" (no breaking changes).
- `"dotenv"` — loads `.env` file variables.
- `"express"` — the web framework.
- `"mongoose"` — MongoDB object modeling.
- `"serverless-http"` — converts Express to a serverless function.

---

---

# 11. `frontend/src/api/apiClient.js`

**Purpose:** Creates a single, configured Axios instance that all API calls use. Instead of every file configuring Axios separately, they all use this shared instance.

---

```js
import axios from "axios";
```

- `import` — ES module syntax (used in React). Same as `require` but modern JavaScript.
- `axios` — a popular HTTP client library. Makes it easy to send GET, POST, PUT, DELETE requests and handle responses.

---

```js
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});
```

- `axios.create({...})` — creates a custom Axios instance with preset configuration.
- `baseURL` — a prefix added to every request. If you call `apiClient.get("/employees")`, it actually calls `baseURL + "/employees"`.
- `process.env.REACT_APP_API_URL` — an environment variable for the API URL. In Create React App, env vars must start with `REACT_APP_` to be accessible in browser code.
  - **Locally**: set to `http://localhost:5002/api` (your local backend server).
  - **On Netlify**: not set, so it uses the fallback `/api`.
- `|| "/api"` — fallback value. `/api` on Netlify is intercepted by the redirect rule and sent to the serverless function.

---

```js
export default apiClient;
```

- `export default` — exports this as the default export. Other files import it as `import apiClient from "./apiClient"`.

---

---

# 12. `frontend/src/api/employeeApi.js`

**Purpose:** All employee-related API functions in one place. Components call these functions instead of calling Axios directly.

---

```js
import apiClient from "./apiClient";
```

Imports the shared Axios instance.

---

```js
export const getEmployees = () => apiClient.get("/employees").then(r => r.data);
```

- `export const` — exports this function directly (named export).
- `getEmployees` — name of the function.
- `() =>` — arrow function with no parameters.
- `apiClient.get("/employees")` — sends a GET request to `/api/employees` (baseURL + "/employees").
- `.then(r => r.data)` — Axios wraps the response in an object. `r.data` contains the actual JSON returned by the server. `.then()` transforms the Promise to return just the data.

---

```js
export const createEmployee = (data) => apiClient.post("/employees", data).then(r => r.data);
```

- `(data)` — takes the employee data object as a parameter.
- `apiClient.post("/employees", data)` — sends a POST request with `data` as the request body.

---

```js
export const updateEmployee = (id, data) => apiClient.put(`/employees/${id}`, data).then(r => r.data);
```

- `(id, data)` — needs the employee's ID and the new data.
- `` `/employees/${id}` `` — template literal. `${id}` inserts the variable value: `/employees/abc123`.
- `apiClient.put(...)` — PUT request to update the employee.

---

```js
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`).then(r => r.data);
```

- `apiClient.delete(...)` — sends a DELETE request. No body needed for deletion.

---

---

# 13. `frontend/src/api/taskApi.js`

**Purpose:** All task-related API functions. Tasks are nested under employees, so every function takes `employeeId`.

---

```js
export const getTasks = (employeeId) => apiClient.get(`/employees/${employeeId}/tasks`).then(r => r.data);
```

- `(employeeId)` — which employee's tasks to fetch.
- `` `/employees/${employeeId}/tasks` `` — builds the nested URL.

---

```js
export const createTask = (employeeId, data) => apiClient.post(`/employees/${employeeId}/tasks`, data).then(r => r.data);
```

- Creates a task under a specific employee.

---

```js
export const updateTask = (employeeId, id, data) => apiClient.put(`/employees/${employeeId}/tasks/${id}`, data).then(r => r.data);
```

- `(employeeId, id, data)` — three params: employee's ID, task's ID, and the new data.

---

```js
export const deleteTask = (employeeId, id) => apiClient.delete(`/employees/${employeeId}/tasks/${id}`).then(r => r.data);
```

- Deletes a specific task of a specific employee.

---

---

# 14. `frontend/src/pages/EmployeesPage.js`

**Purpose:** The main (home) page of the app. Shows all employees, a form to add/edit employees, and navigation to each employee's tasks.

---

```js
import { useEffect, useState } from "react";
```

- `useEffect` — a React Hook. Runs code after the component renders. Used here to load employees when the page first loads.
- `useState` — a React Hook. Lets a component hold and update values (state). When state changes, React re-renders the component.

---

```js
import { useNavigate } from "react-router-dom";
```

- `useNavigate` — a React Router hook. Returns a `navigate` function used to programmatically change the URL (e.g., go to the tasks page when button is clicked).

---

```js
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api/employeeApi";
```

Imports the four API functions we defined.

---

```js
const blank = { name: "", email: "", role: "", department: "", status: "Active" };
```

- `blank` — the default (empty) state for the form. When we reset the form after submitting, we set it back to this object. Defined outside the component so it's not re-created on every render.

---

```js
const statusPill = { Active: "pill-green", Inactive: "pill-red", "On Leave": "pill-yellow" };
```

- A lookup object (dictionary) that maps a status value to its CSS class name. `statusPill["Active"]` → `"pill-green"`. Used to color the status badge in the table.

---

```js
function EmployeesPage() {
  const navigate = useNavigate();
```

- `navigate` — the function to change pages. Calling `navigate("/employees/abc/tasks")` changes the URL.

---

```js
  const [employees, setEmployees] = useState([]);
```

- `useState([])` — creates a state variable initialized to an empty array.
- `employees` — the current value (the list of employees).
- `setEmployees` — the function to update it. Calling `setEmployees(newList)` triggers a re-render.

---

```js
  const [form, setForm] = useState(blank);
```

- `form` — the current values of the form fields.
- `setForm` — updates the form.

---

```js
  const [editId, setEditId] = useState(null);
```

- `editId` — stores the ID of the employee being edited. `null` means we're adding (not editing).

---

```js
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
```

- `isSubmitting` — `true` while the form is being saved. Disables the button to prevent double-submit.
- `deletingId` — stores the ID of the employee currently being deleted. Shows "..." on that row's button.
- `error` — stores any error message to display.
- `isLoading` — `true` while employees are being fetched. Shows "Loading..." instead of the table.

---

```js
  useEffect(() => { load(); }, []);
```

- `useEffect(callback, [])` — runs the callback once after the component first renders. The `[]` (empty dependency array) means "only run once, never again". If we put `[employees]` it would run every time employees changes.
- `load()` — our function that fetches employees from the API.

---

```js
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
```

- `finally` — runs whether the try succeeded or the catch caught an error. We always turn off loading here.
- `setEmployees(await getEmployees())` — fetches employees and updates state. React re-renders with the new list.

---

```js
  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
```

- `onChange` — called every time a form field changes.
- `e` — the event object (contains info about what changed).
- `f => ({ ...f, [e.target.name]: e.target.value })` — updates only the changed field:
  - `...f` — spread: copies all existing form fields.
  - `[e.target.name]` — computed property name. If the user typed in the "email" input, `e.target.name = "email"`, so this updates `form.email`.
  - `e.target.value` — what the user typed.

---

```js
  async function onSubmit(e) {
    e.preventDefault();
```

- `e.preventDefault()` — prevents the browser's default form submission (which would reload the page). We handle submission ourselves via JavaScript.

---

```js
    if (editId) {
      const updated = await updateEmployee(editId, form);
      setEmployees(list => list.map(emp => emp._id === editId ? updated : emp));
    } else {
      const created = await createEmployee(form);
      setEmployees(list => [created, ...list]);
    }
```

- `if (editId)` — we're editing an existing employee.
- `list.map(emp => emp._id === editId ? updated : emp)` — creates a new array where the edited employee is replaced with the updated data. All other employees stay the same. We don't re-fetch from the server — we update the local state directly for speed.
- `[created, ...list]` — prepends the new employee to the beginning of the list (newest first).

---

```js
  function onEdit(emp) {
    setEditId(emp._id);
    setForm({ name: emp.name, email: emp.email, role: emp.role, department: emp.department, status: emp.status });
    setError("");
  }
```

- Populates the form with the employee's current data and sets `editId` to know we're editing.

---

```js
  async function onDelete(id) {
    ...
    setEmployees(list => list.filter(e => e._id !== id));
    if (editId === id) { setEditId(null); setForm(blank); }
```

- `list.filter(e => e._id !== id)` — creates a new array that excludes the deleted employee.
- `if (editId === id)` — if we were editing the employee we just deleted, clear the form too.

---

```js
  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Employee Task Manager</span>
      </nav>
```

- `<>` — React Fragment. Lets us return multiple elements without adding a wrapping `<div>` to the DOM.
- `className` — React uses `className` instead of `class` (because `class` is a reserved word in JavaScript).
- `nav`, `nav-brand` — CSS class names defined in `index.css`.

---

```js
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Employees</h1>
            <p>{employees.length} employee{employees.length !== 1 ? "s" : ""} total</p>
```

- `{employees.length}` — JSX expression. Curly braces `{}` let you put JavaScript inside HTML.
- `employees.length !== 1 ? "s" : ""` — ternary: if there's 1 employee, no "s". Otherwise add "s". Result: "1 employee" or "5 employees".

---

```js
        {error && <div className="banner banner-error">{error}</div>}
```

- `{error && ...}` — short-circuit evaluation. If `error` is an empty string (falsy), nothing renders. If error has a message (truthy), the error banner renders.

---

```js
        <div className="grid">
```

- `grid` — CSS class that creates a two-column layout (form on left, table on right).

---

```js
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
```

- This renders four form fields using `.map()` to avoid repeating code.
- `[["name", "Name"], ...]` — array of pairs: [fieldName, displayLabel].
- `([field, label]) =>` — destructures each pair directly in the parameter.
- `key={field}` — React requires a unique `key` prop on elements inside `.map()` to track them efficiently.
- `type={field === "email" ? "email" : "text"}` — uses HTML `email` type for the email field (browser validates format) and `text` for others.
- `value={form[field]}` — controlled input. The input always shows the form state value.
- `required` — HTML5 validation attribute. Browser won't submit the form if this is empty.

---

```js
              <button className="btn btn-blue" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editId ? "Update" : "Add Employee"}
              </button>
```

- `disabled={isSubmitting}` — disables the button while saving to prevent double clicks.
- `{isSubmitting ? "Saving..." : editId ? "Update" : "Add Employee"}` — nested ternary. If saving → "Saving...", else if editing → "Update", else → "Add Employee".

---

```js
                    <button className="btn btn-blue btn-sm" onClick={() => navigate(`/employees/${emp._id}/tasks`, { state: { name: emp.name } })}>
                      View Tasks
                    </button>
```

- `onClick={() => navigate(...)}` — arrow function to avoid calling navigate immediately.
- `navigate('/employees/${emp._id}/tasks', { state: { name: emp.name } })` — navigates to the tasks page, and passes the employee's name as route state (so TasksPage can display it without another API call).

---

---

# 15. `frontend/src/pages/TasksPage.js`

**Purpose:** Shows tasks for a specific employee. Includes add/edit/delete task form and a filterable task list.

---

```js
import { useParams, useLocation, useNavigate } from "react-router-dom";
```

- `useParams` — extracts dynamic URL segments. For `/employees/abc123/tasks`, `useParams()` returns `{ employeeId: "abc123" }`.
- `useLocation` — accesses the current location object, including `.state` (data passed via `navigate(..., { state: ... })`).
- `useNavigate` — to navigate back to the employees page.

---

```js
  const { employeeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const employeeName = location.state?.name || "Employee";
```

- `location.state?.name` — optional chaining. `?.` safely accesses `.name` even if `.state` is null/undefined (returns undefined instead of crashing). Falls back to `"Employee"` if no name was passed.

---

```js
  const [filter, setFilter] = useState("All");
```

- Tracks which filter is active: "All", "Pending", or "Completed".

---

```js
  useEffect(() => { load(); }, [employeeId]);
```

- `[employeeId]` — dependency array. If `employeeId` changes (user navigates from one employee's tasks to another's), load() re-runs.

---

```js
  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
```

- Computes the displayed tasks. If filter is "All", show everything. Otherwise, filter by status.

---

```js
  const pending = tasks.filter(t => t.status === "Pending").length;
  const completed = tasks.filter(t => t.status === "Completed").length;
```

- Counts for the header subtitle: "3 pending · 2 completed".

---

```js
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Employees
        </button>
```

- `navigate("/")` — goes back to the home page (employees list).
- `←` — HTML entity for a left arrow character.

---

```js
            <div className="filters">
              {["All", "Pending", "Completed"].map(s => (
                <button key={s} className={`filter-btn${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
                  {s}
                </button>
              ))}
            </div>
```

- `filter-btn${filter === s ? " active" : ""}` — adds `" active"` CSS class to the currently selected filter button, highlighting it. Template literal builds the class string dynamically.

---

```js
              {filter === "All" ? "No tasks yet. Add one using the form." : `No ${filter.toLowerCase()} tasks.`}
```

- Shows different empty messages based on the active filter.

---

---

# 16. `frontend/src/App.js`

**Purpose:** The root component. Sets up React Router so the app knows which page to show for each URL.

---

```js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
```

- `BrowserRouter` — provides routing context to the entire app. Uses the HTML5 history API (real URLs, no `#` hashes).
- `Routes` — wrapper that looks at the current URL and renders the matching `Route`.
- `Route` — maps a URL path to a component.
- `Navigate` — redirects to another URL when rendered.

---

```js
import EmployeesPage from "./pages/EmployeesPage";
import TasksPage from "./pages/TasksPage";
```

Imports the two page components.

---

```js
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeesPage />} />
        <Route path="/employees/:employeeId/tasks" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- `path="/"` — the home page shows EmployeesPage.
- `path="/employees/:employeeId/tasks"` — `:employeeId` is a URL parameter captured by useParams in TasksPage.
- `path="*"` — wildcard that matches any URL not matched above. Redirects to home.
- `replace` on `Navigate` — replaces the current history entry instead of adding a new one, so hitting Back doesn't loop.

---

```js
export default App;
```

Exports App as the default export so `index.js` can import and render it.

---

---

# 17. `frontend/src/index.js`

**Purpose:** The entry point of the React app. Mounts the React app into the HTML page.

---

```js
import React from "react";
```

Required in older React versions. In React 17+ it's not strictly required for JSX, but kept for clarity.

---

```js
import ReactDOM from "react-dom/client";
```

- `ReactDOM` — the library that connects React to the actual browser DOM (HTML elements).
- `react-dom/client` — the modern React 18 API path.

---

```js
import "./index.css";
```

- Imports the global CSS file. Create React App's webpack bundler handles this — it injects the CSS into the page.

---

```js
import App from "./App";
```

Imports the root React component.

---

```js
const root = ReactDOM.createRoot(document.getElementById("root"));
```

- `document.getElementById("root")` — finds the `<div id="root">` in `public/index.html`. This is the single HTML element where the entire React app lives.
- `ReactDOM.createRoot(...)` — creates a React root (React 18 API). This is the modern replacement for `ReactDOM.render()`.

---

```js
root.render(<App />);
```

- `<App />` — renders the App component (and everything inside it) into the `#root` div.
- This is the line that actually starts your entire app.

---

---

# 18. `frontend/package.json`

**Purpose:** Defines the frontend project's dependencies, scripts, and browser targets.

---

```json
{
  "name": "employee-task-manager-client",
```

Name of the frontend package. Different from the root package (`employee-task-manager`).

---

```json
  "dependencies": {
    "axios": "^1.8.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1",
    "react-scripts": "5.0.1"
  },
```

- `axios` — HTTP client for making API requests.
- `react` — the core React library (component rendering, hooks, etc.).
- `react-dom` — connects React to the browser DOM.
- `react-router-dom` — routing library for React apps (BrowserRouter, Route, etc.).
- `react-scripts` — Create React App's toolchain. Includes webpack, Babel, Jest — all pre-configured. Version is pinned (no `^`) because CRA's internal tooling is sensitive to version changes.

---

```json
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
```

- `start` — `npm start` runs this. Starts a local dev server at `localhost:3000` with hot reloading.
- `build` — `npm run build` runs this. Compiles and bundles all files into `frontend/build/` for production deployment.

---

```json
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
```

- `browserslist` — tells Babel (JavaScript transpiler) and CSS tools which browsers to support.
- `">0.2%"` — support browsers used by more than 0.2% of people globally.
- `"not dead"` — exclude browsers no longer receiving security updates.
- `"not op_mini all"` — exclude Opera Mini (limited JS support).
- `development` — only target current versions of major browsers locally for faster builds.

---

---

# SUMMARY: HOW ALL FILES CONNECT

```
Browser (React App)
    |
    | HTTP Request (e.g., GET /api/employees)
    v
Netlify CDN
    |
    | Matches /api/* redirect rule (netlify.toml)
    v
netlify/functions/api.js  ←── serverless-http wraps Express
    |
    | Connects to MongoDB Atlas (MONGO_URI env var)
    | Routes request to:
    v
backend/routes/employeeRoutes.js  OR  backend/routes/taskRoutes.js
    |
    v
backend/controllers/employeeController.js  OR  taskController.js
    |
    | Database query via Mongoose
    v
backend/models/Employee.js  OR  Task.js
    |
    v
MongoDB Atlas (cloud database)
    |
    | Result returned up the chain
    v
JSON response → React updates UI
```

**Frontend flow:**
```
frontend/src/index.js
    → renders App.js
        → BrowserRouter matches URL to Route
            → EmployeesPage.js  (path="/")
                → calls employeeApi.js → apiClient.js → Axios → /api/employees
            → TasksPage.js  (path="/employees/:id/tasks")
                → calls taskApi.js → apiClient.js → Axios → /api/employees/:id/tasks
```
