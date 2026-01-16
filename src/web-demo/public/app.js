import { runSQL } from './db-client.js';

const runButton = document.getElementById('run');
const input = document.getElementById('sql');
const output = document.getElementById('output');

runButton.addEventListener('click', async () => {
    const sql = input.value;

    if (!sql) return;

    try {
        const result = await runSQL(sql);
        output.textContent = JSON.stringify(result, null, 2);
    } catch (err) {
        output.textContent = `Error: ${err.message}`;
    }
});
