import { Column, DataType, TableSchema } from "./types";


export class SchemaValidator {

    //validate column definition
    static validateColumn(column: Column): void {
        if (column.type === DataType.VARCHAR && !column.maxLength) {
            throw new Error('VARCHAR columns must specify maxLength');
        }
    }
    //validate table schema
    static validateTableSchema(schema: TableSchema): void {
        if (!schema.name || schema.name.trim() === '') {
            throw new Error('Table name cannot be empty')
        }

        if (Object.keys(schema.columns).length === 0) {
            throw new Error('table must have atleast one column')
        }

        //check for primary key
        const primaryKeys = Object.entries(schema.columns).filter(
            ([__, col]) => col.primaryKey
        )
        if (primaryKeys.length > 1) {
            throw new Error('Table can only have one primary key');
        }

        //validate each column
        Object.values(schema.columns).forEach(col => {
            this.validateColumn(col);
        })
    }

    //validate row data against schema
    static validateRow(
        row: Record<string, any>,
        schema: TableSchema
    ): void {
        //check all required columns are present
        for (const [colName, colDef] of Object.entries(schema.columns)) {
            if (!colDef.nullable && colDef.primaryKey && !colDef.autoIncrement) {
                if (row[colName] === undefined || row[colName] === null) {
                    throw new Error(`Column ${colName} cannot be null`)
                }

            }
        }

        //validate data types
        for (const [colName, value] of Object.entries(row)) {
            if (value === null || value === undefined) continue;

            const colDef = schema.columns[colName];
            if (!colDef) {
                throw new Error(`Unkown column ${colName}`)
            }
            this.validateValue(value, colDef, colName)

        }
    }

    private static validateValue(
        value: any,
        column: Column,
        columnName: string
    ): void {
        switch (column.type) {
            case DataType.INT:
                if (!Number.isInteger(value)) {
                    throw new Error(`column ${columnName} must be an integer`)
                }
                break;
            case DataType.VARCHAR:
                if (typeof value !== 'string') {
                    throw new Error(`Column ${columnName} must be a string`)
                }
                if (column.maxLength && value.length > column.maxLength) {
                    throw new Error(
                        `Column ${columnName} exceeds max length of ${column.maxLength}`
                    )
                }
                break;
            case DataType.BOOLEAN:
                if (typeof value !== 'boolean') {
                    throw new Error(`Column ${columnName} must be a boolean`)
                }
                break;
            case DataType.DATE:
                if (!(value instanceof Date) && isNaN(Date.parse(value))) {
                    throw new Error(`Column ${columnName} must be a valid date`)
                }
                break;


        }
    }


}