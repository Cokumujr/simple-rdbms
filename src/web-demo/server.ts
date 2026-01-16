import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import path from 'path';
import { SimpleDB } from "../core";


const app = express();
const PORT = 8000

dotenv.config()
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new SimpleDB(process.env.MONGO_URI!)

const connectdb = async () => {
    try {
        await db.connect(process.env.DB_NAME!);
        console.log('connected to the simpleDB database')
    } catch (error: any) {
        console.error('Failed to connect to DB:', error);
        process.exit(1);
    }
}

connectdb();

//endpoint used to execute SQL queries
app.post('/query', async (req, res) => {
    const { sql } = req.body

    if (!sql) return res.status(400).json({ error: 'SQL is required' });

    try {
        const result = await db.query(sql);
        res.json({ success: true, result });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }


})

app.listen(PORT, () => console.log(`Web demo running on http://localhost:${PORT}`));