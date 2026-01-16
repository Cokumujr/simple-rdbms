import * as readline from 'readline';
import { SimpleDB } from '../core';

export async function startREPL() {
    console.clear();
    console.log('    ');
    console.log('         SimpleDB REPL v1.0         ');
    console.log('   Type SQL commands or "exit"      ');
    console.log('    ');

    const MONGO_URI = process.env.MONGO_URI;
    const DB_NAME = process.env.DB_NAME;

    if (!MONGO_URI || !DB_NAME) {
        console.error("Missing MONGO_URI or DB_NAME in environment variables");
        process.exit(1);
    }


    const db = new SimpleDB(MONGO_URI!);

    try {
        await db.connect(DB_NAME!);
        console.log('Connected to database\n');
    } catch (error: any) {
        console.error('Failed to connect:', error.message);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'simpledb> '
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
        const sql = input.trim();

        // Handle exit
        if (sql.toLowerCase() === 'exit' || sql.toLowerCase() === 'quit') {
            console.log('\n Goodbye!');
            await db.disconnect();
            process.exit(0);
        }

        // Handle help
        if (sql.toLowerCase() === 'help') {
            printHelp();
            rl.prompt();
            return;
        }

        // Handle clear
        if (sql.toLowerCase() === 'clear') {
            console.clear();
            rl.prompt();
            return;
        }

        // Execute SQL
        if (sql) {
            try {
                const result = await db.query(sql);

                // Pretty print results
                if (Array.isArray(result)) {
                    if (result.length === 0) {
                        console.log('(0 rows)\n');
                    } else {
                        console.table(result);
                        console.log(`(${result.length} row${result.length !== 1 ? 's' : ''})\n`);
                    }
                } else {
                    console.log('SUCCESS:', result, '\n');
                }
            } catch (error: any) {
                console.error('Error:', error.message, '\n');
            }
        }

        rl.prompt();
    });

    rl.on('close', async () => {
        console.log('\nGoodbye!');
        await db.disconnect();
        process.exit(0);
    });
}

function printHelp() {
    console.log(`
 SimpleDB Commands:

  CREATE TABLE <name> (<columns>)
    Example: CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), age INT)

  INSERT INTO <table> (<columns>) VALUES (<values>)
    Example: INSERT INTO users (name, age) VALUES ('John', 30)
    
  SELECT <columns> FROM <table> [WHERE <condition>]
    Example: SELECT * FROM users WHERE age > 25
    
  UPDATE <table> SET <column>=<value> [WHERE <condition>]
    Example: UPDATE users SET age = 31 WHERE name = 'John'
    
  DELETE FROM <table> [WHERE <condition>]
    Example: DELETE FROM users WHERE id = 1

  JOIN:
    Example: SELECT * FROM users JOIN orders ON users.id = orders.user_id

  help   - Show this help
  clear  - Clear screen
  exit   - Exit REPL
`);
}

// If running directly
if (require.main === module) {
    startREPL().catch(console.error);
}
