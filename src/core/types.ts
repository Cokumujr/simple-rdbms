// Data types supported
export enum DataType {
    INT = 'INT',
    VARCHAR = 'VARCHAR',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE'
}

// Column definition
export interface Column {
    type: DataType;
    maxLength?: number;
    primaryKey?: boolean;
    unique?: boolean;
    autoIncrement?: boolean;
    nullable?: boolean;
}

// Table schema
export interface TableSchema {
    name: string;
    columns: Record<string, Column>;
    indexes: string[];
    nextId?: number;
}

// Query types
export type QueryType =
    | 'CREATE_TABLE'
    | 'INSERT'
    | 'SELECT'
    | 'UPDATE'
    | 'DELETE'
    | 'JOIN';

// Parsed query structure
export interface ParsedQuery {
    type: QueryType;
    tableName: string;
    columns?: string[];
    values?: any[];
    where?: WhereClause;
    join?: JoinClause;
    setClause?: Record<string, any>;
}

export interface WhereClause {
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: any;
}

export interface JoinClause {
    table: string;
    on: { left: string; right: string };
}