import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeDetails.css";
import {
  FaArrowLeft,
  FaUsers,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserPlus,
  FaTimes,
  FaCheck,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCut,
} from "react-icons/fa";
import { API_URL } from "../config";

function EmployeeDetails() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    phone: "",
    address: "",
    status: "Active",
  });
  const [weeklyStats, setWeeklyStats] = useState({});

  const EMPLOYEES_API_URL = `${API_URL}/employees`;

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
    fetchWeeklyStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(EMPLOYEES_API_URL);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/weekly-stats`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
    }
  };

  // Add new employee
  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim()) {
      alert("Please enter employee name");
      return;
    }

    try {
      const response = await fetch(EMPLOYEES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });

      if (response.ok) {
        const added = await response.json();
        setEmployees([...employees, added].sort((a, b) => a.name.localeCompare(b.name)));
        setNewEmployee({ name: "", phone: "", address: "", status: "Active" });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee");
    }
  };

  // Update employee
  const handleUpdateEmployee = async () => {
    if (!editingEmployee.name.trim()) {
      alert("Please enter employee name");
      return;
    }

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/${editingEmployee._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee),
      });

      if (response.ok) {
        const updated = await response.json();
        setEmployees(
          employees
            .map((emp) => (emp._id === updated._id ? updated : emp))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setShowEditModal(false);
        setEditingEmployee(null);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee");
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEmployees(employees.filter((emp) => emp._id !== id));
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee");
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get weekly stitched pieces for an employee (case-insensitive match)
  const getWeeklyStitched = (employeeName) => {
    const nameLower = employeeName.toLowerCase();
    for (const [key, value] of Object.entries(weeklyStats)) {
      if (key.toLowerCase() === nameLower) {
        return value.stitched || 0;
      }
    }
    return 0;
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;

  return (
    <div className="employee-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">
            <FaUsers /> Employee Details
          </h1>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          <FaUserPlus />
          <span>Add Employee</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="employee-content">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total">
            <span className="card-value">{employees.length}</span>
            <span className="card-label">Total Employees</span>
          </div>
          <div className="summary-card active">
            <span className="card-value">{activeCount}</span>
            <span className="card-label">Active</span>
          </div>
          <div className="summary-card inactive">
            <span className="card-value">{inactiveCount}</span>
            <span className="card-label">Inactive</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Employee Cards Grid */}
        <div className="employee-grid">
          {filteredEmployees.length === 0 ? (
            <div className="no-data">
              <FaUsers style={{ fontSize: "48px", color: "#d4a574" }} />
              <p>No employees found</p>
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <div key={employee._id} className={`employee-card ${employee.status.toLowerCase()}`}>
                <div className="employee-card-header">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <h3 className="employee-name">{employee.name}</h3>
                    <span className={`status-badge ${employee.status.toLowerCase()}`}>
                      {employee.status}
                    </span>
                  </div>
                </div>

                <div className="employee-details">
                  {employee.phone && (
                    <div className="detail-row">
                      <FaPhone />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.address && (
                    <div className="detail-row">
                      <FaMapMarkerAlt />
                      <span>{employee.address}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <FaCalendarAlt />
                    <span>Joined: {new Date(employee.joinDate).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                {/* Weekly Stitching Stats */}
                <div className="weekly-stats">
                  <div className="stats-label">
                    <FaCut /> This Week
                  </div>
                  <div className="stats-value">
                    {getWeeklyStitched(employee.name)} pcs
                  </div>
                </div>

                <div className="employee-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => {
                      setEditingEmployee({ ...employee });
                      setShowEditModal(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteEmployee(employee._id, employee.name)}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <FaUserPlus /> Add New Employee
              </h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={newEmployee.address}
                  onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newEmployee.status}
                  onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddEmployee}>
                <FaCheck /> Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <FaEdit /> Edit Employee
              </h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, name: e.target.value })
                  }
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={editingEmployee.phone}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editingEmployee.address}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editingEmployee.status}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, status: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleUpdateEmployee}>
                <FaCheck /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDetails;
