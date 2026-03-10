import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaCut,
  FaPlus,
  FaSave,
  FaTrash,
  FaHistory,
  FaCheckCircle,
  FaBoxes,
  FaSearch,
  FaEye,
  FaTimes,
  FaUserTie,
  FaCalendarAlt,
} from "react-icons/fa";
import "./StitchingWork.css";

// Brand and Model Configuration
const BRAND_MODELS = {
  Sukra: ["RN", "RNS", "RNPS"],
  Compat: ["RN"],
  Romex: ["RN", "RNS"],
  Kings: ["RN", "RNS"],
  Acoste: ["RN", "RNS"],
  Zest: ["RN", "RNS"],
};

// Size options
const SIZES = [80, 85, 90, 95, 100];

function StitchingWork() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for tab query parameter
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || "create";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [workNumber, setWorkNumber] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [tailorName, setTailorName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [stitchedPieces, setStitchedPieces] = useState("");
  const [remarks, setRemarks] = useState("");

  // Entry items list
  const [workItems, setWorkItems] = useState([]);
  
  // History
  const [stitchingHistory, setStitchingHistory] = useState([]);
  
  // Stock
  const [stock, setStock] = useState({});
  
  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  
  // Employees for dropdown
  const [employees, setEmployees] = useState([]);

  // Available models based on selected brand
  const availableModels = brand ? BRAND_MODELS[brand] : [];

  // API Base URL
  const API_URL = "http://localhost:5000/api";

  // Generate Work Number from API
  useEffect(() => {
    const fetchWorkNumber = async () => {
      try {
        const response = await fetch(`${API_URL}/stitching/next-work`);
        const data = await response.json();
        setWorkNumber(data.workNumber);
      } catch (error) {
        console.error("Error fetching work number:", error);
        // Fallback to localStorage
        const lastWorkNumber = parseInt(localStorage.getItem('lastStitchingWorkNumber') || '0');
        const nextNumber = (lastWorkNumber + 1).toString().padStart(4, '0');
        setWorkNumber(`STW-2026-${nextNumber}`);
      }
    };
    fetchWorkNumber();
  }, []);

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/employees/active`);
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Load history and stock from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stitching history
        const historyResponse = await fetch(`${API_URL}/stitching`);
        const historyData = await historyResponse.json();
        setStitchingHistory(historyData);

        // Fetch stock
        const stockResponse = await fetch(`${API_URL}/stock`);
        const stockData = await stockResponse.json();
        setStock(stockData);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to localStorage
        const savedHistory = localStorage.getItem('stitchingHistory');
        if (savedHistory) {
          setStitchingHistory(JSON.parse(savedHistory));
        }
        const savedStock = localStorage.getItem('itemStock');
        if (savedStock) {
          setStock(JSON.parse(savedStock));
        }
      }
    };
    fetchData();
  }, []);

  // Reset model when brand changes
  useEffect(() => {
    setModel("");
  }, [brand]);

  // Get stock key for a brand-model-size combination
  const getStockKey = (brand, model, size) => `${brand}-${model}-${size}`;

  // Get available pending pieces for selected item
  const getAvailablePending = () => {
    if (!brand || !model || !size) return 0;
    const key = getStockKey(brand, model, size);
    return stock[key]?.pending || 0;
  };

  // Add item to list
  const handleAddItem = () => {
    if (!brand || !model || !size) {
      alert("Please fill Brand, Model and Size");
      return;
    }

    const stitched = parseInt(stitchedPieces) || 0;
    const available = getAvailablePending();

    if (stitched === 0) {
      alert("Please enter stitched pieces count");
      return;
    }

    if (stitched > available) {
      alert(`Cannot stitch more than available pending (${available} pieces)`);
      return;
    }

    const newItem = {
      id: Date.now(),
      brand,
      model,
      size,
      stitchedPieces: stitched,
      remarks,
    };

    setWorkItems([...workItems, newItem]);
    
    // Reset form
    setBrand("");
    setModel("");
    setSize("");
    setStitchedPieces("");
    setRemarks("");
  };

  // Remove item
  const handleRemoveItem = (id) => {
    setWorkItems(workItems.filter(item => item.id !== id));
  };

  // Calculate totals
  const totals = workItems.reduce((acc, item) => ({
    stitched: acc.stitched + item.stitchedPieces,
  }), { stitched: 0 });

  // Save entry and update stock
  const handleSaveEntry = async () => {
    if (!tailorName || tailorName.trim() === "") {
      alert("Please enter Tailor Name - it is mandatory");
      return;
    }

    if (workItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const entryData = {
      workNumber,
      workDate,
      tailorName,
      items: workItems,
      totals,
    };

    try {
      // Save stitching work to MongoDB
      const entryResponse = await fetch(`${API_URL}/stitching`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (!entryResponse.ok) throw new Error("Failed to save entry");

      // Update stock in MongoDB
      await fetch(`${API_URL}/stock/stitching`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: workItems }),
      });

      // Refresh history from API
      const historyResponse = await fetch(`${API_URL}/stitching`);
      const historyData = await historyResponse.json();
      setStitchingHistory(historyData);

      // Refresh stock from API
      const stockResponse = await fetch(`${API_URL}/stock`);
      const stockData = await stockResponse.json();
      setStock(stockData);

      // Get next work number
      const workResponse = await fetch(`${API_URL}/stitching/next-work`);
      const workData = await workResponse.json();
      setWorkNumber(workData.workNumber);

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setWorkItems([]);
      setTailorName("");
      setWorkDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error("Error saving entry:", error);
      
      // Fallback to localStorage
      const updatedStock = { ...stock };
      workItems.forEach(item => {
        const key = getStockKey(item.brand, item.model, item.size);
        if (!updatedStock[key]) {
          updatedStock[key] = {
            brand: item.brand,
            model: item.model,
            size: item.size,
            received: 0,
            stitched: 0,
            damaged: 0,
            pending: 0,
          };
        }
        updatedStock[key].stitched += item.stitchedPieces;
        updatedStock[key].pending = updatedStock[key].received - updatedStock[key].stitched;
      });

      setStock(updatedStock);
      localStorage.setItem('itemStock', JSON.stringify(updatedStock));

      const entry = {
        id: Date.now(),
        workNumber,
        workDate,
        tailorName,
        items: workItems,
        totals,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [entry, ...stitchingHistory];
      setStitchingHistory(updatedHistory);
      localStorage.setItem('stitchingHistory', JSON.stringify(updatedHistory));

      const lastWorkNumber = parseInt(localStorage.getItem('lastStitchingWorkNumber') || '0');
      localStorage.setItem('lastStitchingWorkNumber', (lastWorkNumber + 1).toString());
      const nextNumber = (lastWorkNumber + 2).toString().padStart(4, '0');
      setWorkNumber(`STW-2026-${nextNumber}`);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setWorkItems([]);
      setTailorName("");
      setWorkDate(new Date().toISOString().split('T')[0]);
    }
  };

  // View entry details
  const handleViewEntry = (entry) => {
    setViewEntry(entry);
    setShowViewModal(true);
  };

  // Filter history
  const filteredHistory = stitchingHistory.filter(entry => 
    entry.workNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tailorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.items.some(item => 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const availablePending = getAvailablePending();

  return (
    <div className="stitching-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">
            <FaCut /> Stitching Work
          </h1>
        </div>
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FaPlus /> New Entry
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> History
          </button>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="success-message">
          <FaCheckCircle />
          Stitching work saved successfully!
        </div>
      )}

      {/* Create Entry Tab */}
      {activeTab === 'create' && (
        <div className="entry-content">
          {/* Entry Form Card */}
          <div className="form-card">
            <div className="card-header">
              <h3><FaCut /> Work Details</h3>
              <span className="dc-number">Work No: {workNumber}</span>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label><FaCalendarAlt /> Work Date</label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label><FaUserTie /> Tailor Name *</label>
                  <select
                    value={tailorName}
                    onChange={(e) => setTailorName(e.target.value)}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-divider">
                <span>Add Items</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                    <option value="">Select Brand</option>
                    {Object.keys(BRAND_MODELS).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}>
                    <option value="">Select Model</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Size *</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="">Select Size</option>
                    {SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Show available pending for selected item */}
              {brand && model && size && (
                <div className="pending-info">
                  <span className="pending-label">Available Pending for {brand} {model} ({size}):</span>
                  <span className={`pending-value ${availablePending === 0 ? 'zero' : ''}`}>
                    {availablePending} pieces
                  </span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label><FaCut /> Stitched Pieces</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={stitchedPieces}
                    onChange={(e) => setStitchedPieces(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Remarks</label>
                  <input
                    type="text"
                    placeholder="Optional remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <button className="add-item-btn" onClick={handleAddItem}>
                <FaPlus /> Add Item
              </button>
            </div>
          </div>

          {/* Items Table */}
          {workItems.length > 0 && (
            <div className="items-card">
              <div className="card-header">
                <h3><FaBoxes /> Added Items ({workItems.length})</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Size</th>
                      <th>Stitched</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workItems.map((item) => (
                      <tr key={item.id}>
                        <td className="brand-cell">{item.brand}</td>
                        <td>{item.model}</td>
                        <td>{item.size}</td>
                        <td className="stitched-cell">{item.stitchedPieces}</td>
                        <td>{item.remarks || '-'}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total</strong></td>
                      <td className="stitched-cell"><strong>{totals.stitched}</strong></td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="save-section">
                <button className="save-btn" onClick={handleSaveEntry}>
                  <FaSave /> Save Stitching Work
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="history-header">
            <h3><FaHistory /> Stitching Work History</h3>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by Work No, Tailor, Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <FaCut />
              <p>No stitching work found</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Work Number</th>
                    <th>Date</th>
                    <th>Tailor</th>
                    <th>Items</th>
                    <th>Stitched</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="dc-cell">{entry.workNumber}</td>
                      <td>{new Date(entry.workDate).toLocaleDateString('en-IN')}</td>
                      <td>{entry.tailorName || '-'}</td>
                      <td>{entry.items.map(item => `${item.brand} ${item.model} (${item.size})`).join(', ')}</td>
                      <td className="stitched-cell">{entry.totals.stitched}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewEntry && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3><FaCut /> {viewEntry.workNumber}</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-date">
                Date: {new Date(viewEntry.workDate).toLocaleDateString('en-IN')}
              </p>
              <p className="modal-tailor">
                <FaUserTie /> Tailor: {viewEntry.tailorName}
              </p>
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Size</th>
                    <th>Stitched</th>
                  </tr>
                </thead>
                <tbody>
                  {viewEntry.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.brand}</td>
                      <td>{item.model}</td>
                      <td>{item.size}</td>
                      <td>{item.stitchedPieces}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{viewEntry.totals.stitched}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StitchingWork;
