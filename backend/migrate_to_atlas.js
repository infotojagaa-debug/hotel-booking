const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const LOCAL_URI = 'mongodb://localhost:27017/hotel-booking';
const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI || ATLAS_URI.includes('<db_password>')) {
  console.error('❌ Error: Atlas URI is not properly configured in .env');
  process.exit(1);
}

const migrate = async () => {
  try {
    console.log('🔌 Connecting to Local MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB.');

    console.log('🔌 Connecting to MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas.');

    // Get all collection names from local database
    const db = localConn.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📦 Found ${collections.length} collections to migrate.`);

    for (const collectionDef of collections) {
      const collectionName = collectionDef.name;
      console.log(`\n⏳ Migrating collection: ${collectionName}...`);

      const localCollection = localConn.collection(collectionName);
      const atlasCollection = atlasConn.collection(collectionName);

      // Fetch all documents from local
      const documents = await localCollection.find({}).toArray();

      if (documents.length === 0) {
        console.log(`➡️  Collection ${collectionName} is empty. Skipping.`);
        continue;
      }

      // Clear existing data in Atlas for this collection (optional, but safer for re-runs)
      await atlasCollection.deleteMany({});
      console.log(`🧹 Cleared existing data in Atlas for ${collectionName}.`);

      // Insert into Atlas
      const result = await atlasCollection.insertMany(documents);
      console.log(`✅ Migrated ${result.insertedCount} documents to ${collectionName}.`);
    }

    console.log('\n✨ Database Migration Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    process.exit(1);
  }
};

migrate();
