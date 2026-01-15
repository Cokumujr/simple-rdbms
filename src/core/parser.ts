import { Column, DataType, ParsedQuery, TableSchema, WhereClause } from "./types";

export class SQLParser {
    //main parse function
    static parse(sql: string): ParsedQuery {
        sql = sql.trim();

        if (sql.toUpperCase().startsWith('CREATE TABLE')) {
            return this.parseCreateTable(sql)
        } else if (sql.toUpperCase().startsWith(`INSERT INTO`)) {
            return this.parseInsert(sql)
        } else if (sql.toUpperCase().startsWith(`SELECT`)) {
            return this.parseSelect(sql)
        } else if (sql.toUpperCase().startsWith(`UPDATE`)) {
            return this.parseUpdate(sql)
        } else if (sql.toUpperCase().startsWith(`DELETE`)) {
            return this.parseDelete(sql)
        } else {
            throw new Error(`Unsupported query: ${sql}`)
        }

    }

    private static parseCreateTable(sql: string): ParsedQuery {
        //CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), age INT)
        const match = sql.match(/^CREATE\s+TABLE\s+(\w+)\s*\((.+)\)\s*;?$/i);
        if (!match) throw new Error(`Inavlid CREATE TABLE syntax`);

        const tableName = match[1];
        const columnDefs = match[2].split(',').map(c => c.trim()); // naive comma split but good for now

        const schema: TableSchema = {
            name: tableName,
            columns: {},
            indexes: []
        }

        for (const colDef of columnDefs) {
            const parts = colDef.split(/\s+/);
            const colName = parts[0]
            const colType = parts[1].toUpperCase();

            const column: Column = {
                type: this.parseDataType(colType),
                nullable: true
            };

            //parse VARCHAR(255)
            if (colType.includes(`VARCHAR`)) {
                const lengthMatch = colType.match(/VARCHAR\((\d+)\)/);
                if (lengthMatch) {
                    column.maxLength = parseInt(lengthMatch[1]);
                }
            }

            //check for PRIMARY KEY
            if (colDef.toUpperCase().includes('PRIMARY KEY')) {
                column.primaryKey = true;
                column.nullable = false;
                column.autoIncrement = true;
            }

            //check for UNIQUE
            if (colDef.toUpperCase().includes('UNIQUE')) {
                column.unique = true;
                schema.indexes.push(colName);
            }

            schema.columns[colName] = column
        }

        return {
            type: 'CREATE_TABLE',
            tableName,
            schema
        }

    }

    // parse INSERT 
    private static parseInsert(sql: string): ParsedQuery {
        //INSERT INTO users( name, age) VALUES ('John', 30)
        //INSERT INTO users VALUES('John' , 30)

        const match = sql.match(
            /INSERT INTO (\w+)(?:\s*\((.*?)\))?\s*VALUES\s*\((.*)\)/i
        )
        if (!match) throw new Error(`Invalid INSERT syntax`)

        const tableName = match[1];
        const columns = match[2] ? match[2].split(',').map(c => c.trim()) :
            undefined;
        const valueStr = match[3];

        //handle strings in quotes
        const values = this.parseValues(valueStr);

        return {
            type: 'INSERT',
            tableName,
            columns,
            values
        }
    }

    //parse SELECT 
    private static parseSelect(sql: string): ParsedQuery {
        //SELECT * FROM users WHERE age > 25
        //SELECT name, age, FROM users
        //SELECT * FROM users JOIN orders ON users.id = orders.users_id

        const match = sql.match(
            /SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?(?:\s+JOIN\s+(.*?))?$/i
        );
        if (!match) throw new Error('Invalid SELECT syntax');

        const columnStr = match[1].trim();
        const tableName = match[2];
        const whereStr = match[3];
        const joinStr = match[4];

        const columns = columnStr === '*' ? ['*'] :
            columnStr.split(',').map(c => c.trim());

        const query: ParsedQuery = {
            type: 'SELECT',
            tableName,
            columns
        };
        if (whereStr) {
            query.where = this.parseWhere(whereStr)
        }
        if (joinStr) {
            query.join = this.parseJoin(joinStr)
        }

        return query

    }

    //parse UPDATE 
    private static parseUpdate(sql: string): ParsedQuery {
        //UPDATE users SET age = 31 WHERE name = 'John' 
        const match = sql.match(
            /UPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*?))?$/i
        );
        if (!match) throw new Error('Invalid UPDATE syntax');

        const tableName = match[1];
        const setStr = match[2];
        const whereStr = match[3];

        const setClause = this.parseSetClause(setStr);

        const query: ParsedQuery = {
            type: 'UPDATE',
            tableName,
            setClause
        }

        if (whereStr) {
            query.where = this.parseWhere(whereStr)
        }

        return query
    }

    //parse DELETE 
    private static parseDelete(sql: string): ParsedQuery {
        //DELETE FROM users WHERE id = 1

        const match = sql.match(
            /DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.*?))?$/i
        );
        if (!match) throw new Error('Invalid DELETE syntax');

        const tableName = match[1];
        const whereStr = match[2];

        const query: ParsedQuery = {
            type: 'DELETE',
            tableName
        };

        if (whereStr) {
            query.where = this.parseWhere(whereStr);
        }

        return query;

    }

    //helper : parse WHERE clause
    private static parseWhere(whereStr: string): WhereClause {
        //age > 25
        const match = whereStr.match(/(\w+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);
        if (!match) throw new Error('Invalid WHERE clause');

        return {
            column: match[1].trim(),
            operator: match[2] as any,
            value: this.parseValue(match[3].trim())
        };



    }

    //helper : parse JOIN clause
    private static parseJoin(joinStr: string) {
        // orders ON users.id = orders.user_id
        const match = joinStr.match(/(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
        if (!match) throw new Error('Invalid JOIN clause');

        return {
            table: match[1],
            on: {
                left: `${match[2]}.${match[3]}`,
                right: `${match[4]}.${match[5]}`
            }
        };

    }

    //helper : parse SET clause
    private static parseSetClause(setStr: string): Record<string, any> {
        // age = 31, name = 'Jane'
        const pairs = setStr.split(',');
        const result: Record<string, any> = {};

        for (const pair of pairs) {
            const [key, value] = pair.split('=').map(s => s.trim());
            result[key] = this.parseValue(value);
        }

        return result;
    }

    //helper : parse Values List
    private static parseValues(valuesStr: string): any[] {
        return valuesStr.split(',').map(v => this.parseValue(v.trim()));
    }

    //helper : parse single Value
    private static parseValue(value: string): any {
        value = value.trim();

        // String (quoted)
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }

        // Boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Number
        if (!isNaN(Number(value))) return Number(value);

        // Default: string
        return value;
    }

    //helper : parse data type
    private static parseDataType(typeStr: string): DataType {
        if (typeStr.startsWith('VARCHAR')) return DataType.VARCHAR;
        if (typeStr === 'INT' || typeStr === 'INTEGER') return DataType.INT;
        if (typeStr === 'BOOLEAN' || typeStr === 'BOOL') return DataType.BOOLEAN;
        if (typeStr === 'DATE') return DataType.DATE;

        throw new Error(`Unsupported data type: ${typeStr}`);
    }
}