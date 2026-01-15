import { SchemaValidator } from "./schema";
import { Column, ParsedQuery, TableSchema } from "./types";


export class QueryExecutor {
    constructor(private storage: Storage) { }

    async execute(query: ParsedQuery): Promise<any> {
        switch (query.type) {
            case 'CREATE_TABLE':
                return this.executeCreateTable(query);
            case 'INSERT':
                return this.executeInsert(query);
            case 'SELECT':
                return this.executeSelect(query);
            case 'UPDATE':
                return this.executeUpdate(query);
            case 'DELETE':
                return this.executeDelete(query);
            default:
                throw new Error(`Unsupported query type: ${query.type}`);
        }
    }

    private async executeCreateTable(query: ParsedQuery): Promise<string> {
        if (await this.storage.tableExists(query.tableName)) {
            throw new Error(`Table '${query.tableName}' already exists`);
        }

        if (!query.schema) {
            throw new Error("Missing table schema from parser");
        }


        const schema: TableSchema = {
            ...query.schema,
            nextId: 1 // ensure auto-increment counter exists
        };

        SchemaValidator.validateTableSchema(schema);

        await this.storage.saveTableSchema(query.tableName, schema);

        return `Table '${query.tableName}' created successfully`;
    }

    private async executeInsert(query: ParsedQuery): Promise<string> {
        const schema = await this.storage.getTableSchema(query.tableName);
        if (!schema) {
            throw new Error(`Table '${query.tableName}' does not exist`)
        }

        //build row object
        const row: Record<string, any> = {}

        if (query.columns) {
            // INSERT INTO users (name, age) VALUES ('John', 30)
            query.columns.forEach((col, i) => {
                row[col] = query.values![i];
            });
        } else {
            // INSERT INTO users VALUES (1, 'John', 30)
            const colNames = Object.keys(schema.columns);
            colNames.forEach((col, i) => {
                row[col] = query.values![i];
            });
        }

        // Handle auto-increment primary key
        const primaryKeyCol = Object.entries(schema.columns)
            .find(([_, col]) => (col as Column).primaryKey)?.[0];

        if (primaryKeyCol && schema.columns[primaryKeyCol].autoIncrement) {
            row[primaryKeyCol] = schema.nextId || 1;
            schema.nextId = (schema.nextId || 1) + 1;
            await this.storage.saveTableSchema(query.tableName, schema);
        }

        // Validate row
        SchemaValidator.validateRow(row, schema);

        // Check unique constraints
        await this.checkUniqueConstraints(query.tableName, row, schema);

        // Insert into MongoDB
        const collection = this.storage.getCollection(query.tableName);
        await collection.insertOne(row);

        return `1 row inserted into '${query.tableName}'`;


    }

    private async executeSelect(query: ParsedQuery): Promise<any[]> {
        const schema = await this.storage.getTableSchema(query.tableName);
        if (!schema) {
            throw new Error(`Table '${query.tableName}' does not exist`);
        }

        const collection = this.storage.getCollection(query.tableName);

        // Build MongoDB query
        let mongoQuery: any = {};
        if (query.where) {
            mongoQuery = this.buildMongoQuery(query.where);
        }

        // Execute query
        let results = await collection.find(mongoQuery).toArray();

        // Handle JOIN
        if (query.join) {
            results = await this.executeJoin(query.tableName, query.join, results);
        }

        // Project columns
        if (query.columns && !query.columns.includes('*')) {
            results = results.map((row: Record<string, any>) => {
                const projected: any = {};
                query.columns!.forEach(col => {
                    if (row[col] !== undefined) {
                        projected[col] = row[col];
                    }
                });
                return projected;
            });
        }

        // Remove MongoDB _id
        results = results.map(({ _id, ...rest }: Record<string, any>) => rest);


        return results;
    }

    private async executeUpdate(query: ParsedQuery): Promise<string> {
        const schema = await this.storage.getTableSchema(query.tableName);
        if (!schema) {
            throw new Error(`Table '${query.tableName}' does not exist`);
        }

        const collection = this.storage.getCollection(query.tableName);

        // Build MongoDB query
        const mongoQuery = query.where
            ? this.buildMongoQuery(query.where)
            : {};

        // Validate update values
        if (query.setClause) {
            SchemaValidator.validateRow(query.setClause, schema);
        }

        // Execute update
        const result = await collection.updateMany(
            mongoQuery,
            { $set: query.setClause }
        );

        return `${result.modifiedCount} row(s) updated in '${query.tableName}'`;
    }

    private async executeDelete(query: ParsedQuery): Promise<string> {
        const schema = await this.storage.getTableSchema(query.tableName);
        if (!schema) {
            throw new Error(`Table '${query.tableName}' does not exist`);
        }

        const collection = this.storage.getCollection(query.tableName);

        // Build MongoDB query
        const mongoQuery = query.where
            ? this.buildMongoQuery(query.where)
            : {};

        // Execute delete
        const result = await collection.deleteMany(mongoQuery);

        return `${result.deletedCount} row(s) deleted from '${query.tableName}'`;
    }

    //helper: Execute Join
    private async executeJoin(
        leftTable: string,
        join: any,
        leftResults: any[]
    ): Promise<any[]> {
        // Parse join condition (users.id = orders.user_id)
        const [leftTableName, leftCol] = join.on.left.split('.');
        const [rightTableName, rightCol] = join.on.right.split('.');

        // Get right table data
        const rightCollection = this.storage.getCollection(join.table);
        const rightResults = await rightCollection.find({}).toArray();

        // Perform nested loop join
        const joined: any[] = [];
        for (const leftRow of leftResults) {
            for (const rightRow of rightResults) {
                if (leftRow[leftCol] === rightRow[rightCol]) {
                    // Merge rows with table prefixes
                    const mergedRow: any = {};

                    // Add left table columns
                    for (const [key, value] of Object.entries(leftRow)) {
                        if (key !== '_id') {
                            mergedRow[`${leftTableName}.${key}`] = value;
                        }
                    }

                    // Add right table columns
                    for (const [key, value] of Object.entries(rightRow)) {
                        if (key !== '_id') {
                            mergedRow[`${rightTableName}.${key}`] = value;
                        }
                    }

                    joined.push(mergedRow);
                }
            }
        }

        return joined;
    }

    //helper: Build Mongodb query from WHERE clause
    private buildMongoQuery(where: any): any {
        const operators: Record<string, string> = {
            '=': '$eq',
            '!=': '$ne',
            '>': '$gt',
            '<': '$lt',
            '>=': '$gte',
            '<=': '$lte'
        };

        return {
            [where.column]: { [operators[where.operator]]: where.value }
        };
    }

    //helper: check Unique Constraints
    private async checkUniqueConstraints(
        tableName: string,
        row: Record<string, any>,
        schema: TableSchema
    ): Promise<void> {
        const collection = this.storage.getCollection(tableName);

        for (const [colName, colDef] of Object.entries(schema.columns)) {
            if (colDef.unique || colDef.primaryKey) {
                const existing = await collection.findOne({ [colName]: row[colName] });
                if (existing) {
                    throw new Error(
                        `Duplicate value for unique column '${colName}': ${row[colName]}`
                    );
                }
            }
        }
    }


}