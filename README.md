# PokeBase
A Pokémon card database managment system. This repo ships browsable UI pages for your entities and CRUD forms (client-side only for now).

---


## Prerequisites

- **Node.js** ≥ 18  
- **npm** ≥ 9

---

## Setup/Build Instructions

Install dependencies:

```bash
cd PokeBase
npm install
```

---

## Project Tree

```
your-project/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ postcss.config.js
├─ tailwind.config.js
├─ index.html
├─ poke_base_dml_queries.sql            # ← canonical DML file to submit
├─ public/
│  └─ dml/
│     └─ poke_base_dml_queries.sql      # optional public copy for viewing
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css (or app.css)            # Tailwind entry (@import "tailwindcss")
│  ├─ types.ts                          # Entity types
│  ├─ lib/
│  │  └─ api.mock.ts                    # in-memory data; swap to real API later
│  ├─ components/
│  │  ├─ Nav.tsx
│  │  ├─ Table.tsx
│  │  └─ FormField.tsx
│  └─ pages/
│     ├─ Index.tsx
│     ├─ Customers.tsx
│     ├─ Cards.tsx
│     ├─ Listings.tsx
│     ├─ GradingCompanies.tsx
│     ├─ GradeSlab.tsx
│     ├─ Orders.tsx
│     └─ OrderItems.tsx
└─ README.md
```
