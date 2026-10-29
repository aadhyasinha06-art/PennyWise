# PennyWise Backend

Node.js + Express + MySQL API for the PennyWise personal finance app.

## Included

- Signup, login, and current-user endpoint
- JWT-protected routes
- Transaction create/list/update/delete
- Monthly category budgets and spent/remaining calculations
- Savings goal create/list/update/delete
- Dashboard summary and expense-by-category data
- Zod input validation, bcrypt password hashing, parameterized SQL, Helmet, CORS, and API rate limiting
- All finance queries are scoped to the authenticated user's ID

## Requirements

- Node.js 20+
- MySQL 8+ (or a compatible MySQL server)
- Existing frontend running at `http://localhost:5173`

## Setup on Windows / VS Code

1. Extract/copy this folder as `pennywise-new/backend`.
2. Open the backend folder in VS Code terminal.
3. Install packages:

   ```powershell
   npm install
   ```

4. Copy `.env.example` to `.env` in PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Edit `.env`. Set `DB_PASSWORD` to your MySQL password. Set `JWT_SECRET` to a unique random value of at least 32 characters. Do not share or commit `.env`.

6. Create the database tables. Open `database/schema.sql` in MySQL Workbench and execute the whole script. It creates only `pennywise_db`; it does not drop or overwrite another database.

7. Start the server:

   ```powershell
   npm run dev
   ```

   The server will check its MySQL connection before listening on port 5000.

8. Visit `http://localhost:5000/api/health` to check the API.

## Routes

All paths are relative to `http://localhost:5000`.

### Public
- `GET /api/health`
- `POST /api/auth/register` body: `{ "name": "Your Name", "email": "you@example.com", "password": "at-least-8-characters" }`
- `POST /api/auth/login` body: `{ "email": "you@example.com", "password": "..." }`

### Protected

Send header `Authorization: Bearer YOUR_TOKEN` after login/signup.

- `GET /api/auth/me`
- `GET /api/transactions?limit=50&offset=0`
- `POST /api/transactions` body: `{ "type": "expense", "amount": 250, "category": "Food", "description": "Lunch", "transaction_date": "2026-10-24" }`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/budgets?month=2026-10`
- `POST /api/budgets` body: `{ "category": "Food", "amount": 5000, "month": "2026-10" }`
- `PATCH /api/budgets/:id`
- `DELETE /api/budgets/:id`
- `GET /api/goals`
- `POST /api/goals` body: `{ "name": "Emergency fund", "target_amount": 50000, "current_amount": 5000, "deadline": "2027-12-31" }`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`
- `GET /api/dashboard/summary?month=2026-10`

Amounts are in INR in the frontend, stored as decimal values in MySQL. Dates use ISO format. The API does not seed fake transactions.

## Important security notes

- `.env` is excluded by `.gitignore`; never commit real secrets.
- Passwords are hashed; plaintext passwords are never stored.
- SQL uses parameterized statements.
- Finance endpoints use the authenticated user ID to prevent access to another user's records.
- For a deployed production app, use HTTPS, review token storage (prefer secure, HttpOnly cookies where suitable), configure exact origins, backups, and operational monitoring.
