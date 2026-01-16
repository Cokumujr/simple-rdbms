import { runSQL } from './db-client.js';

const runButton = document.getElementById('run');
const input = document.getElementById('sql');
const output = document.getElementById('output');

runButton.addEventListener('click', async () => {
    const sql = input.value;

    if (!sql) return;

    output.textContent = ''; // clear previous

    try {
        const res = await runSQL(sql);

        // If result is an array, show like REPL
        if (Array.isArray(res.result)) {
            if (res.result.length === 0) {
                output.textContent = '(0 rows)';
            } else {
                const rows = res.result.map(r => JSON.stringify(r, null, 2)).join('\n');
                output.textContent = `${rows}\n\n(${res.result.length} row${res.result.length !== 1 ? 's' : ''})`;
            }
        } else {
            // Non-select queries
            output.textContent = `SUCCESS: ${res.result}`;
        }

    } catch (err) {
        output.textContent = `Error: ${err.message}`;
    }
});
