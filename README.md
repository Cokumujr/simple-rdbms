
# SimpleDB - Node.js & MongoDB RDBMS Project

SimpleDB is a lightweight, MongoDB-backed relational database system (RDBMS) built in **Node.js** and **TypeScript**. It supports basic SQL operations including `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE`, and `JOIN`.

This project demonstrates how to implement a custom SQL parser, executor, and storage layer using MongoDB while also providing a **REPL** and a simple **web demo** interface.

---

## 🌟 Features

- **SQL Parser supporting:**
  - `CREATE TABLE`, `INSERT INTO`, `SELECT` (with `WHERE` and `JOIN`), `UPDATE`, and `DELETE`.
- **Schema Validation:**
  - Primary keys, unique constraints, and data types (`INT`, `VARCHAR`, `BOOLEAN`, `DATE`).
- **Storage Layer:** Powered by **MongoDB** for persistence.
- **Interfaces:** Interactive **REPL** and a browser-based **Web Demo**.
- **Strongly Typed:** Built entirely with **TypeScript**.

---

## 🏗 Architecture



```text
src/
├── core/
│   ├── types.ts      # Type definitions
│   ├── storage.ts    # MongoDB connection & operations
│   ├── parser.ts     # SQL parser
│   ├── executor.ts   # Query executor
│   ├── schema.ts     # Schema validator
│   └── index.ts      # Main SimpleDB class
├── repl/
│   └── repl.ts       # Interactive REPL
├── web-demo/
│   ├── server.ts     # Express server
│   ├── db-client.ts  # Web client for SimpleDB
│   └── public/       # Frontend assets
└── index.ts          # Entry point

```

---

## 🚀 Getting Started

### Prerequisites

* Node.js >= 18
* MongoDB Atlas or local MongoDB instance

### Installation

```bash
git clone https://github.com/Cokumujr/simple-rdbms
cd RDBMS
npm install

```

### Configuration

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/
DB_NAME=node-RDBMS

```

---

## 🛠 Usage

### Running the REPL

Execute SQL commands interactively in your terminal.

```bash
npm run repl

```

* Use `exit` to quit the REPL.

### Running the Web Demo

Execute commands and see results directly in the browser.

```bash
npm run web

```

* **URL:** [http://localhost:8000]

---

## 📑 SQL Examples

### Create Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  age INT
);

```

### Insert Data

```sql
INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 30);

```

### Select Data

```sql
SELECT * FROM users WHERE age > 25;

```

### Update & Delete

```sql
UPDATE users SET age = 31 WHERE name = 'John';
DELETE FROM users WHERE id = 1;

```

---

## 🧰 Tech Stack

* **Runtime:** Node.js & TypeScript
* **Database:** MongoDB
* **Server:** Express (Web demo)
* **CLI:** Readline (REPL)
* **Frontend:** HTML/CSS/JS

```

