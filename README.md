\# Corporate Inventory Control Station



A full-stack real-time asset management engine built with a decoupled architecture, featuring a reactive web frontend, an asynchronous Python API service, and relational persistent data storage.



\## 🚀 System Architecture Features

\- \*\*Frontend Panel:\*\* Built using React and Vite, featuring dynamic state management, live validation schemas, and real-time calculation banners (Total Valuation, Stock Unit Tracker, Low Stock Counters).

\- \*\*Backend Service:\*\* Engineered with FastAPI and Uvicorn, exposing a complete set of RESTful CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`).

\- \*\*Data Layer:\*\* Connected natively to a persistent local SQLite database file managing stock records across relational schema fields.

\- \*\*Cross-Origin Pipeline:\*\* Fully configured CORS middleware policies enabling seamless communication between local server ports.



\---



\## 🛠️ Local Environment Execution



\### 1. Backend API Service Setup

Navigate to the backend directory, activate the environment, install the modules, and initiate the ASGI server:

```bash

cd backend

venv\\Scripts\\activate

pip install -r requirements.txt

uvicorn main:app --reload

