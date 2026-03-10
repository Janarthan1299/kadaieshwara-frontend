import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowDown,
  FaPlus,
  FaSave,
  FaTrash,
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBoxes,
  FaSearch,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import "./InwardEntry.css";
import { API_URL } from "../config";

// Brand and Model Configuration (same as BillGeneration)
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

function InwardEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for tab query parameter
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || "create";
  const viewEntryId = queryParams.get('view');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [dcNumber, setDcNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [receivedPieces, setReceivedPieces] = useState("");
  const [damagedPieces, setDamagedPieces] = useState("");
  const [remarks, setRemarks] = useState("");

  // Entry items list
  const [entryItems, setEntryItems] = useState([]);
  
  // History
  const [inwardHistory, setInwardHistory] = useState([]);
  
  // Stock - maintains separate stock for each brand-model-size
  const [stock, setStock] = useState({});
  
  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);

  // Available models based on selected brand
  const availableModels = brand ? BRAND_MODELS[brand] : [];

  // Generate DC Number from API
  useEffect(() => {
    const fetchDcNumber = async () => {
      try {
        const response = await fetch(`${API_URL}/inward/next-dc`);
        const data = await response.json();
        setDcNumber(data.dcNumber);
      } catch (error) {
        console.error("Error fetching DC number:", error);
        // Fallback to localStorage
        const lastDcNumber = parseInt(localStorage.getItem('lastInwardDcNumber') || '0');
        const nextNumber = (lastDcNumber + 1).toString().padStart(4, '0');
        setDcNumber(`INW-2026-${nextNumber}`);
      }
    };
    fetchDcNumber();
  }, []);

  // Load history and stock from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inward history
        const historyResponse = await fetch(`${API_URL}/inward`);
        const historyData = await historyResponse.json();
        setInwardHistory(historyData);

        // Fetch stock
        const stockResponse = await fetch(`${API_URL}/stock`);
        const stockData = await stockResponse.json();
        setStock(stockData);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to localStorage
        const savedHistory = localStorage.getItem('inwardHistory');
        if (savedHistory) {
          setInwardHistory(JSON.parse(savedHistory));
        }
        const savedStock = localStorage.getItem('itemStock');
        if (savedStock) {
          setStock(JSON.parse(savedStock));
        }
      }
    };
    fetchData();
  }, []);

  // Handle view entry from URL parameter
  useEffect(() => {
    if (viewEntryId && inwardHistory.length > 0) {
      const entry = inwardHistory.find(e => e._id === viewEntryId);
      if (entry) {
        setViewEntry(entry);
        setShowViewModal(true);
      }
    }
  }, [viewEntryId, inwardHistory]);

  // Reset model when brand changes
  useEffect(() => {
    setModel("");
  }, [brand]);

  // Get stock key for a brand-model-size combination
  const getStockKey = (brand, model, size) => `${brand}-${model}-${size}`;

  // Add item to list
  const handleAddItem = () => {
    if (!brand || !model || !size) {
      alert("Please fill Brand, Model and Size");
      return;
    }

    const newItem = {
      id: Date.now(),
      brand,
      model,
      size,
      receivedPieces: parseInt(receivedPieces) || 0,
      damagedPieces: parseInt(damagedPieces) || 0,
      remarks,
    };

    setEntryItems([...entryItems, newItem]);
    
    // Reset form
    setBrand("");
    setModel("");
    setSize("");
    setReceivedPieces("");
    setDamagedPieces("");
    setRemarks("");
  };

  // Remove item
  const handleRemoveItem = (id) => {
    setEntryItems(entryItems.filter(item => item.id !== id));
  };

  // Calculate totals
  const totals = entryItems.reduce((acc, item) => ({
    received: acc.received + item.receivedPieces,
    damaged: acc.damaged + item.damagedPieces,
  }), { received: 0, damaged: 0 });

  // Save entry and update stock
  const handleSaveEntry = async () => {
    if (entryItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    // Calculate entry totals with pending
    const entryTotals = {
      received: totals.received,
      damaged: totals.damaged,
      pending: totals.received - totals.damaged,
    };

    const entryData = {
      dcNumber,
      receivedDate,
      items: entryItems,
      totals: entryTotals,
    };

    try {
      // Save inward entry to MongoDB
      const entryResponse = await fetch(`${API_URL}/inward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (!entryResponse.ok) throw new Error("Failed to save entry");

      // Update stock in MongoDB
      await fetch(`${API_URL}/stock/inward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: entryItems }),
      });

      // Refresh history from API
      const historyResponse = await fetch(`${API_URL}/inward`);
      const historyData = await historyResponse.json();
      setInwardHistory(historyData);

      // Refresh stock from API
      const stockResponse = await fetch(`${API_URL}/stock`);
      const stockData = await stockResponse.json();
      setStock(stockData);

      // Get next DC number
      const dcResponse = await fetch(`${API_URL}/inward/next-dc`);
      const dcData = await dcResponse.json();
      setDcNumber(dcData.dcNumber);

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setEntryItems([]);
      setReceivedDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error("Error saving entry:", error);
      
      // Fallback to localStorage
      const updatedStock = { ...stock };
      entryItems.forEach(item => {
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
        updatedStock[key].received += item.receivedPieces;
        updatedStock[key].damaged += item.damagedPieces;
        updatedStock[key].pending = updatedStock[key].received - updatedStock[key].damaged - updatedStock[key].stitched;
      });

      setStock(updatedStock);
      localStorage.setItem('itemStock', JSON.stringify(updatedStock));

      const entry = {
        id: Date.now(),
        dcNumber,
        receivedDate,
        items: entryItems,
        totals: entryTotals,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [entry, ...inwardHistory];
      setInwardHistory(updatedHistory);
      localStorage.setItem('inwardHistory', JSON.stringify(updatedHistory));

      const lastDcNumber = parseInt(localStorage.getItem('lastInwardDcNumber') || '0');
      localStorage.setItem('lastInwardDcNumber', (lastDcNumber + 1).toString());
      const nextNumber = (lastDcNumber + 2).toString().padStart(4, '0');
      setDcNumber(`INW-2026-${nextNumber}`);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setEntryItems([]);
      setReceivedDate(new Date().toISOString().split('T')[0]);
    }
  };

  // View entry details
  const handleViewEntry = (entry) => {
    setViewEntry(entry);
    setShowViewModal(true);
  };

  // Filter history
  const filteredHistory = inwardHistory.filter(entry => 
    entry.dcNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.items.some(item => 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="inward-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">
            <FaArrowDown /> Inward Entry
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
          Inward entry saved successfully!
        </div>
      )}

      {/* Create Entry Tab */}
      {activeTab === 'create' && (
        <div className="entry-content">
          {/* Entry Form Card */}
          <div className="form-card">
            <div className="card-header">
              <h3><FaBoxes /> Entry Details</h3>
              <span className="dc-number">DC No: {dcNumber}</span>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Received Date</label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                  />
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

              <div className="form-row">
                <div className="form-group">
                  <label><FaArrowDown /> Received Pieces</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter quantity"
                    value={receivedPieces}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setReceivedPieces(val);
                    }}
                    onWheel={(e) => e.target.blur()}
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label><FaExclamationTriangle /> Damaged Pieces</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter quantity"
                    value={damagedPieces}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setDamagedPieces(val);
                    }}
                    onWheel={(e) => e.target.blur()}
                    autoComplete="off"
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
          {entryItems.length > 0 && (
            <div className="items-card">
              <div className="card-header">
                <h3><FaBoxes /> Added Items ({entryItems.length})</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Size</th>
                      <th>Received</th>
                      <th>Damaged</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryItems.map((item) => (
                      <tr key={item.id}>
                        <td className="brand-cell">{item.brand}</td>
                        <td>{item.model}</td>
                        <td>{item.size}</td>
                        <td className="received-cell">{item.receivedPieces}</td>
                        <td className="damaged-cell">{item.damagedPieces}</td>
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
                      <td className="received-cell"><strong>{totals.received}</strong></td>
                      <td className="damaged-cell"><strong>{totals.damaged}</strong></td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="save-section">
                <button className="save-btn" onClick={handleSaveEntry}>
                  <FaSave /> Save Inward Entry
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
            <h3><FaHistory /> Inward Entry History</h3>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by DC No, Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <FaBoxes />
              <p>No inward entries found</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table>
                <thead>
                  <tr>
                    <th>DC Number</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Received</th>
                    <th>Damaged</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="dc-cell">{entry.dcNumber}</td>
                      <td>{new Date(entry.receivedDate).toLocaleDateString('en-IN')}</td>
                      <td>{entry.items.map(item => `${item.brand} ${item.model} (${item.size})`).join(', ')}</td>
                      <td className="received-cell">{entry.totals.received}</td>
                      <td className="damaged-cell">{entry.totals.damaged}</td>
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
              <h3><FaBoxes /> {viewEntry.dcNumber}</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-date">
                Date: {new Date(viewEntry.receivedDate).toLocaleDateString('en-IN')}
              </p>
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Size</th>
                    <th>Received</th>
                    <th>Damaged</th>
                  </tr>
                </thead>
                <tbody>
                  {viewEntry.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.brand}</td>
                      <td>{item.model}</td>
                      <td>{item.size}</td>
                      <td>{item.receivedPieces}</td>
                      <td>{item.damagedPieces}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{viewEntry.totals.received}</strong></td>
                    <td><strong>{viewEntry.totals.damaged}</strong></td>
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

export default InwardEntry;
