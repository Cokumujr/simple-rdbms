
import dotenv from "dotenv";
dotenv.config();


import { Storagedb } from '../core/storage';

async function testStorage() {
    console.log(' Testing Storage...\n');

    const storage = new Storagedb(process.env.MONGO_URI!);

    try {
        // Test 1: Connect to MongoDB
        console.log('1 Connecting to MongoDB...');
        await storage.connect('simpledb_test');
        console.log(' Connected successfully!\n');

        // Test 2: Save a table schema
        console.log('2️ Saving table schema...');
        const testSchema = {
            name: 'users',
            columns: {
                id: {
                    type: 'INT' as any,
                    primaryKey: true,
                    autoIncrement: true
                },
                name: {
                    type: 'VARCHAR' as any,
                    maxLength: 255
                },
                email: {
                    type: 'VARCHAR' as any,
                    maxLength: 255,
                    unique: true
                },
                age: {
                    type: 'INT' as any
                }
            },
            indexes: ['email'],
            nextId: 1
        };

        await storage.saveTableSchema('users', testSchema);
        console.log(' Schema saved!\n');

        // Test 3: Check if table exists
        console.log('3️ Checking if table exists...');
        const exists = await storage.tableExists('users');
        console.log(` Table exists: ${exists}\n`);

        // Test 4: Get table schema back
        console.log('4️ Retrieving table schema...');
        const retrievedSchema = await storage.getTableSchema('users');
        console.log(' Retrieved schema:');
        console.log(JSON.stringify(retrievedSchema, null, 2));
        console.log();

        // Test 5: Get all metadata
        console.log('5️ Getting all metadata...');
        const metadata = await storage.getMetadata();
        console.log(' All tables:');
        console.log(Object.keys(metadata.tables));
        console.log();

        // Test 6: Test collection access
        console.log('6️ Testing collection access...');
        const collection = storage.getCollection('users');
        console.log(` Got collection: ${collection.collectionName}\n`);

        // Test 7: Insert test data
        console.log('7 Inserting test data...');
        await collection.insertOne({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        });
        console.log(' Data inserted!\n');

        // Test 8: Query test data
        console.log(' Querying test data...');
        const data = await collection.find({}).toArray();
        console.log(' Found data:');
        console.log(data);
        console.log();

        // Cleanup
        console.log(' Cleaning up...');
        await storage.dropTable('users');
        console.log(' Table dropped\n');

        // Disconnect
        await storage.disconnect();
        console.log(' Disconnected\n');

        console.log(' ALL TESTS PASSED!!!');

    } catch (error) {
        console.error(' TEST FAILED:', error);
        await storage.disconnect();
        process.exit(1);
    }
}

// Run tests
testStorage();