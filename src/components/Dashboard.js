import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  FaBuilding,
  FaArrowDown,
  FaBoxes,
  FaCut,
  FaFileInvoiceDollar,
  FaChartBar,
  FaSignOutAlt,
  FaUserCircle,
  FaSearch,
  FaChevronRight,
  FaChevronDown,
  FaClipboardList,
  FaExclamationTriangle,
  FaClock,
  FaArrowUp,
  FaArrowRight,
  FaEye,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaSync,
  FaLock,
  FaTimes,
  FaExchangeAlt,
} from "react-icons/fa";
import { API_URL } from "../config";

function Dashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [stockTotals, setStockTotals] = useState({ received: 0, stitched: 0, damaged: 0, pending: 0 });
  const [stockData, setStockData] = useState({});
  const [inwardHistory, setInwardHistory] = useState([]);
  const [stitchingHistory, setStitchingHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [todayTotals, setTodayTotals] = useState({ received: 0, stitched: 0, damaged: 0 });
  
  // Account switcher states
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");

  // Sync stock from all entries
  const handleSyncStock = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_URL}/stock/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      console.log("Sync result:", result);
      
      // Refresh stock data after sync
      const stockResponse = await fetch(`${API_URL}/stock`);
      const stockDataResponse = await stockResponse.json();
      setStockData(stockDataResponse);
      
      const totals = Object.values(stockDataResponse).reduce((acc, item) => ({
        received: acc.received + (item.received || 0),
        stitched: acc.stitched + (item.stitched || 0),
        damaged: acc.damaged + (item.damaged || 0),
        pending: acc.pending + (item.pending || 0),
      }), { received: 0, stitched: 0, damaged: 0, pending: 0 });
      setStockTotals(totals);
      
      alert(`Stock synced successfully! Processed ${result.entriesProcessed?.inward || 0} inward entries.`);
    } catch (error) {
      console.error("Error syncing stock:", error);
      alert("Failed to sync stock. Please try again.");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stock totals
        const stockResponse = await fetch(`${API_URL}/stock`);
        const stockDataResponse = await stockResponse.json();
        setStockData(stockDataResponse);
        
        const totals = Object.values(stockDataResponse).reduce((acc, item) => ({
          received: acc.received + (item.received || 0),
          stitched: acc.stitched + (item.stitched || 0),
          damaged: acc.damaged + (item.damaged || 0),
          pending: acc.pending + (item.pending || 0),
        }), { received: 0, stitched: 0, damaged: 0, pending: 0 });
        setStockTotals(totals);

        // Fetch inward history
        const inwardResponse = await fetch(`${API_URL}/inward/recent`);
        const inwardData = await inwardResponse.json();
        setInwardHistory(inwardData);

        // Fetch stitching history
        const stitchingResponse = await fetch(`${API_URL}/stitching/recent`);
        const stitchingData = await stitchingResponse.json();
        setStitchingHistory(stitchingData);

        // Fetch today's data
        const todayInwardResponse = await fetch(`${API_URL}/inward/today`);
        const todayInwardData = await todayInwardResponse.json();
        
        const todayStitchingResponse = await fetch(`${API_URL}/stitching/today`);
        const todayStitchingData = await todayStitchingResponse.json();
        
        setTodayTotals({
          received: todayInwardData.totals?.received || 0,
          stitched: todayStitchingData.totals?.stitched || 0,
          damaged: (todayInwardData.totals?.damaged || 0) + (todayStitchingData.totals?.damaged || 0),
        });

      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to localStorage
        const savedStock = JSON.parse(localStorage.getItem('itemStock') || '{}');
        setStockData(savedStock);
        const totals = Object.values(savedStock).reduce((acc, item) => ({
          received: acc.received + (item.received || 0),
          stitched: acc.stitched + (item.stitched || 0),
          damaged: acc.damaged + (item.damaged || 0),
          pending: acc.pending + (item.pending || 0),
        }), { received: 0, stitched: 0, damaged: 0, pending: 0 });
        setStockTotals(totals);

        setInwardHistory(JSON.parse(localStorage.getItem('inwardHistory') || '[]'));
        setStitchingHistory(JSON.parse(localStorage.getItem('stitchingHistory') || '[]'));
      }
    };
    fetchData();
  }, []);

  // Fetch accounts list
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/list`);
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search in stock data
    Object.values(stockData).forEach(item => {
      if (
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.size?.toString().includes(query)
      ) {
        results.push({
          type: "Stock",
          title: `${item.brand} ${item.model} - Size ${item.size}`,
          detail: `Received: ${item.received} | Stitched: ${item.stitched} | Pending: ${item.pending}`,
          route: "/stock-maintenance"
        });
      }
    });

    // Search in inward history
    inwardHistory.forEach(entry => {
      if (
        entry.dcNumber?.toLowerCase().includes(query) ||
        entry.items?.some(i => 
          i.brand?.toLowerCase().includes(query) || 
          i.model?.toLowerCase().includes(query)
        )
      ) {
        results.push({
          type: "Inward Entry",
          title: entry.dcNumber,
          detail: `${entry.totals?.received || 0} pieces - ${new Date(entry.receivedDate).toLocaleDateString('en-IN')}`,
          route: "/inward-entry"
        });
      }
    });

    // Search in stitching history
    stitchingHistory.forEach(entry => {
      if (
        entry.workNumber?.toLowerCase().includes(query) ||
        entry.tailorName?.toLowerCase().includes(query) ||
        entry.items?.some(i => 
          i.brand?.toLowerCase().includes(query) || 
          i.model?.toLowerCase().includes(query)
        )
      ) {
        results.push({
          type: "Stitching Work",
          title: entry.workNumber,
          detail: `${entry.totals?.stitched || 0} pieces - ${entry.tailorName || 'No tailor'}`,
          route: "/stitching-work"
        });
      }
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  }, [searchQuery, stockData, inwardHistory, stitchingHistory]);

  // Handle account switch
  const handleAccountClick = (account) => {
    if (account.email === admin.email) {
      setShowAccountDropdown(false);
      return;
    }
    setSelectedAccount(account);
    setSwitchPassword("");
    setSwitchError("");
    setShowPasswordModal(true);
    setShowAccountDropdown(false);
  };

  const handleSwitchAccount = async () => {
    if (!switchPassword) {
      setSwitchError("Please enter password");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedAccount.email,
          password: switchPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("admin", JSON.stringify(data.admin));
        setShowPasswordModal(false);
        window.location.reload();
      } else {
        setSwitchError(data.message || "Incorrect password");
      }
    } catch (error) {
      setSwitchError("Failed to switch account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/");
  };

  const modules = [
    { name: "Company Details", icon: <FaBuilding />, color: "#6366f1", desc: "Manage company information" },
    { name: "Inward Entry", icon: <FaArrowDown />, color: "#10b981", desc: "Receive pieces from Ramraj" },
    { name: "Stock Maintenance", icon: <FaBoxes />, color: "#8b5cf6", desc: "Manage inventory levels" },
    { name: "Stitching Work", icon: <FaCut />, color: "#ec4899", desc: "Track stitching progress" },
    { name: "Bill Generation", icon: <FaFileInvoiceDollar />, color: "#14b8a6", desc: "Create and manage bills" },
    { name: "Employee Details", icon: <FaUserCircle />, color: "#f97316", desc: "Manage employee information" },
    { name: "Reports", icon: <FaChartBar />, color: "#06b6d4", desc: "Damaged, Payment & Pending Work" },
  ];

  // Format recent inward entries for display
  const recentInwardEntries = inwardHistory.slice(0, 5).map(entry => ({
    id: entry.dcNumber,
    _id: entry._id,
    items: entry.items.map(i => `${i.brand} ${i.model} (${i.size})`).join(', '),
    quantity: `${entry.totals.received} pcs`,
    date: new Date(entry.receivedDate).toLocaleDateString('en-IN'),
    status: "Received",
    originalEntry: entry
  }));

  const stats = [
    { label: "Pieces Received", value: stockTotals.received.toLocaleString(), icon: <FaArrowDown />, change: `From ${inwardHistory.length} entries`, positive: true },
    { label: "Pieces Stitched", value: stockTotals.stitched.toLocaleString(), icon: <FaCut />, change: `From ${stitchingHistory.length} entries`, positive: true },
    { label: "Pending Stitching", value: stockTotals.pending.toLocaleString(), icon: <FaClock />, change: "Available to stitch", positive: stockTotals.pending > 0 },
    { label: "Damaged", value: stockTotals.damaged.toLocaleString(), icon: <FaExclamationTriangle />, change: "Total damaged pieces", positive: false },
  ];

  

  // Work Status Summary - Today's data only
  const todayTotal = todayTotals.received + todayTotals.stitched + todayTotals.damaged;
  const workStatus = [
    { name: "Pieces Received Today", current: todayTotals.received, total: todayTotal || 1, unit: "pieces", route: "/inward-entry?tab=history" },
    { name: "Stitched Today", current: todayTotals.stitched, total: todayTotal || 1, unit: "pieces", route: "/stitching-work?tab=history" },
    { name: "Damaged Today", current: todayTotals.damaged, total: todayTotal || 1, unit: "pieces", route: "/reports" },
  ];

  

  

  // Quick Action Buttons
  const quickActions = [
    { label: "Received Pieces", icon: <FaArrowDown />, color: "#10b981", route: "/inward-entry?tab=history" },
    { label: "Log Stitching", icon: <FaCut />, color: "#6366f1", route: "/stitching-work?tab=history" },
    { label: "View Reports", icon: <FaChartBar />, color: "#06b6d4", route: "/reports" },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Received': return '#10b981';
      case 'Counting': return '#f59e0b';
      case 'Returned': return '#6366f1';
      case 'Damaged': return '#ef4444';
      case 'Pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logo.png" alt="Kadaieswara Tex" className="logo-image" />
            <div className="logo-text">
              <h2>KADAIESWARA TEX</h2>
              <span>Stitching Unit</span>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-title">MAIN MENU</span>
            {modules.map((module, index) => (
              <button 
                key={index} 
                type="button" 
                className="nav-item" 
                style={{'--accent-color': module.color}}
                onClick={(e) => {
                  e.preventDefault();
                  if (module.name === 'Reports') {
                    navigate('/reports');
                  } else if (module.name === 'Company Details') {
                    navigate('/company-details');
                  } else if (module.name === 'Bill Generation') {
                    navigate('/bill-generation');
                  } else if (module.name === 'Inward Entry') {
                    navigate('/inward-entry');
                  } else if (module.name === 'Stock Maintenance') {
                    navigate('/stock-maintenance');
                  } else if (module.name === 'Stitching Work') {
                    navigate('/stitching-work');
                  } else if (module.name === 'Employee Details') {
                    navigate('/employee-details');
                  }
                }}
              >
                <span className="nav-icon">{module.icon}</span>
                <span className="nav-label">{module.name}</span>
                <FaChevronRight className="nav-arrow" />
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-sidebar-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search stock, materials, entries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="search-result-item"
                    onClick={() => {
                      navigate(result.route);
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                  >
                    <span className="result-type">{result.type}</span>
                    <span className="result-title">{result.title}</span>
                    <span className="result-detail">{result.detail}</span>
                  </div>
                ))}
              </div>
            )}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="search-results-dropdown">
                <div className="search-result-item no-results">
                  No results found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <div className="user-profile-wrapper">
              <div 
                className="user-profile" 
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <FaUserCircle className="user-avatar" />
                <div className="user-info">
                  <span className="user-name">{admin.username || "Admin"}</span>
                  <span className="user-role">Administrator</span>
                </div>
                <FaChevronDown className={`dropdown-arrow ${showAccountDropdown ? 'open' : ''}`} />
              </div>
              
              {/* Account Switcher Dropdown */}
              {showAccountDropdown && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowAccountDropdown(false)}></div>
                  <div className="account-dropdown">
                    <div className="dropdown-header">
                      <FaExchangeAlt /> Switch Account
                    </div>
                    {accounts.length === 0 ? (
                      <div className="account-item">
                        <span style={{color: '#64748b', fontSize: '13px'}}>Loading accounts...</span>
                      </div>
                    ) : (
                      accounts.map((account, index) => (
                        <div 
                          key={index} 
                          className={`account-item ${account.email === admin.email ? 'current' : ''}`}
                          onClick={() => handleAccountClick(account)}
                        >
                          <FaUserCircle className="account-avatar" />
                          <div className="account-info">
                            <span className="account-name">{account.username}</span>
                            <span className="account-email">{account.email}</span>
                          </div>
                          {account.email === admin.email && (
                            <span className="current-badge">Current</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Password Modal for Account Switch */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="password-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <FaTimes />
              </button>
              <div className="modal-header">
                <FaLock />
                <h3>Enter Password</h3>
              </div>
              <p className="modal-subtitle">
                Switch to <strong>{selectedAccount?.username}</strong>
              </p>
              <div className="modal-body">
                <input 
                  type="password" 
                  placeholder="Enter password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSwitchAccount()}
                  autoFocus
                />
                {switchError && <span className="error-message">{switchError}</span>}
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button className="switch-btn" onClick={handleSwitchAccount}>
                  Switch Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <main className="dashboard-main">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h1>Welcome back, Govindaraj! 👋</h1>
              <p>Here's your stitching work overview.</p>
            </div>
            <div className="quick-action-buttons">
              {quickActions.map((action, index) => (
                <button 
                  key={index} 
                  className="quick-action-btn" 
                  style={{'--btn-color': action.color}}
                  onClick={() => action.route && navigate(action.route)}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
              <button 
                className="quick-action-btn" 
                style={{'--btn-color': '#f59e0b'}}
                onClick={handleSyncStock}
                disabled={isSyncing}
              >
                <FaSync className={isSyncing ? 'spinning' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Stock'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <span className="stat-label">{stat.label}</span>
                  <h3 className="stat-value">{stat.value}</h3>
                  <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                    {stat.positive ? <FaArrowUp /> : <FaArrowDown />}
                    {stat.change} from last month
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="dashboard-main-grid">
            {/* Left Column */}
            <div className="dashboard-left">
              {/* Recent Inward Entries Table (from Ramraj) */}
              <div className="orders-section card-section">
                <div className="section-header">
                  <h2><FaArrowDown /> Pieces Received from Ramraj</h2>
                  <button type="button" className="view-all" onClick={() => navigate('/inward-entry?tab=history')}>View All <FaArrowRight /></button>
                </div>
                <div className="orders-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Entry ID</th>
                        <th>Items</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInwardEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#888'}}>
                            No inward entries yet. Go to Inward Entry to add pieces.
                          </td>
                        </tr>
                      ) : (
                        recentInwardEntries.map((entry, index) => (
                          <tr key={index}>
                            <td className="order-id">{entry.id}</td>
                            <td>{entry.items}</td>
                            <td>{entry.quantity}</td>
                            <td className="date">{entry.date}</td>
                            <td>
                              <span className="status-badge" style={{background: getStatusColor(entry.status)}}>
                                {entry.status}
                              </span>
                            </td>
                            <td className="actions">
                              <button 
                                className="action-btn view" 
                                onClick={() => navigate(`/inward-entry?tab=history&view=${entry._id}`)}
                                title="View Entry"
                              >
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="dashboard-right">
              {/* Work Status Summary */}
              {/* Work Status */}
              <div className="alerts-section card-section">
                <div className="section-header">
                  <h2><FaClipboardList className="info-icon" /> Work Status</h2>
                  <span className="alert-count">{formatDate(currentTime)}</span>
                </div>
                <div className="alerts-list">
                  {workStatus.map((item, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-info">
                        <span className="alert-name">{item.name}</span>
                        <span className="alert-stock">
                          <span className="current">{item.current}</span> {item.unit}
                        </span>
                      </div>
                      <div className="alert-bar">
                        <div 
                          className="alert-progress" 
                          style={{width: `${todayTotal > 0 ? (item.current / todayTotal) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <button 
                        className="restock-btn" 
                        onClick={() => navigate(item.route)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                  {todayTotal === 0 && (
                    <div style={{textAlign: 'center', padding: '20px', color: '#888'}}>
                      No entries for today yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Info Footer */}
          <div className="company-info-section">
            <div className="company-card">
              <img src="/logo.png" alt="Kadaieswara Tex" className="company-logo-img" />
              <div className="company-details">
                <h3>KADAIESWARA TEX</h3>
              </div>
            </div>
            <div className="company-contact">
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>114, Mullai Nagar, Kovai Road, Vaikkalmedu Kangayam - 638701</span>
              </div>
              <div className="contact-item">
                <FaPhoneAlt />
                <span>+91 9344631115</span>
              </div>
              <div className="contact-item">
                <FaEnvelope />
                <span>kadaieswaratexkgm@gmail.com</span>
              </div>
            </div>
            <div className="system-info">
              <span>Version 1.0.0</span>
              <span>© 2026 Kadaieswara Tex. All rights reserved.</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
