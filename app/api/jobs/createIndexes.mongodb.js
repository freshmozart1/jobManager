// Run with mongosh in the target database context.
// Example:
//   use jobManager
//   load('app/api/jobs/createIndexes.mongodb.js')

// Filter recency
try { db.jobs.createIndex({ filteredAt: 1 }, { name: 'filteredAt_1' }) } catch (e) { print('filteredAt index exists or failed:', e.message) }

// Filter result lookup (boolean or error doc)
try { db.jobs.createIndex({ filterResult: 1 }, { name: 'filterResult_1' }) } catch (e) { print('filterResult index exists or failed:', e.message) }

// Deduplication on scrape keys
try { db.jobs.createIndex({ trackingId: 1, refId: 1 }, { unique: true, name: 'unique_dedupe_tracking_ref' }) } catch (e) { print('unique dedupe index exists or failed:', e.message) }
