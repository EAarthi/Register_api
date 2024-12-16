const express = require('express');
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json()); 

const db = mysql.createConnection({
  host: process.env.DB_HOST,  
  user: process.env.DB_USER,  
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_DATABASE,  
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database.");
});

app.post("/register", (req, res) => {
  const { name, employee_id, email, phone, department, date_of_joining, role } = req.body;

  if (!name || !employee_id || !email || !phone || !department || !date_of_joining || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if employee ID and email already exists
  const checkEmployeeQuery = `SELECT * FROM employees WHERE employee_id = ? OR email = ?`;
  db.query(checkEmployeeQuery, [employee_id, email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error checking existing records" });
    }

    if (result.length > 0) {
      if (result.some(record => record.employee_id === employee_id)) {
        return res.status(409).json({ message: "Employee ID already exists" });
      }
      if (result.some(record => record.email === email)) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }
    // Insert new employee record
    const query = `INSERT INTO employees (name, employee_id, email, phone, department, date_of_joining, role)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [name, employee_id, email, phone, department, date_of_joining, role], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error registering employee" });
      }
      res.status(201).json({ message: "Employee registered successfully", employeeId: result.insertId });
    });
  });
});
app.get("/read", (req, res) => {
  const query = "SELECT * FROM employees";
  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving employees" });
    }
    res.status(200).json(result);
  });
})

// Update employee details
app.put("/update/:id", (req, res) => {
  const { name, employee_id, email, phone, department, date_of_joining, role } = req.body;
  const employeeId = req.params.id;

  if (!name || !employee_id || !email || !phone || !department || !date_of_joining || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query = `
    UPDATE employees SET name = ?, employee_id = ?, email = ?, phone = ?, department = ?, date_of_joining = ?, role = ?
    WHERE employee_id = ?
  `;

  db.query(query, [name, employee_id, email, phone, department, date_of_joining, role, employeeId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating employee" });
    }
    res.status(200).json({ message: "Employee updated successfully" });
  });
});


// Delete employee details
app.delete("/delete/:id", (req, res) => {
  const employeeId = req.params.id;

  const query = "DELETE FROM employees WHERE employee_id = ?";
  db.query(query, [employeeId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting employee" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  });
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
