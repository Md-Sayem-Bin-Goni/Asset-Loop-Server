# AssetLoop — Equipment Rental Platform (Backend API)

**AssetLoop** is a full-stack equipment rental marketplace built for Bangladesh's construction, photography, agriculture, event, and transportation sectors. This repository contains the RESTful backend API powered by **Express.js**, **MongoDB**, **JWT Role-Based Access Control**, and **Stripe**.

## Key Features
- **Authentication & RBAC:** JWT verification middleware with strict `customer`, `owner`, and `admin` role guards.
- **Equipment Management:** Full CRUD operations with default `Pending` status and Admin moderation (`Approved` / `Rejected`).
- **Server-Side Search, Filter, Sort & Pagination:** MongoDB query pipelines for keyword search, category, rental type, price range, availability, sorting, and pagination.
- **Booking & Stripe Checkout:** Real-time stock validation, Stripe Checkout session creation, payment verification, automatic inventory deduction, and transaction logging.
- **Dashboard Analytics:** Aggregated monthly revenue, booking counts, and user/listing metrics for Admin and Owner dashboards.

## Tech Stack
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB (Native Driver)
- **Authentication:** JSON Web Tokens (JWT) & Cookie Parser
- **Payments:** Stripe API

## Setup Instructions
1. Clone the repository and install dependencies:
   ```bash
   npm install