// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("applicationAgentDB");

db.getCollection('jobs').aggregate([
    {
        $group: {
            _id: '$id',
            count: { $sum: 1 }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
]).toArray();
