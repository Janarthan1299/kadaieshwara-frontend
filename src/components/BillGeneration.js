import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaFileInvoiceDollar,
  FaArrowLeft,
  FaRupeeSign,
  FaCheckCircle,
  FaPrint,
  FaTrash,
  FaHistory,
  FaPlus,
  FaTimes,
  FaEye,
  FaCalendarWeek,
  FaEdit,
} from "react-icons/fa";
import "./BillGeneration.css";
import { API_URL } from "../config";

// Brand and Model Configuration
const BRAND_MODELS = {
  Sukra: ["RN", "RNS", "RNPS"],
  Compat: ["RN"],
  Romex: ["RN", "RNS"],
  Kings: ["RN", "RNS"],
  Acoste: ["RN", "RNS"],
  Zest: ["RN", "RNS"],
};

// Rate Configuration
const RATES = {
  Sukra: { RN: 5.20, RNS: 6.00, RNPS: 5.20 },
  Compat: { RN: 5.60 },
  Romex: { RN: 5.60, RNS: 6.40 },
  Kings: { RN: 5.60, RNS: 6.40 },
  Acoste: { RN: 5.60, RNS: 6.40 },
  Zest: { RN: 5.60, RNS: 6.40 },
};

// Size options
const SIZES = [80, 85, 90, 95, 100];

// Helper function to handle floating-point precision
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Helper function to safely split amount into rupees and paise
const splitAmount = (amount) => {
  const rounded = roundToTwo(amount);
  const rupees = Math.floor(rounded + 0.001); // Add small epsilon for safety
  const paise = Math.round((rounded - Math.floor(rounded)) * 100);
  return { rupees, paise };
};

function BillGeneration() {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  
  // Check for tab query parameter
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || "create";

  // Form state
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [pieces, setPieces] = useState("");
  const [damagedPieces, setDamagedPieces] = useState("");
  const [rate, setRate] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [inwardDcNo, setInwardDcNo] = useState("");
  const [outwardDcNo, setOutwardDcNo] = useState("");

  // Customer party details (reserved for future use)
  // eslint-disable-next-line no-unused-vars
  const [toPartyName, setToPartyName] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [toPartyAddress, setToPartyAddress] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [toPartyGstin, setToPartyGstin] = useState("");

  // Bill items list
  const [billItems, setBillItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [billHistory, setBillHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBill, setPreviewBill] = useState(null);

  // Available models based on selected brand
  const availableModels = brand ? BRAND_MODELS[brand] : [];

  // Fetch bill history
  const fetchBillHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bills`);
      const data = await response.json();
      setBillHistory(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchBillHistory();
    }
  }, [activeTab]);

  // Update rate when brand and model change
  useEffect(() => {
    if (brand && model && RATES[brand] && RATES[brand][model]) {
      setRate(RATES[brand][model]);
    } else {
      setRate(0);
    }
  }, [brand, model]);

  // Calculate total amount when pieces, damaged pieces, or rate change
  useEffect(() => {
    const piecesNum = parseInt(pieces) || 0;
    const damagedNum = parseInt(damagedPieces) || 0;
    const damageDeduction = damagedNum * 100;
    setTotalAmount(roundToTwo((piecesNum * rate) - damageDeduction));
  }, [pieces, damagedPieces, rate]);

  // Reset model and size when brand changes
  const handleBrandChange = (e) => {
    setBrand(e.target.value);
    setModel("");
    setSize("");
    setRate(0);
  };

  // Add or update item in bill
  const handleAddItem = () => {
    if (!brand || !model || !size || !pieces || parseInt(pieces) <= 0) {
      alert("Please fill all fields correctly");
      return;
    }

    const piecesNum = parseInt(pieces);
    const damagedNum = parseInt(damagedPieces) || 0;
    const damageDeduction = damagedNum * 100;
    
    if (editingItemId) {
      // Update existing item
      setBillItems(billItems.map(item => 
        item.id === editingItemId 
          ? {
              ...item,
              brand,
              model,
              size,
              pieces: piecesNum,
              damagedPieces: damagedNum,
              rate,
              damageDeduction,
              total: roundToTwo((piecesNum * rate) - damageDeduction),
              inwardDcNo,
              outwardDcNo,
            }
          : item
      ));
      setEditingItemId(null);
    } else {
      // Add new item
      const newItem = {
        id: Date.now(),
        brand,
        model,
        size,
        pieces: piecesNum,
        damagedPieces: damagedNum,
        rate,
        damageDeduction,
        total: roundToTwo((piecesNum * rate) - damageDeduction),
        inwardDcNo,
        outwardDcNo,
        sac: "998819",
      };
      setBillItems([...billItems, newItem]);
    }

    // Reset form
    setBrand("");
    setModel("");
    setSize("");
    setPieces("");
    setDamagedPieces("");
    setRate(0);
    setTotalAmount(0);
    setInwardDcNo("");
    setOutwardDcNo("");
  };

  // Edit item - populate form with item data
  const handleEditItem = (item) => {
    setBrand(item.brand);
    setModel(item.model);
    setSize(item.size.toString());
    setPieces(item.pieces.toString());
    setDamagedPieces((item.damagedPieces || 0).toString());
    setRate(item.rate);
    setInwardDcNo(item.inwardDcNo || "");
    setOutwardDcNo(item.outwardDcNo || "");
    setEditingItemId(item.id);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setBrand("");
    setModel("");
    setSize("");
    setPieces("");
    setDamagedPieces("");
    setRate(0);
    setTotalAmount(0);
    setInwardDcNo("");
    setOutwardDcNo("");
    setEditingItemId(null);
  };

  // Remove item from bill
  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter((item) => item.id !== id));
  };

  // Fetch this week's stitching work and add to bill
  const handleThisWeekStitches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/stitching/this-week`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const newItems = data.items
          .filter(item => item.stitchedPieces > 0)
          .map(item => {
            const itemRate = RATES[item.brand]?.[item.model] || 0;
            return {
              id: Date.now() + Math.random(),
              brand: item.brand,
              model: item.model,
              size: item.size,
              pieces: item.stitchedPieces,
              damagedPieces: 0,
              rate: itemRate,
              damageDeduction: 0,
              total: roundToTwo(item.stitchedPieces * itemRate),
              inwardDcNo: "",
              outwardDcNo: "",
              sac: "998819",
            };
          });

        if (newItems.length > 0) {
          setBillItems([...billItems, ...newItems]);
          alert(`Added ${newItems.length} item(s) from this week's stitching work`);
        } else {
          alert("No stitched pieces found for this week");
        }
      } else {
        const dbMsg = data.totalEntriesInDB > 0 
          ? `(${data.totalEntriesInDB} entries in database, but none in this week's date range)` 
          : "(No stitching entries in database)";
        alert(`No stitching work found for this week ${dbMsg}`);
      }
    } catch (error) {
      console.error("Error fetching this week's stitches:", error);
      alert("Error fetching this week's stitching data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate grand total
  const grandTotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const totalPieces = billItems.reduce((sum, item) => sum + item.pieces, 0);
  const totalDamagedPieces = billItems.reduce((sum, item) => sum + (item.damagedPieces || 0), 0);

  // Generate Bill
  const handleGenerateBill = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to generate a bill");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bills/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: billItems,
          grandTotal,
          totalPieces,
          toParty: { 
            name: toPartyName, 
            address: toPartyAddress, 
            gstin: toPartyGstin,
            sac: "998811"
          },
          createdBy: admin.username || "Admin",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setShowPreview(true);
        setPreviewBill(data.bill);
        setBillItems([]);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(data.message || "Error generating bill");
      }
    } catch (error) {
      console.error("Error generating bill:", error);
      alert("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Print Preview
  const handlePrintPreview = () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to preview");
      return;
    }
    
    const previewData = {
      invoiceNo: "PREVIEW",
      invoiceDate: new Date(),
      items: billItems,
      grandTotal,
      totalPieces,
      toParty: { 
        name: toPartyName, 
        address: toPartyAddress, 
        gstin: toPartyGstin,
        sac: "998811"
      },
    };
    setPreviewBill(previewData);
    setShowPreview(true);
  };

  // View bill from history
  const handleViewBill = (bill) => {
    setPreviewBill(bill);
    setShowPreview(true);
  };

  // Print the bill
  const handlePrint = () => {
    const printContent = document.getElementById("bill-print-content");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Tax Invoice - ${previewBill?.invoiceNo || "Preview"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; padding: 10px; font-size: 12px; }
            .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
            .invoice-header { text-align: center; border-bottom: 1px solid #000; padding: 8px; }
            .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
            .header-spacer { width: 100px; }
            .tax-invoice-label { font-size: 11px; font-weight: bold; text-align: center; }
            .cell-number { font-size: 11px; font-weight: bold; width: 100px; text-align: right; }
            .company-logo { display: flex; align-items: center; justify-content: flex-start; gap: 15px; margin-bottom: 5px; }
            .company-logo img.company-logo-img { width: 75px; height: 80px; object-fit: contain; }
            .company-name { font-size: 26px; font-weight: bold; letter-spacing: 2px; }
            .company-address { font-size: 11px; line-height: 1.4; }
            .invoice-details { display: flex; }
            .invoice-to { flex: 1; padding: 8px; border-right: 1px solid #000; font-size: 11px; min-height: 75px; }
            .to-row { margin-bottom: 3px; }
            .to-label { font-weight: bold; }
            .to-value { font-weight: normal; }
            .address-row { margin-left: 20px; }
            .gstin-row { margin-top: 5px; }
            .sac-date-row { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; }
            .sac-section { flex: 1; padding: 6px 8px; font-size: 11px; border-right: 1px solid #000; }
            .sac-label { font-weight: bold; }
            .sac-value { font-weight: bold; margin-left: 5px; }
            .invoice-date-section { width: 200px; padding: 6px 8px; font-size: 11px; display: flex; justify-content: space-between; }
            .invoice-date-section .info-value { font-weight: bold; }
            .invoice-info { width: 200px; padding: 0; font-size: 11px; }
            .invoice-info-row { padding: 4px 8px; border-bottom: 1px solid #000; }
            .invoice-info-row.bordered { display: flex; justify-content: space-between; border-bottom: none; }
            .info-value { font-weight: bold; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 4px 6px; text-align: center; font-size: 11px; }
            .items-table th { background: #fff; font-weight: bold; }
            .items-table .particulars { text-align: left; padding-left: 8px; text-transform: uppercase; }
            .items-table .amount-rs, .items-table .amount-ps { text-align: right; }
            .items-table tbody tr { height: 25px; }
            .invoice-totals { display: flex; border-top: 1px solid #000; }
            .amount-words-section { flex: 1; padding: 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; min-height: 100px; }
            .amount-words { font-size: 11px; line-height: 1.5; }
            .signature-area { text-align: right; margin-top: 15px; }
            .signature-line { font-size: 11px; line-height: 1.6; }
            .totals-table { width: 200px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid #000; font-size: 11px; }
            .total-row.grand-total { font-weight: bold; font-size: 12px; background: #f5f5f5; }
            .total-label { font-weight: bold; }
            .total-value { text-align: right; min-width: 80px; }
            @media print { 
              body { padding: 0; } 
              .invoice-container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
  };

  const amountInWords = (amount) => {
    const { rupees, paise } = splitAmount(amount);
    let words = 'Rupees ' + numberToWords(rupees);
    if (paise > 0) {
      words += ' and ' + numberToWords(paise) + ' Paise';
    }
    return words + ' Only';
  };

  return (
    <div className="bill-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">
            <FaFileInvoiceDollar /> Bill Generation
          </h1>
        </div>
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FaPlus /> Create Bill
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> Bill History
          </button>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="success-message">
          <FaCheckCircle />
          Bill generated successfully!
        </div>
      )}

      {/* Create Entry Tab */}
      {activeTab === 'create' && (
        <div className="entry-content">
          {/* Entry Form Card */}
          <div className={`form-card ${editingItemId ? 'editing-mode' : ''}`}>
            <div className="card-header">
              <h3><FaFileInvoiceDollar /> {editingItemId ? 'Edit Bill Item' : 'Add Bill Item'}</h3>
              <button 
                className="this-week-btn"
                onClick={handleThisWeekStitches}
                disabled={loading || editingItemId}
              >
                <FaCalendarWeek /> This Week Stitches
              </button>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>🏷️ Brand *</label>
                  <select value={brand} onChange={handleBrandChange}>
                    <option value="">Select Brand</option>
                    {Object.keys(BRAND_MODELS).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>📦 Model *</label>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)} 
                    disabled={!brand}
                  >
                    <option value="">Select Model</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>📐 Size *</label>
                  <select 
                    value={size} 
                    onChange={(e) => setSize(e.target.value)}
                    disabled={!brand}
                  >
                    <option value="">Select Size</option>
                    {SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🔢 Number of Pieces</label>
                  <input
                    type="number"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>⚠️ Damaged Pieces</label>
                  <input
                    type="number"
                    value={damagedPieces}
                    onChange={(e) => setDamagedPieces(e.target.value)}
                    className="damaged-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📥 Inward DC No.</label>
                  <input
                    type="text"
                    value={inwardDcNo}
                    onChange={(e) => setInwardDcNo(e.target.value)}
                    placeholder="Enter Inward DC No."
                  />
                </div>
                <div className="form-group">
                  <label>📤 Outward DC No.</label>
                  <input
                    type="text"
                    value={outwardDcNo}
                    onChange={(e) => setOutwardDcNo(e.target.value)}
                    placeholder="Enter Outward DC No."
                  />
                </div>
              </div>

              {/* Rate and Total Display */}
              <div className="calculation-row">
                <div className="calc-box">
                  <span className="calc-label">Rate per Piece</span>
                  <span className="calc-value">
                    <FaRupeeSign /> {rate.toFixed(2)}
                  </span>
                </div>
                {parseInt(damagedPieces) > 0 && (
                  <div className="calc-box damage-box">
                    <span className="calc-label">Damage Deduction</span>
                    <span className="calc-value damage-value">
                      - <FaRupeeSign /> {(parseInt(damagedPieces) * 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="calc-box">
                  <span className="calc-label">Total Amount</span>
                  <span className="calc-value highlight">
                    <FaRupeeSign /> {totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="action-buttons">
                  {editingItemId && (
                    <button
                      className="cancel-edit-btn"
                      onClick={handleCancelEdit}
                    >
                      <FaTimes /> Cancel
                    </button>
                  )}
                  <button
                    className={`add-item-btn ${editingItemId ? 'update-mode' : ''}`}
                    onClick={handleAddItem}
                    disabled={!brand || !model || !size || !pieces}
                  >
                    {editingItemId ? <><FaEdit /> Update Item</> : <><FaPlus /> Add to Bill</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Card */}
          {billItems.length > 0 && (
            <div className="items-card">
              <div className="card-header">
                <h3><FaFileInvoiceDollar /> Bill Items ({billItems.length})</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SAC</th>
                      <th>Particulars</th>
                      <th>Inward DC</th>
                      <th>Outward DC</th>
                      <th>Qty (Pcs)</th>
                      <th>Damaged</th>
                      <th>Rate</th>
                      <th>Deduction</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>998819</td>
                        <td className="brand-cell">{item.brand} {item.model} - Size {item.size}</td>
                        <td>{item.inwardDcNo || "-"}</td>
                        <td>{item.outwardDcNo || "-"}</td>
                        <td>{item.pieces}</td>
                        <td className="damaged-cell">{item.damagedPieces || 0}</td>
                        <td>₹{item.rate.toFixed(2)}</td>
                        <td className="deduction-cell">{item.damageDeduction > 0 ? `-₹${item.damageDeduction.toFixed(2)}` : "-"}</td>
                        <td className="stitched-cell">₹{item.total.toFixed(2)}</td>
                        <td className="action-cell">
                          <button
                            className="edit-btn"
                            onClick={() => handleEditItem(item)}
                            title="Edit item"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Delete item"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>Total</strong></td>
                      <td><strong>{totalPieces}</strong></td>
                      <td className="damaged-cell"><strong>{totalDamagedPieces}</strong></td>
                      <td colSpan="2"></td>
                      <td className="stitched-cell"><strong>₹{grandTotal.toFixed(2)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="save-section">
                <button className="preview-btn" onClick={handlePrintPreview}>
                  <FaEye /> Preview
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleGenerateBill}
                  disabled={loading}
                >
                  <FaCheckCircle /> {loading ? "Generating..." : "Generate Bill"}
                </button>
              </div>
            </div>
          )}

          {billItems.length === 0 && (
            <div className="items-card">
              <div className="card-header">
                <h3><FaFileInvoiceDollar /> Bill Items</h3>
              </div>
              <div className="empty-state">
                <FaFileInvoiceDollar />
                <p>No items added yet. Add items to generate a bill.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="history-header">
            <h3><FaHistory /> Bill History</h3>
            <span className="item-count">{billHistory.length} bills</span>
          </div>

          {loading ? (
            <div className="loading-state">Loading bills...</div>
          ) : billHistory.length === 0 ? (
            <div className="empty-state">
              <FaHistory />
              <p>No bills generated yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total Pieces</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billHistory.map((bill) => (
                    <tr key={bill._id}>
                      <td className="brand-cell">{bill.invoiceNo}</td>
                      <td>{formatDate(bill.invoiceDate)}</td>
                      <td>{bill.items?.length || 0}</td>
                      <td>{bill.totalPieces}</td>
                      <td className="stitched-cell">₹{bill.grandTotal?.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${bill.status?.toLowerCase()}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleViewBill(bill)}
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

      {/* Bill Preview Modal */}
      {showPreview && previewBill && (
        <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h2>Tax Invoice {previewBill.invoiceNo !== "PREVIEW" ? `- ${previewBill.invoiceNo}` : "(Preview)"}</h2>
              <button className="close-btn" onClick={() => setShowPreview(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="preview-content" id="bill-print-content">
              <div className="invoice-container">
                {/* Invoice Header */}
                <div className="invoice-header">
                  <div className="header-top">
                    <span className="header-spacer"></span>
                    <span className="tax-invoice-label">TAX INVOICE</span>
                    <span className="cell-number">Cell : 96882 31115</span>
                  </div>
                  <div className="company-logo">
                    <img src="/logo.png" alt="Kadaieswara Tex" className="company-logo-img" onError={(e) => e.target.style.display = 'none'} />
                    <div className="company-name">KADAIESWARA TEX</div>
                  </div>
                  <div className="company-address">
                    114 B-5, Mullai Nagar, Kovai Road, Vaikkalmedu <strong>KANGAYAM - 638 701</strong><br />
                    Tirupur Dt. TN State Code : 33
                  </div>
                </div>

                {/* Invoice Details Row */}
                <div className="invoice-details">
                  <div className="invoice-to">
                    <div className="to-row">
                      <span className="to-label">To </span>
                      <span className="to-value">{previewBill.toParty?.name || ''}</span>
                    </div>
                    <div className="to-row address-row">
                      <span className="to-address">{previewBill.toParty?.address || ''}</span>
                    </div>
                  </div>
                  <div className="invoice-info">
                    <div className="invoice-info-row">
                      <span>GSTIN : 33BBVPG8051L1Z6</span>
                    </div>
                    <div className="invoice-info-row">
                      <span>PAN No. : BBVPG8051L</span>
                    </div>
                    <div className="invoice-info-row bordered">
                      <span>Invoice No.</span>
                      <span className="info-value">{previewBill.invoiceNo}</span>
                    </div>
                  </div>
                </div>

                {/* SAC Row - connected with Invoice Date */}
                <div className="sac-date-row">
                  <div className="sac-section">
                    <span className="sac-label">SAC </span>
                    <span className="sac-value"></span>
                  </div>
                  <div className="invoice-date-section">
                    <span>Invoice Date</span>
                    <span className="info-value">{formatDate(previewBill.invoiceDate)}</span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="items-table">
                  <thead>
                    <tr>
                      <th rowSpan="2" style={{width: '35px'}}>S.<br/>No</th>
                      <th rowSpan="2">Particulars</th>
                      <th rowSpan="2" style={{width: '65px'}}>Inward<br/>Dc No.</th>
                      <th rowSpan="2" style={{width: '65px'}}>Outward<br/>Dc No.</th>
                      <th rowSpan="2" style={{width: '60px'}}>QTY<br/>PCS</th>
                      <th colSpan="2" style={{width: '80px'}}>Rate</th>
                      <th colSpan="2" style={{width: '100px'}}>Amount</th>
                    </tr>
                    <tr>
                      <th style={{width: '40px'}}>Rs.</th>
                      <th style={{width: '40px'}}>Ps.</th>
                      <th style={{width: '50px'}}>Rs.</th>
                      <th style={{width: '50px'}}>Ps.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewBill.items?.map((item, index) => {
                      const rateParts = splitAmount(item.rate || 0);
                      const amountParts = splitAmount(item.total || 0);
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td className="particulars">{item.brand} - {item.model}</td>
                          <td>{item.inwardDcNo || ""}</td>
                          <td>{item.outwardDcNo || ""}</td>
                          <td>{item.pieces}</td>
                          <td>{rateParts.rupees}</td>
                          <td>{rateParts.paise.toString().padStart(2, '0')}</td>
                          <td className="amount-rs">{amountParts.rupees}</td>
                          <td className="amount-ps">{amountParts.paise.toString().padStart(2, '0')}</td>
                        </tr>
                      );
                    })}
                    {/* Empty rows for invoice format */}
                    {[...Array(Math.max(0, 8 - (previewBill.items?.length || 0)))].map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td>&nbsp;</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="invoice-totals">
                  <div className="amount-words-section">
                    <div className="amount-words">
                      <strong>Total Amount in Words :</strong><br />
                      {amountInWords((() => {
                        const subtotal = roundToTwo(previewBill.grandTotal || 0);
                        const sgst = roundToTwo(subtotal * 0.025);
                        const cgst = roundToTwo(subtotal * 0.025);
                        const grandTotal = roundToTwo(subtotal + sgst + cgst);
                        return Math.round(grandTotal);
                      })())}
                    </div>
                    <div className="signature-area">
                      <div className="signature-line">
                        For <strong>KADAIESWARA TEX</strong><br /><br /><br />
                        Authorised Signatory
                      </div>
                    </div>
                  </div>
                  <div className="totals-table">
                    <div className="total-row">
                      <span className="total-label">TOTAL</span>
                      <span className="total-value">
                        {(() => {
                          const parts = splitAmount(previewBill.grandTotal || 0);
                          return `${parts.rupees}.${parts.paise.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                    <div className="total-row">
                      <span className="total-label">SGST - 2.5 %</span>
                      <span className="total-value">
                        {(() => {
                          const sgst = roundToTwo((previewBill.grandTotal || 0) * 0.025);
                          const parts = splitAmount(sgst);
                          return `${parts.rupees}.${parts.paise.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                    <div className="total-row">
                      <span className="total-label">CGST - 2.5 %</span>
                      <span className="total-value">
                        {(() => {
                          const cgst = roundToTwo((previewBill.grandTotal || 0) * 0.025);
                          const parts = splitAmount(cgst);
                          return `${parts.rupees}.${parts.paise.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                    <div className="total-row">
                      <span className="total-label">Round Off</span>
                      <span className="total-value">
                        {(() => {
                          const subtotal = roundToTwo(previewBill.grandTotal || 0);
                          const sgst = roundToTwo(subtotal * 0.025);
                          const cgst = roundToTwo(subtotal * 0.025);
                          const grandTotal = roundToTwo(subtotal + sgst + cgst);
                          const rounded = Math.round(grandTotal);
                          const roundOff = roundToTwo(rounded - grandTotal);
                          return roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="total-row grand-total">
                      <span className="total-label">Grand TOTAL</span>
                      <span className="total-value">
                        {(() => {
                          const subtotal = roundToTwo(previewBill.grandTotal || 0);
                          const sgst = roundToTwo(subtotal * 0.025);
                          const cgst = roundToTwo(subtotal * 0.025);
                          const grandTotal = roundToTwo(subtotal + sgst + cgst);
                          return Math.round(grandTotal);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-actions">
              <button className="print-action-btn" onClick={handlePrint}>
                <FaPrint /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillGeneration;
