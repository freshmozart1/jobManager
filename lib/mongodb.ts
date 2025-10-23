import { MongoClient } from "mongodb";
import { NoMongoDBConnectionStringError } from "@/lib/errors";

const uri = process.env.MONGODB_CONNECTION_STRING;
if (!uri) throw new NoMongoDBConnectionStringError();

let client: MongoClient;
let mongoPromise: Promise<MongoClient>;

async function gracefullyCloseMongoClient() {
    console.log('Closing MongoDB connection');
    await client.close();
    process.exit(0);
}

// @ts-expect-error -- global is augmented to hold _mongoClientPromise --
if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    mongoPromise = client.connect();
    // @ts-expect-error -- global is augmented to hold _mongoClientPromise --
    global._mongoClientPromise = mongoPromise;
    process.on('SIGINT', gracefullyCloseMongoClient);
    process.on('SIGTERM', gracefullyCloseMongoClient);
    // @ts-expect-error -- global is augmented to hold _mongoClientPromise --
} else mongoPromise = global._mongoClientPromise;

export default mongoPromise;