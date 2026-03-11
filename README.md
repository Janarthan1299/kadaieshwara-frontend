# Kadaieswara - Garment Stitching Management System

A full-stack web application for managing garment stitching operations, inventory tracking, employee management, and billing for textile businesses.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)

## Overview

Kadaieswara is a comprehensive management system designed for garment stitching units. It helps track inward cloth entries, stitching work progress, stock levels, employee details, and generates professional invoices for completed work.

## Features

### Core Modules

- **Dashboard** - Real-time overview of stock totals, today's activity, recent entries, and quick navigation
- **Inward Entry** - Record incoming cloth materials with DC numbers, brand, model, size, and piece counts
- **Stock Maintenance** - Track inventory levels including received, stitched, damaged, and pending pieces
- **Stitching Work** - Log daily stitching output by tailors with work numbers and item details
- **Bill Generation** - Create professional invoices with auto-generated invoice numbers (KT-YYYY-0001 format)
- **Employee Details** - Manage tailor/employee information including contact details and status
- **Reports** - Generate and view reports for business analysis
- **Company Details** - Manage company information for invoices

### Security Features

- JWT-based authentication
- Protected routes
- Password encryption with bcrypt
- Account switching capability

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime environment |
| Express.js | 5.2.1 | Web framework |
| MongoDB | - | Database |
| Mongoose | 9.0.2 | MongoDB ODM |
| JWT | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| cors | 2.8.5 | Cross-origin requests |
| dotenv | 17.2.3 | Environment variables |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| React Router | 7.11.0 | Client-side routing |
| Axios | 1.13.2 | HTTP client |
| React Icons | 5.5.0 | Icon library |

## Project Structure

```
Kadaieswara/
├── backend/
│   ├── index.js              # Server entry point
│   ├── package.json          # Backend dependencies
│   ├── seedAdmin.js          # Admin seeding script
│   ├── models/
│   │   ├── Admin.js          # Admin user schema
│   │   ├── Bill.js           # Invoice/bill schema
│   │   ├── Counter.js        # Auto-increment counter
│   │   ├── Employee.js       # Employee schema
│   │   ├── InwardEntry.js    # Inward cloth entry schema
│   │   ├── StitchingWork.js  # Stitching work log schema
│   │   └── Stock.js          # Inventory stock schema
│   └── routes/
│       ├── adminRoutes.js    # Authentication routes
│       ├── billRoutes.js     # Billing API routes
│       ├── employeeRoutes.js # Employee management routes
│       ├── inwardRoutes.js   # Inward entry routes
│       ├── stitchingRoutes.js# Stitching work routes
│       └── stockRoutes.js    # Stock management routes
│
└── frontend/
    ├── package.json          # Frontend dependencies
    ├── public/
    │   └── index.html        # HTML template
    └── src/
        ├── App.js            # Main app with routing
        ├── App.css           # Global styles
        ├── config.js         # API configuration
        ├── index.js          # React entry point
        └── components/
            ├── Login.js/.css           # Authentication page
            ├── Dashboard.js/.css       # Main dashboard
            ├── InwardEntry.js/.css     # Inward entry management
            ├── StockMaintenance.js/.css# Stock tracking
            ├── StitchingWork.js/.css   # Stitching records
            ├── BillGeneration.js/.css  # Invoice creation
            ├── EmployeeDetails.js/.css # Employee management
            ├── Reports.js/.css         # Report generation
            └── CompanyDetails.js/.css  # Company settings
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
node index.js
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will open at `http://localhost:3000`

### Environment Configuration

Update the MongoDB connection string in `backend/index.js` or use environment variables:

```javascript
mongoose.connect(process.env.MONGODB_URI)
```

## Usage

### Initial Setup

1. Run the backend server
2. Execute `node seedAdmin.js` to create the initial admin account
3. Start the frontend application
4. Login with admin credentials

### Workflow

1. **Record Inward Entry** - When cloth materials arrive, create an inward entry with DC number and item details
2. **Track Stock** - Stock levels automatically update based on inward entries and stitching work
3. **Log Stitching Work** - Record daily stitching output by tailors
4. **Generate Bills** - Create invoices for completed stitching work with automatic invoice numbering
5. **View Reports** - Analyze business data through the reports module

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/switch` | Switch account |
| GET | `/api/admin/list` | List all admins |

### Inward Entry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inward` | Get all entries |
| POST | `/api/inward` | Create entry |
| PUT | `/api/inward/:id` | Update entry |
| DELETE | `/api/inward/:id` | Delete entry |

### Stock
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock` | Get all stock |
| POST | `/api/stock/sync` | Sync stock from entries |

### Stitching Work
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stitching` | Get all records |
| POST | `/api/stitching` | Create record |
| PUT | `/api/stitching/:id` | Update record |
| DELETE | `/api/stitching/:id` | Delete record |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Get all bills |
| POST | `/api/bills` | Generate bill |
| GET | `/api/bills/:id` | Get bill by ID |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | Get all employees |
| POST | `/api/employees` | Add employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

## Database Models

### Stock Schema
| Field | Type | Description |
|-------|------|-------------|
| stockKey | String | Unique key (brand-model-size) |
| brand | String | Product brand |
| model | String | Product model |
| size | Number | Size |
| received | Number | Total received pieces |
| stitched | Number | Total stitched pieces |
| damaged | Number | Damaged pieces count |
| pending | Number | Auto-calculated pending |

### InwardEntry Schema
| Field | Type | Description |
|-------|------|-------------|
| dcNumber | String | Delivery challan number |
| receivedDate | Date | Date of receipt |
| items | Array | Array of inward items |
| totals | Object | Aggregated totals |

### StitchingWork Schema
| Field | Type | Description |
|-------|------|-------------|
| workNumber | String | Unique work number |
| workDate | Date | Date of work |
| tailorName | String | Tailor/worker name |
| items | Array | Stitched items list |
| totals | Object | Aggregated totals |

### Bill Schema
| Field | Type | Description |
|-------|------|-------------|
| invoiceNo | String | Auto-generated (KT-YYYY-XXXX) |
| invoiceDate | Date | Invoice date |
| toParty | Object | Party details |
| items | Array | Billed items |
| grandTotal | Number | Total amount |
| status | String | Generated/Paid/Pending |

### Employee Schema
| Field | Type | Description |
|-------|------|-------------|
| name | String | Employee name |
| phone | String | Contact number |
| address | String | Address |
| joinDate | Date | Date of joining |
| status | String | Active/Inactive |

---

**Developed for Kadaieswara Garments**

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
