import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import CompanyDetails from "./components/CompanyDetails";
import BillGeneration from "./components/BillGeneration";
import InwardEntry from "./components/InwardEntry";
import StockMaintenance from "./components/StockMaintenance";
import StitchingWork from "./components/StitchingWork";
import EmployeeDetails from "./components/EmployeeDetails";
import "./App.css";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-details"
          element={
            <ProtectedRoute>
              <CompanyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bill-generation"
          element={
            <ProtectedRoute>
              <BillGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inward-entry"
          element={
            <ProtectedRoute>
              <InwardEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-maintenance"
          element={
            <ProtectedRoute>
              <StockMaintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stitching-work"
          element={
            <ProtectedRoute>
              <StitchingWork />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-details"
          element={
            <ProtectedRoute>
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />
        {/* Route aliases for backward compatibility */}
        <Route path="/stock" element={<Navigate to="/stock-maintenance" replace />} />
        <Route path="/stitching" element={<Navigate to="/stitching-work" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
