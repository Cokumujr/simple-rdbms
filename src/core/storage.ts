import { MongoClient, Db, Collection } from "mongodb";
import { TableSchema } from "./types";

export class Storagedb {
    private client: MongoClient;
    private db!: Db;
    private metadataCollection!: Collection;
    private connected = false;

    constructor(private uri: string = process.env.MONGO_URI!) {
        this.client = new MongoClient(this.uri)
    }


    async connect(dbName: string = process.env.DB_NAME!): Promise<void> {
        if (this.connected) return;


        await this.client.connect();

        this.db = this.client.db(dbName);

        this.metadataCollection = this.db.collection('__simpledb_metadata');
        this.connected = true;

        //initialize metadata if it doesn't exist
        const metadata = await this.metadataCollection.findOne({});
        if (!metadata) {
            await this.metadataCollection.insertOne({ tables: {} })
        }

    }

    async disconnect(): Promise<void> {
        await this.client.close()
        this.connected = false;
    }

    //get all table schemas
    async getMetadata(): Promise<{ tables: Record<string, TableSchema> }> {
        const doc = await this.metadataCollection.findOne({});


        return (doc ?? { tables: {} }) as { tables: Record<string, TableSchema> };
    }

    // Save table schema 
    async saveTableSchema(tableName: string, schema: TableSchema): Promise<void> {
        await this.metadataCollection.updateOne(
            {},
            { $set: { [`tables.${tableName}`]: schema } }
        )
    }

    //get table schema
    async getTableSchema(tableName: string): Promise<TableSchema | null> {
        const metadata = await this.getMetadata();
        return metadata.tables[tableName] || null;

    }

    //check if table exists
    async tableExists(tableName: string): Promise<Boolean> {
        const schema = await this.getTableSchema(tableName)
        return schema !== null
    }

    // get collection data
    getCollection(tableName: string): Collection {
        return this.db.collection(tableName)
    }

    //drop table
    async dropTable(tableName: string): Promise<void> {
        await this.getCollection(tableName).drop();
        await this.metadataCollection.updateOne(
            {},
            { $unset: { [`tables.${tableName}`]: '' } }
        )
    }



}