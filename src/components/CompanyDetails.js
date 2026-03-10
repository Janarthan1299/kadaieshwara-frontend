import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CompanyDetails.css";
import {
  FaBuilding,
  FaArrowLeft,
  FaSave,
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserCircle,
  FaBell,
  FaSearch,
  FaIndustry,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaIdCard,
  FaFileAlt,
  FaLayerGroup,
  FaTimes,
  FaCheck,
} from "react-icons/fa";

function CompanyDetails() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showInnerTypeModal, setShowInnerTypeModal] = useState(false);
  const [editingInnerType, setEditingInnerType] = useState(null);

  // Company Details State
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "KADAIESWARA TEX",
    ownerName: "Kadaieswara",
    gstNumber: "33XXXXXX1234X1ZX",
    panNumber: "XXXXX1234X",
    address: "114, Mullai Nagar, Kovai Road, Vaikkalmedu",
    city: "Kangayam",
    state: "Tamil Nadu",
    pincode: "638701",
    phone: "+91 9344631115",
    alternatePhone: "",
    email: "kadaieswaratexkgm@gmail.com",
    website: "",
    registrationNumber: "",
    establishedYear: "2020",
  });

  // Inner Types State - Default types as requested
  const [innerTypes, setInnerTypes] = useState([
    { id: 1, name: "Sukra", rate: 15, description: "Premium quality inner", active: true },
    { id: 2, name: "Romex", rate: 18, description: "Standard inner type", active: true },
    { id: 3, name: "Kings", rate: 20, description: "Deluxe quality inner", active: true },
    { id: 4, name: "Acoste", rate: 22, description: "High-end inner type", active: true },
    { id: 5, name: "Zest", rate: 16, description: "Economy inner type", active: true },
    { id: 6, name: "Compat", rate: 14, description: "Basic inner type", active: true },
  ]);

  // New Inner Type Form State
  const [newInnerType, setNewInnerType] = useState({
    name: "",
    rate: "",
    description: "",
    active: true,
  });

  // Handle company details change
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save company details
  const handleSaveCompanyDetails = () => {
    // Here you would typically save to backend
    localStorage.setItem("companyDetails", JSON.stringify(companyDetails));
    setIsEditing(false);
    alert("Company details saved successfully!");
  };

  // Handle inner type form change
  const handleInnerTypeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewInnerType((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add new inner type
  const handleAddInnerType = () => {
    if (!newInnerType.name || !newInnerType.rate) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingInnerType) {
      // Update existing
      setInnerTypes((prev) =>
        prev.map((item) =>
          item.id === editingInnerType.id
            ? { ...newInnerType, id: item.id, rate: parseFloat(newInnerType.rate) }
            : item
        )
      );
    } else {
      // Add new
      const newId = Math.max(...innerTypes.map((t) => t.id), 0) + 1;
      setInnerTypes((prev) => [
        ...prev,
        { ...newInnerType, id: newId, rate: parseFloat(newInnerType.rate) },
      ]);
    }

    setNewInnerType({ name: "", rate: "", description: "", active: true });
    setShowInnerTypeModal(false);
    setEditingInnerType(null);
  };

  // Edit inner type
  const handleEditInnerType = (innerType) => {
    setEditingInnerType(innerType);
    setNewInnerType({
      name: innerType.name,
      rate: innerType.rate.toString(),
      description: innerType.description,
      active: innerType.active,
    });
    setShowInnerTypeModal(true);
  };

  // Delete inner type
  const handleDeleteInnerType = (id) => {
    if (window.confirm("Are you sure you want to delete this inner type?")) {
      setInnerTypes((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Toggle inner type status
  const toggleInnerTypeStatus = (id) => {
    setInnerTypes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  // Load saved data on mount
  useEffect(() => {
    const savedCompanyDetails = localStorage.getItem("companyDetails");
    if (savedCompanyDetails) {
      setCompanyDetails(JSON.parse(savedCompanyDetails));
    }
    const savedInnerTypes = localStorage.getItem("innerTypes");
    if (savedInnerTypes) {
      setInnerTypes(JSON.parse(savedInnerTypes));
    }
  }, []);

  // Save inner types when changed
  useEffect(() => {
    localStorage.setItem("innerTypes", JSON.stringify(innerTypes));
  }, [innerTypes]);

  return (
    <div className="company-details-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1 className="page-title">
            <FaBuilding /> Company Details
          </h1>
        </div>

        <div className="header-actions">
          <div className="header-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="notification-btn">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
          <div className="user-profile">
            <FaUserCircle className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{admin.username || "Admin"}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="company-main">
        {/* Company Information Section */}
        <section className="company-info-card">
          <div className="section-header">
            <div className="section-title">
              <FaIndustry className="section-icon" />
              <h2>Company Information</h2>
            </div>
            <div className="section-actions">
              {isEditing ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    <FaTimes /> Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveCompanyDetails}>
                    <FaSave /> Save Changes
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Details
                </button>
              )}
            </div>
          </div>

          <div className="company-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <FaBuilding /> Company Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={companyDetails.companyName}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FaUserCircle /> Owner Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={companyDetails.ownerName}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FaIdCard /> GST Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={companyDetails.gstNumber}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  placeholder="33XXXXXX1234X1ZX"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FaFileAlt /> PAN Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={companyDetails.panNumber}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  placeholder="XXXXX1234X"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>
                  <FaMapMarkerAlt /> Address <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={companyDetails.address}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City <span className="required">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={companyDetails.city}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>State <span className="required">*</span></label>
                <input
                  type="text"
                  name="state"
                  value={companyDetails.state}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pincode <span className="required">*</span></label>
                <input
                  type="text"
                  name="pincode"
                  value={companyDetails.pincode}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FaPhoneAlt /> Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={companyDetails.phone}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FaPhoneAlt /> Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={companyDetails.alternatePhone}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FaEnvelope /> Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={companyDetails.email}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FaGlobe /> Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={companyDetails.website}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FaFileAlt /> Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={companyDetails.registrationNumber}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Established Year</label>
                <input
                  type="text"
                  name="establishedYear"
                  value={companyDetails.establishedYear}
                  onChange={handleCompanyChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Inner Types Section */}
        <section className="inner-types-card">
          <div className="section-header">
            <div className="section-title">
              <FaLayerGroup className="section-icon" />
              <h2>Inner Types</h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingInnerType(null);
                setNewInnerType({ name: "", rate: "", description: "", active: true });
                setShowInnerTypeModal(true);
              }}
            >
              <FaPlus /> Add Inner Type
            </button>
          </div>

          <div className="inner-types-grid">
            {innerTypes.map((innerType) => (
              <div
                key={innerType.id}
                className={`inner-type-card ${!innerType.active ? "inactive" : ""}`}
              >
                <div className="inner-type-header">
                  <h3>{innerType.name}</h3>
                  <span className={`status-badge ${innerType.active ? "active" : "inactive"}`}>
                    {innerType.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="inner-type-details">
                  <div className="rate">
                    <span className="label">Rate:</span>
                    <span className="value">₹{innerType.rate}/pc</span>
                  </div>
                  <p className="description">{innerType.description}</p>
                </div>
                <div className="inner-type-actions">
                  <button
                    className="btn btn-sm btn-toggle"
                    onClick={() => toggleInnerTypeStatus(innerType.id)}
                    title={innerType.active ? "Deactivate" : "Activate"}
                  >
                    {innerType.active ? <FaTimes /> : <FaCheck />}
                  </button>
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEditInnerType(innerType)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDeleteInnerType(innerType.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Inner Type Modal */}
      {showInnerTypeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingInnerType ? "Edit Inner Type" : "Add New Inner Type"}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowInnerTypeModal(false);
                  setEditingInnerType(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  Inner Type Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newInnerType.name}
                  onChange={handleInnerTypeChange}
                  placeholder="e.g., Sukra, Romex, Kings..."
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Rate per Piece (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="rate"
                  value={newInnerType.rate}
                  onChange={handleInnerTypeChange}
                  placeholder="e.g., 15"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newInnerType.description}
                  onChange={handleInnerTypeChange}
                  placeholder="Brief description of this inner type..."
                  rows="3"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={newInnerType.active}
                    onChange={handleInnerTypeChange}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowInnerTypeModal(false);
                  setEditingInnerType(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddInnerType}>
                {editingInnerType ? "Update" : "Add"} Inner Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDetails;
