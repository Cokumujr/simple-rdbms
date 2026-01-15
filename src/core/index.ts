import { Storagedb } from "./storage";
import { SQLParser } from "./parser";
import { QueryExecutor } from "./executor";


export class SimpleDB {
    private storage: Storagedb;
    private executor: QueryExecutor;

    constructor(uri: string) {
        this.storage = new Storagedb(uri);
        this.executor = new QueryExecutor(this.storage);
    }

    // Initialize the database
    async connect(dbName: string = "simpledb") {
        await this.storage.connect(dbName);
        console.log(`SimpleDB connected to database: ${dbName}`);
    }

    // Close connection
    async disconnect() {
        await this.storage.disconnect();
        console.log("SimpleDB disconnected.");
    }

    // Main entry point: run any SQL
    async query(sql: string): Promise<any> {
        console.log(`Executing SQL: ${sql}`);

        // 1. Parse
        const parsedQuery = SQLParser.parse(sql);

        // 2. Execute
        const result = await this.executor.execute(parsedQuery);

        return result;
    }
}
