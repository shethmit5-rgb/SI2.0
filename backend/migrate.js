/**
 * ArenaSync Database Migration Script
 * Migrates data from local MongoDB (Read-Only) to MongoDB Atlas (Write-Only)
 * 
 * Safety Rules:
 * - Insert-Only Mode (No delete/drop/replace operations on Atlas)
 * - Safely resumable & Idempotent (Checks _id before inserting)
 * - Masks credentials in logs
 * - Aborts if source/destination database names are not "ArenaSync"
 */

const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Configure DNS to use Google DNS to bypass local SRV resolution timeouts
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Mask credentials from a connection string for safe logging
function maskUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
}

// Extract database name from a URI
function getDbNameFromUri(uri) {
  try {
    const pathPart = uri.split('?')[0];
    const parts = pathPart.split('/');
    const dbName = parts[parts.length - 1];
    return dbName || null;
  } catch (e) {
    return null;
  }
}

async function runMigration() {
  const startTime = Date.now();
  console.log('🚀 Starting Database Migration...');

  const localUri = 'mongodb://localhost:27017/ArenaSync';
  const atlasUri = process.env.MONGO_URI;

  if (!atlasUri) {
    console.error('❌ Error: process.env.MONGO_URI is not defined. Please check backend/.env');
    process.exit(1);
  }

  // Connection safety checks
  console.log(`📡 Source (READ ONLY):      ${maskUri(localUri)}`);
  console.log(`📡 Destination (WRITE ONLY): ${maskUri(atlasUri)}`);

  const sourceDbNameExpected = 'ArenaSync';
  const destDbNameExpected = 'ArenaSync';

  const sourceDbNameParsed = getDbNameFromUri(localUri);
  const destDbNameParsed = getDbNameFromUri(atlasUri);

  if (sourceDbNameParsed !== sourceDbNameExpected) {
    console.error(`❌ Error: Source database name must be "${sourceDbNameExpected}". Parsed: "${sourceDbNameParsed}"`);
    process.exit(1);
  }
  if (destDbNameParsed !== destDbNameExpected) {
    console.error(`❌ Error: Destination database name must be "${destDbNameExpected}". Parsed: "${destDbNameParsed}"`);
    process.exit(1);
  }

  console.log('✅ Connection URIs validated. Establishing connections...');

  let sourceConn, destConn;
  try {
    sourceConn = mongoose.createConnection(localUri);
    destConn = mongoose.createConnection(atlasUri);
    await Promise.all([sourceConn.asPromise(), destConn.asPromise()]);
  } catch (err) {
    console.error('❌ Failed to establish database connections:', err.message);
    process.exit(1);
  }

  // Double check connected database names
  const actualSourceDb = sourceConn.name || (sourceConn.db && sourceConn.db.databaseName);
  const actualDestDb = destConn.name || (destConn.db && destConn.db.databaseName);

  if (actualSourceDb !== sourceDbNameExpected || actualDestDb !== destDbNameExpected) {
    console.error(`❌ Verification failed: Database names do not match expected "${sourceDbNameExpected}".`);
    console.error(`Source: "${actualSourceDb}", Destination: "${actualDestDb}"`);
    await sourceConn.close();
    await destConn.close();
    process.exit(1);
  }

  console.log(`✅ Databases verified: Source = ${actualSourceDb} (Local), Destination = ${actualDestDb} (Atlas)`);

  let collections;
  try {
    collections = await sourceConn.db.listCollections().toArray();
  } catch (err) {
    console.error('❌ Failed to list local collections:', err.message);
    await sourceConn.close();
    await destConn.close();
    process.exit(1);
  }

  // Report statistics preparation
  const sourceStats = { collections: collections.length, documents: 0 };
  const destStatsBefore = { collections: 0, documents: 0 };
  const newlyInserted = {};
  const skippedDocuments = {};
  const indexesCreatedReport = {};
  const failedCollections = {};

  // Retrieve initial counts of destination collections
  try {
    const destCollections = await destConn.db.listCollections().toArray();
    destStatsBefore.collections = destCollections.length;
    for (const colInfo of destCollections) {
      const col = destConn.db.collection(colInfo.name);
      destStatsBefore.documents += await col.countDocuments();
    }
  } catch (err) {
    console.warn('⚠️ Could not retrieve initial destination statistics:', err.message);
  }

  console.log(`\n📚 Found ${collections.length} collections in Source database.`);
  console.log('--------------------------------------------------');

  for (const colInfo of collections) {
    const colName = colInfo.name;
    console.log(`\n📦 Processing Collection: [${colName}]`);

    try {
      const sourceCol = sourceConn.db.collection(colName);
      const destCol = destConn.db.collection(colName);

      // 1. Scan local documents
      const localDocs = await sourceCol.find({}).toArray();
      const localCount = localDocs.length;
      sourceStats.documents += localCount;

      console.log(`   Scanned ${localCount} local documents.`);

      // 2. Fetch destination existing _ids to implement idempotency / resume capability
      const remoteExistingDocs = await destCol.find({}, { projection: { _id: 1 } }).toArray();
      const remoteExistingIds = new Set(remoteExistingDocs.map(doc => doc._id.toString()));
      const remoteCountBefore = remoteExistingIds.size;

      console.log(`   Atlas has ${remoteCountBefore} documents existing in this collection.`);

      // 3. Filter missing documents
      const docsToInsert = localDocs.filter(doc => !remoteExistingIds.has(doc._id.toString()));
      const skippedCount = localCount - docsToInsert.length;
      skippedDocuments[colName] = skippedCount;

      console.log(`   Filtered: ${docsToInsert.length} new, ${skippedCount} skipped (already present).`);

      // 4. Batch Insertion of missing documents
      let insertedCount = 0;
      if (docsToInsert.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < docsToInsert.length; i += batchSize) {
          const batch = docsToInsert.slice(i, i + batchSize);
          await destCol.insertMany(batch, { ordered: false });
          insertedCount += batch.length;

          // Calculate overall progress for the current collection
          const progressPercent = (((skippedCount + insertedCount) / localCount) * 100).toFixed(1);
          console.log(`   Progress [${colName}]: Scanned=${localCount} | Inserted=${insertedCount} | Skipped=${skippedCount} | Complete=${progressPercent}%`);
        }
      } else {
        console.log(`   Progress [${colName}]: 100.0% Complete (No new documents to insert)`);
      }

      newlyInserted[colName] = insertedCount;

      // 5. Index Re-creation
      const sourceIndexes = await sourceCol.listIndexes().toArray();
      let destIndexes = [];
      try {
        destIndexes = await destCol.listIndexes().toArray();
      } catch (e) {
        // Destination collection might not have been fully initialized with indexes yet
      }

      const destIndexNames = new Set(destIndexes.map(idx => idx.name));
      const createdForThisCol = [];

      for (const idx of sourceIndexes) {
        if (idx.name === '_id_') continue;
        if (destIndexNames.has(idx.name)) continue;

        const { key, name, ns, v, ...options } = idx;
        options.name = name; // Retain exact index name

        try {
          await destCol.createIndex(key, options);
          createdForThisCol.push(name);
        } catch (idxErr) {
          console.warn(`   ⚠️ Warning: Failed to recreate index "${name}" in "${colName}":`, idxErr.message);
        }
      }

      indexesCreatedReport[colName] = createdForThisCol;
      if (createdForThisCol.length > 0) {
        console.log(`   Created ${createdForThisCol.length} missing indexes: ${createdForThisCol.join(', ')}`);
      }

    } catch (err) {
      console.error(`❌ Error migrating collection "${colName}":`, err.message);
      failedCollections[colName] = err.message;
    }
  }

  // Close connections
  await sourceConn.close();
  await destConn.close();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print Migration Completion Report
  console.log('\n==================================================');
  console.log('📊 MIGRATION COMPLETION REPORT');
  console.log('==================================================');
  
  console.log('\n✅ Source Database:');
  console.log(`- Collections: ${sourceStats.collections}`);
  console.log(`- Documents: ${sourceStats.documents}`);

  console.log('\n✅ Destination Database Before:');
  console.log(`- Collections: ${destStatsBefore.collections}`);
  console.log(`- Documents: ${destStatsBefore.documents}`);

  console.log('\n✅ Newly Inserted Documents:');
  Object.keys(newlyInserted).forEach(col => {
    console.log(`- ${col}: ${newlyInserted[col]}`);
  });

  console.log('\n✅ Skipped Existing Documents:');
  Object.keys(skippedDocuments).forEach(col => {
    console.log(`- ${col}: ${skippedDocuments[col]}`);
  });

  console.log('\n✅ Indexes Created:');
  Object.keys(indexesCreatedReport).forEach(col => {
    const list = indexesCreatedReport[col];
    if (list.length > 0) {
      console.log(`- ${col}: ${list.join(', ')}`);
    } else {
      console.log(`- ${col}: None (already exists or none defined)`);
    }
  });

  const failedCount = Object.keys(failedCollections).length;
  if (failedCount > 0) {
    console.log('\n❌ Failed Collections (if any):');
    Object.keys(failedCollections).forEach(col => {
      console.log(`- ${col}: ${failedCollections[col]}`);
    });
  } else {
    console.log('\n✅ Failed Collections (if any): None');
  }

  console.log(`\n⏱️ Total Execution Time: ${durationSec} seconds`);

  console.log('\n✅ Final Status:');
  if (failedCount === 0) {
    console.log('Migration Completed Successfully');
  } else {
    console.log(`Migration Completed With ${failedCount} Failed Collections`);
  }
  console.log('==================================================\n');
}

runMigration().catch(err => {
  console.error('❌ Critical Migration Failure:', err);
  process.exit(1);
});
