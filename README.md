# AU CRM System
<img width="1600" height="1000" alt="image" src="https://github.com/user-attachments/assets/99ce954a-ef3c-4286-a09f-5bb899fd3cab" />

## Overview

AU CRM is a full-stack Customer Relationship Management (CRM) system designed to help businesses manage customers, track sales leads, and organize daily activities in a centralized platform. It enables teams to streamline operations, monitor performance, and make data-driven decisions through real-time insights.

---

## Tech Stack

### Frontend

* React (Vite)
* HTML, CSS
* JavaScript
* Axios / Fetch API

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* Prisma ORM

### Authentication

* JWT (JSON Web Token)
* bcrypt

### Tools & Environment

* Git & GitHub
* VS Code
* Postman

---

## Features

### Authentication & Access Control

* Secure login using JWT
* Role-based access (Admin and Employee)
* Protected routes
* User profile management

### Dashboard

* Overview of customers, leads, and revenue
* Conversion rate tracking
* Lead status distribution
* Recent activities and upcoming tasks
* Employee performance (admin only)

### Customer Management

* Add, edit, delete customers
* Search, filter, and sort functionality
* Pagination support
* Customer detail view
* CSV export

### Lead Management

* Create and manage leads
* Sales pipeline tracking (New to Won/Lost)
* Assign leads to employees (admin only)
* Overdue lead highlighting
* Search, filter, and sorting

### Activity Management

* Track calls, meetings, emails, and tasks
* Mark activities as completed or pending
* Link activities to customers and leads
* Activity summary and filtering

### User Management (Admin Only)

* Add, edit, and delete users
* Role assignment
* View login activity and performance

---

## Project Structure

```
crm-system/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── prisma.config.ts
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
│
├── .vscode/
│   └── settings.json
│
├── add_customers.sql
├── rename_enum.sql
├── update_names.sql
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/aafeefarahman/AU--CRM-SYSTEM.git
cd AU--CRM-SYSTEM
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure environment variables

Create a `.env` file inside `backend`:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

#### Run Prisma migrations

```bash
npx prisma migrate dev
npx prisma generate
```

#### Start backend server

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Database

* PostgreSQL is used as the relational database.
* Prisma ORM is used for schema management and queries.
* SQL scripts included:

  * `add_customers.sql`
  * `rename_enum.sql`
  * `update_names.sql`

---

## Usage

1. Register or login as Admin/Employee
2. Manage customers and track leads
3. Log activities and monitor tasks
4. Use dashboard for insights and performance tracking

---

## Future Enhancements

* Email and notification integration
* Mobile application support
* Advanced analytics and reporting
* AI-based recommendations
* Third-party integrations (marketing tools, APIs)

---
---

## Feedback

Feedback is appreciated. Suggestions, improvements, or issues can be shared to help enhance the project.
