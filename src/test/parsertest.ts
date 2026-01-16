import { SQLParser } from '../core/parser';

function testParser() {
    console.log(' Testing SQL Parser...\n');

    try {
        // Test CREATE TABLE
        console.log('1️ Testing CREATE TABLE...');
        const create = SQLParser.parse(
            "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), age INT)"
        );
        console.log(JSON.stringify(create, null, 2));
        console.log(' Success: CREATE TABLE parsed\n');

        // Test INSERT
        console.log('2️ Testing INSERT...');
        const insert = SQLParser.parse(
            "INSERT INTO users (name, age) VALUES ('John', 30)"
        );
        console.log(JSON.stringify(insert, null, 2));
        console.log('Success: INSERT parsed\n');

        // Test SELECT
        console.log('3️ Testing SELECT...');
        const select = SQLParser.parse(
            "SELECT * FROM users WHERE age > 25"
        );
        console.log(JSON.stringify(select, null, 2));
        console.log('Success: SELECT parsed\n');

        // Test UPDATE
        console.log('4️ Testing UPDATE...');
        const update = SQLParser.parse(
            "UPDATE users SET age = 31 WHERE name = 'John'"
        );
        console.log(JSON.stringify(update, null, 2));
        console.log('Success: UPDATE parsed\n');

        // Test DELETE
        console.log('5️ Testing DELETE...');
        const deleteQ = SQLParser.parse(
            "DELETE FROM users WHERE id = 1"
        );
        console.log(JSON.stringify(deleteQ, null, 2));
        console.log('Success: DELETE parsed\n');

        console.log(' ALL PARSER TESTS PASSED!');

    } catch (error: any) {
        console.error(' Parser test failed:', error.message);
    }
}

testParser();