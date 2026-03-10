import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxes,
  FaSearch,
  FaWarehouse,
  FaArrowDown,
  FaCut,
  FaExclamationTriangle,
  FaClock,
  FaFilter,
  FaDownload,
  FaPrint,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import "./StockMaintenance.css";

function StockMaintenance() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stock, setStock] = useState({});
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Brand options
  const BRANDS = ["Sukra", "Compat", "Romex", "Kings", "Acoste", "Zest"];
  const MODELS = ["RN", "RNS", "RNPS"];

  // API Base URL
  const API_URL = "http://localhost:5000/api";

  // Load stock from API
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(`${API_URL}/stock`);
        const data = await response.json();
        setStock(data);
      } catch (error) {
        console.error("Error fetching stock:", error);
        // Fallback to localStorage
        const savedStock = localStorage.getItem('itemStock');
        if (savedStock) {
          setStock(JSON.parse(savedStock));
        }
      }
    };
    fetchStock();
  }, []);

  // Convert stock object to array for display
  const stockList = Object.values(stock);

  // Filter stock
  const filteredStock = stockList.filter(item => {
    const matchesSearch = 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.size.toString().includes(searchQuery);
    
    const matchesBrand = !filterBrand || item.brand === filterBrand;
    const matchesModel = !filterModel || item.model === filterModel;

    return matchesSearch && matchesBrand && matchesModel;
  });

  // Calculate totals
  const totals = filteredStock.reduce((acc, item) => ({
    received: acc.received + item.received,
    stitched: acc.stitched + item.stitched,
    damaged: acc.damaged + item.damaged,
    pending: acc.pending + item.pending,
  }), { received: 0, stitched: 0, damaged: 0, pending: 0 });

  // Export to CSV
  const handleExport = () => {
    const headers = ['Brand', 'Model', 'Size', 'Received', 'Stitched', 'Damaged', 'Pending'];
    const rows = filteredStock.map(item => [
      item.brand,
      item.model,
      item.size,
      item.received,
      item.stitched,
      item.damaged,
      item.pending
    ]);
    
    // Add totals row
    rows.push(['TOTAL', '', '', totals.received, totals.stitched, totals.damaged, totals.pending]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const lastNumber = parseInt(localStorage.getItem('lastStockReportNumber') || '0') + 1;
    localStorage.setItem('lastStockReportNumber', lastNumber.toString());
    
    a.href = url;
    a.download = `Stock_Report_${lastNumber.toString().padStart(3, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    const lastNumber = parseInt(localStorage.getItem('lastStockPrintNumber') || '0') + 1;
    const originalTitle = document.title;
    document.title = `Stock_Report_${lastNumber.toString().padStart(3, '0')}`;
    
    window.onafterprint = () => {
      localStorage.setItem('lastStockPrintNumber', lastNumber.toString());
      document.title = originalTitle;
      window.onafterprint = null;
    };
    
    window.print();
  };

  // Clear filters
  const clearFilters = () => {
    setFilterBrand("");
    setFilterModel("");
    setShowFilterModal(false);
  };

  // Refresh stock from API
  const refreshStock = async () => {
    try {
      const response = await fetch(`${API_URL}/stock`);
      const data = await response.json();
      setStock(data);
    } catch (error) {
      console.error("Error refreshing stock:", error);
      // Fallback to localStorage
      const savedStock = localStorage.getItem('itemStock');
      if (savedStock) {
        setStock(JSON.parse(savedStock));
      }
    }
  };

  // Recalculate stock from history (sync function)
  const handleSyncStock = async () => {
    if (window.confirm('This will recalculate all stock from Inward Entry and Stitching Work history. Continue?')) {
      try {
        // Fetch inward history from API
        const inwardResponse = await fetch(`${API_URL}/inward`);
        const inwardHistory = await inwardResponse.json();

        // Fetch stitching history from API
        const stitchingResponse = await fetch(`${API_URL}/stitching`);
        const stitchingHistory = await stitchingResponse.json();

        const newStock = {};
        
        // Process Inward History
        inwardHistory.forEach(entry => {
          entry.items.forEach(item => {
            const key = `${item.brand}-${item.model}-${item.size}`;
            if (!newStock[key]) {
              newStock[key] = {
                brand: item.brand,
                model: item.model,
                size: item.size,
                received: 0,
                stitched: 0,
                damaged: 0,
                pending: 0,
              };
            }
            newStock[key].received += item.receivedPieces || 0;
            newStock[key].damaged += item.damagedPieces || 0;
          });
        });

        // Process Stitching History
        stitchingHistory.forEach(entry => {
          entry.items.forEach(item => {
            const key = `${item.brand}-${item.model}-${item.size}`;
            if (!newStock[key]) {
              newStock[key] = {
                brand: item.brand,
                model: item.model,
                size: item.size,
                received: 0,
                stitched: 0,
                damaged: 0,
                pending: 0,
              };
            }
            newStock[key].stitched += item.stitchedPieces || 0;
            newStock[key].damaged += item.damagedPieces || 0;
          });
        });

        // Calculate pending for each item
        Object.keys(newStock).forEach(key => {
          newStock[key].pending = newStock[key].received - newStock[key].damaged - newStock[key].stitched;
        });

        // Sync to MongoDB
        await fetch(`${API_URL}/stock/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockData: newStock }),
        });

        setStock(newStock);
        alert('Stock has been synced successfully from history!');
      } catch (error) {
        console.error("Error syncing stock:", error);
        alert('Error syncing stock. Please try again.');
      }
    }
  };

  

  return (
    <div className="stock-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">
            <FaWarehouse /> Stock Maintenance
          </h1>
        </div>
        <div className="header-actions">
          <button 
            className="stock-action-btn"
            onClick={refreshStock}
          >
            <FaSync /> Refresh
          </button>
          <button 
            className="stock-action-btn sync-btn"
            onClick={handleSyncStock}
          >
            <FaSync /> Sync Stock
          </button>
          <button 
            className="stock-action-btn"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter /> Filter
          </button>
          <button 
            className="stock-action-btn"
            onClick={handleExport}
          >
            <FaDownload /> Export
          </button>
          <button 
            className="stock-action-btn"
            onClick={handlePrint}
          >
            <FaPrint /> Print
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card received">
          <div className="card-icon">
            <FaArrowDown />
          </div>
          <div className="card-content">
            <h3>Total Received</h3>
            <p className="card-value">{totals.received.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card stitched">
          <div className="card-icon">
            <FaCut />
          </div>
          <div className="card-content">
            <h3>Total Stitched</h3>
            <p className="card-value">{totals.stitched.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card damaged">
          <div className="card-icon">
            <FaExclamationTriangle />
          </div>
          <div className="card-content">
            <h3>Total Damaged</h3>
            <p className="card-value">{totals.damaged.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="card-icon">
            <FaClock />
          </div>
          <div className="card-content">
            <h3>Pending Work</h3>
            <p className="card-value">{totals.pending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="stock-content">
        <div className="stock-header">
          <h3><FaBoxes /> Item-wise Stock ({filteredStock.length} items)</h3>
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by Brand, Model, Size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Active Filters */}
        {(filterBrand || filterModel) && (
          <div className="active-filters">
            <span>Active Filters:</span>
            {filterBrand && (
              <span className="filter-tag">
                Brand: {filterBrand}
                <FaTimes onClick={() => setFilterBrand("")} />
              </span>
            )}
            {filterModel && (
              <span className="filter-tag">
                Model: {filterModel}
                <FaTimes onClick={() => setFilterModel("")} />
              </span>
            )}
            <button className="clear-filters" onClick={clearFilters}>Clear All</button>
          </div>
        )}

        {filteredStock.length === 0 ? (
          <div className="empty-state">
            <FaBoxes />
            <p>No stock data available</p>
            <span>Add inward entries to see stock here</span>
          </div>
        ) : (
          <div className="stock-table-container">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Size</th>
                  <th>
                    <span className="th-icon"><FaArrowDown /></span>
                    Received
                  </th>
                  <th>
                    <span className="th-icon"><FaCut /></span>
                    Stitched
                  </th>
                  <th>
                    <span className="th-icon"><FaExclamationTriangle /></span>
                    Damaged
                  </th>
                  <th>
                    <span className="th-icon"><FaClock /></span>
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="brand-cell">{item.brand}</td>
                    <td>{item.model}</td>
                    <td>{item.size}</td>
                    <td className="received-cell">{item.received.toLocaleString()}</td>
                    <td className="stitched-cell">{item.stitched.toLocaleString()}</td>
                    <td className="damaged-cell">{item.damaged.toLocaleString()}</td>
                    <td className="pending-cell">{item.pending.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4"><strong>Grand Total</strong></td>
                  <td className="received-cell"><strong>{totals.received.toLocaleString()}</strong></td>
                  <td className="stitched-cell"><strong>{totals.stitched.toLocaleString()}</strong></td>
                  <td className="damaged-cell"><strong>{totals.damaged.toLocaleString()}</strong></td>
                  <td className="pending-cell"><strong>{totals.pending.toLocaleString()}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content filter-modal">
            <div className="modal-header">
              <h3><FaFilter /> Filter Stock</h3>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="filter-group">
                <label>Brand</label>
                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                  <option value="">All Brands</option>
                  {BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Model</label>
                <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                  <option value="">All Models</option>
                  {MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={clearFilters}>Clear</button>
              <button className="btn-primary" onClick={() => setShowFilterModal(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockMaintenance;
