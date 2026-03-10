import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Reports.css";
import { API_URL } from "../config";
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaCut,
  FaChartBar,
  FaSearch,
  FaPrint,
  FaDownload,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("damaged");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [pendingWorkData, setPendingWorkData] = useState({
    brandSummary: [],
    totals: { totalReceived: 0, totalStitched: 0, totalPending: 0, totalBrands: 0 }
  });
  const [searchPending, setSearchPending] = useState("");
  const [damagedPiecesData, setDamagedPiecesData] = useState({
    records: [],
    totals: { totalDamaged: 0, totalDeduction: 0, thisMonthDamaged: 0, thisMonthDeduction: 0, damageRate: '0.00' }
  });
  const [searchDamaged, setSearchDamaged] = useState("");

  // Fetch pending work data
  useEffect(() => {
    const fetchPendingWork = async () => {
      try {
        const response = await fetch(`${API_URL}/stitching/pending-work`);
        if (response.ok) {
          const data = await response.json();
          setPendingWorkData(data);
        }
      } catch (error) {
        console.error("Error fetching pending work:", error);
      }
    };
    fetchPendingWork();
  }, []);

  // Fetch damaged pieces data
  useEffect(() => {
    const fetchDamagedPieces = async () => {
      try {
        const response = await fetch(`${API_URL}/stitching/damaged-pieces`);
        if (response.ok) {
          const data = await response.json();
          setDamagedPiecesData(data);
        }
      } catch (error) {
        console.error("Error fetching damaged pieces:", error);
      }
    };
    fetchDamagedPieces();
  }, []);

  // Filter pending work data based on search
  const filteredBrandSummary = pendingWorkData.brandSummary.filter(brand =>
    brand.brand.toLowerCase().includes(searchPending.toLowerCase())
  );

  // Filter damaged pieces data based on search
  const filteredDamagedRecords = damagedPiecesData.records.filter(record =>
    record.itemType.toLowerCase().includes(searchDamaged.toLowerCase()) ||
    record.id.toLowerCase().includes(searchDamaged.toLowerCase()) ||
    record.reason.toLowerCase().includes(searchDamaged.toLowerCase())
  );

  // Get current data based on active tab
  const getCurrentData = () => {
    switch(activeTab) {
      case 'damaged': return damagedPiecesData.records;
      case 'pending': return pendingWorkData.brandSummary;
      default: return [];
    }
  };

  // Get next report number from localStorage - separate for each type
  const getNextReportNumber = (type) => {
    const key = `lastReportNumber_${type}`;
    const lastNumber = parseInt(localStorage.getItem(key) || '0');
    return (lastNumber + 1).toString().padStart(3, '0');
  };

  // Save report number after confirmed save
  const saveReportNumber = (type) => {
    const key = `lastReportNumber_${type}`;
    const lastNumber = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (lastNumber + 1).toString());
  };

  // Export to CSV
  const handleExport = () => {
    const data = getCurrentData();
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(item => Object.values(item).join(",")).join("\n");
    const csv = headers + "\n" + rows;
    
    const tabName = activeTab === 'damaged' ? 'Damaged' : 'Pending';
    const reportNumber = getNextReportNumber(tabName);
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_${tabName}_${reportNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Increment counter after export
    saveReportNumber(tabName);
  };

  // Print report
  const handlePrint = () => {
    const tabName = activeTab === 'damaged' ? 'Damaged' : 'Pending';
    const reportNumber = getNextReportNumber(tabName);
    const originalTitle = document.title;
    document.title = `Report_${tabName}_${reportNumber}`;
    
    window.onafterprint = () => {
      saveReportNumber(tabName);
      document.title = originalTitle;
      window.onafterprint = null;
    };
    
    window.print();
  };

  // Apply filter
  const handleApplyFilter = () => {
    // Filter logic would go here
    setShowFilterModal(false);
    alert(`Filter applied: ${filterDateFrom || 'Any'} to ${filterDateTo || 'Any'}, Type: ${filterType}`);
  };

  return (
    <div className="reports-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title"><FaChartBar /> Reports</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={() => setShowFilterModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FaFilter style={{ width: '14px', height: '14px' }} />
            Filter
          </button>
          <button 
            type="button"
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FaDownload style={{ width: '14px', height: '14px' }} />
            Export
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FaPrint style={{ width: '14px', height: '14px' }} />
            Print
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'damaged' ? 'active' : ''}`}
          onClick={() => setActiveTab('damaged')}
        >
          <FaExclamationTriangle />
          <span>Damaged Pieces</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FaCut />
          <span>Pending Stitching Work</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="reports-content">
        {/* Damaged Pieces Tab */}
        {activeTab === 'damaged' && (
          <div className="report-section">
            <div className="section-header">
              <h2><FaExclamationTriangle className="warning-icon" /> Damaged Pieces Report</h2>
              <div className="search-box">
                <FaSearch />
                <input 
                  type="text" 
                  placeholder="Search damaged pieces..." 
                  value={searchDamaged}
                  onChange={(e) => setSearchDamaged(e.target.value)}
                />
              </div>
            </div>
            
            <div className="summary-cards">
              <div className="summary-card red">
                <span className="card-value">{damagedPiecesData.totals.thisMonthDamaged}</span>
                <span className="card-label">Total Damaged (This Month)</span>
              </div>
              <div className="summary-card orange">
                <span className="card-value">₹{damagedPiecesData.totals.thisMonthDeduction}</span>
                <span className="card-label">Total Deduction</span>
              </div>
              <div className="summary-card blue">
                <span className="card-value">{damagedPiecesData.totals.damageRate}%</span>
                <span className="card-label">Damage Rate</span>
              </div>
            </div>

            {filteredDamagedRecords.length === 0 ? (
              <div className="no-data-message">
                <FaExclamationTriangle style={{ fontSize: '48px', color: '#d4a574', marginBottom: '16px' }} />
                <p>No damaged pieces recorded</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Damaged pieces from inward and stitching entries will appear here</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Item Type</th>
                      <th>Quantity</th>
                      <th>Reason</th>
                      <th>Deduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDamagedRecords.map((item, index) => (
                      <tr key={index}>
                        <td className="id-cell">{item.id}</td>
                        <td>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className={`source-badge ${item.source.toLowerCase()}`}>{item.source}</span></td>
                        <td>{item.itemType}</td>
                        <td className="quantity-cell">{item.quantity} pcs</td>
                        <td>{item.reason}</td>
                        <td className="deduction-cell">₹{item.deduction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Stitching Work Tab */}
        {activeTab === 'pending' && (
          <div className="report-section">
            <div className="section-header">
              <h2><FaCut className="cut-icon" /> Pending Stitching Work</h2>
              <div className="search-box">
                <FaSearch />
                <input 
                  type="text" 
                  placeholder="Search brands..." 
                  value={searchPending}
                  onChange={(e) => setSearchPending(e.target.value)}
                />
              </div>
            </div>
            
            <div className="summary-cards">
              <div className="summary-card orange">
                <span className="card-value">{pendingWorkData.totals.totalPending}</span>
                <span className="card-label">Total Pending Pieces</span>
              </div>
              <div className="summary-card blue">
                <span className="card-value">{pendingWorkData.totals.totalStitched}</span>
                <span className="card-label">Total Stitched</span>
              </div>
              <div className="summary-card green">
                <span className="card-value">{pendingWorkData.totals.totalBrands}</span>
                <span className="card-label">Active Brands</span>
              </div>
            </div>

            {/* Brand Cards - Each brand as separate card */}
            {filteredBrandSummary.length === 0 ? (
              <div className="no-data-message">
                <FaCut style={{ fontSize: '48px', color: '#d4a574', marginBottom: '16px' }} />
                <p>No stitching work data found</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Add inward entries to see pending work</p>
              </div>
            ) : (
              <div className="brand-cards-grid">
                {filteredBrandSummary.map((brand, index) => {
                  const brandProgress = brand.totalReceived > 0 
                    ? Math.round((brand.totalStitched / brand.totalReceived) * 100) 
                    : 0;
                  return (
                    <div key={index} className="brand-work-card">
                      <div className="brand-card-header">
                        <h3 className="brand-card-title">{brand.brand}</h3>
                        <div className="brand-card-progress">
                          <span className="progress-percent">{brandProgress}%</span>
                          <span className="progress-label">Complete</span>
                        </div>
                      </div>
                      
                      <div className="brand-card-summary three-cols">
                        <div className="summary-item received">
                          <span className="summary-value">{brand.totalReceived}</span>
                          <span className="summary-label">Total</span>
                        </div>
                        <div className="summary-item stitched">
                          <span className="summary-value">{brand.totalStitched}</span>
                          <span className="summary-label">Stitched</span>
                        </div>
                        <div className="summary-item pending">
                          <span className="summary-value">{brand.totalPending}</span>
                          <span className="summary-label">Pending</span>
                        </div>
                      </div>

                      <div className="brand-card-sizes">
                        <div className="sizes-header">
                          <span>Size</span>
                          <span>Stitched</span>
                          <span>Pending</span>
                        </div>
                        {brand.sizes.map((sizeData, sIdx) => (
                          <div key={sIdx} className="size-row">
                            <span className="size-number">{sizeData.size}</span>
                            <span className="size-stitched">{sizeData.stitched}</span>
                            <span className={`size-pending ${sizeData.pending > 0 ? 'has-pending' : ''}`}>
                              {sizeData.pending}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="brand-card-footer">
                        <div className="footer-progress-bar">
                          <div 
                            className="footer-progress-fill"
                            style={{ 
                              width: `${brandProgress}%`,
                              backgroundColor: brandProgress >= 80 ? '#10b981' : brandProgress >= 50 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(30, 58, 95, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 25px 60px rgba(30, 58, 95, 0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)',
              borderBottom: '3px solid #d4a574'
            }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>
                <FaFilter style={{ marginRight: '10px', color: '#d4a574' }} />
                Filter Reports
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e3a5f' }}>
                  Date From
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(212, 165, 116, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e3a5f' }}>
                  Date To
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(212, 165, 116, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e3a5f' }}>
                  Item Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(212, 165, 116, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="Inner Type A">Inner Type A</option>
                  <option value="Inner Type B">Inner Type B</option>
                  <option value="Inner Type C">Inner Type C</option>
                </select>
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              background: '#f8f5f0',
              borderTop: '1px solid rgba(212, 165, 116, 0.15)'
            }}>
              <button
                onClick={() => setShowFilterModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilter}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #d4a574, #c9956c)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
