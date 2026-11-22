# AssetLoop — Equipment Rental Marketplace (Backend API)

RESTful backend API for **AssetLoop**, powered by **Node.js**, **Express.js**, **MongoDB**, **JWT Role-Based Access Control**, and **Stripe**.

- **Live API Base URL:** [https://asset-loop-server.vercel.app/api](https://asset-loop-server.vercel.app/api)
- **Live Frontend App:** [https://asset-loop-client.vercel.app](https://asset-loop-client.vercel.app)

---

## Key Features

- **JWT Authentication & RBAC:** Token issuance (`/api/auth/jwt`) synced with BetterAuth sessions and strict `verifyToken`, `verifyOwner`, and `verifyAdmin` middleware guards.
- **Equipment Management & Moderation:** Full CRUD endpoints with default `Pending` listing status and Admin `Approved` / `Rejected` moderation controls.
- **Server-Side Query Engine:** Optimized MongoDB filtering for keyword search, category, rental type, price range, availability, sorting, and pagination.
- **Bookings & Stripe Checkout:** Real-time stock validation, Stripe Checkout session creation, payment verification, automatic inventory deduction, and payment logging.
- **Dashboard Analytics:** Aggregated monthly revenue, booking counts, and platform metrics for Owner and Admin dashboards.

---

## API Overview

| Module | Base Endpoint | Description |
|---|---|---|
| **Auth & Users** | `/api/auth`, `/api/users` | JWT generation, profile updates, Admin role & user management |
| **Equipments** | `/api/equipments` | Public search/filter, featured listings, Owner CRUD, Admin moderation |
| **Bookings & Payments** | `/api/bookings` | Stripe checkout creation, payment verification, rental status updates |
| **Favorites** | `/api/favorites` | Customer saved equipment wishlist |
| **Analytics** | `/api/analytics` | Role-specific dashboard metrics and monthly chart data |

---

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB (Native Driver with Serverless Connection Caching)
- **Security & Payments:** JSON Web Tokens (JWT), CORS, Stripe API

---

## Local Setup Instructions

1. Clone the repository and install dependencies:
   ```bash
   npm install