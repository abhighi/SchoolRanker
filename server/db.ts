// pathshala-saathi/server/db.ts

// REMOVE: import 'dotenv/config'; // Already loaded in index.ts, so it's redundant here.
                                // It won't hurt, but it's cleaner to load once.

// Change these imports:
// FROM: import { Pool, neonConfig } from '@neondatabase/serverless';
// FROM: import { drizzle } from 'drizzle-orm/neon-serverless';
// TO:
import { Pool } from 'pg'; // Standard node-postgres Pool
import { drizzle } from 'drizzle-orm/node-postgres'; // Drizzle adapter for node-postgres

// REMOVE: import ws from "ws"; // Not needed for standard TCP connection
import * as schema from "@shared/schema"; // Assuming this path is correct for your schema

// REMOVE: neonConfig.webSocketConstructor = ws; // This is for Neon's WebSocket driver

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// This line remains the same, as the 'pg' Pool also accepts a connectionString
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// This line also remains largely the same, but now it's using the correct drizzle adapter
export const db = drizzle(pool, {
  schema: schema // Ensure your schema is correctly imported and passed here
});

// Optional: Add a listener for pool errors (good practice)
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client in pg pool', err);
    // Consider gracefully shutting down or alerting, rather than just exiting in production
    // For development, exiting might be fine to highlight the issue.
    // process.exit(-1);
});

console.log('DB Pool initialized with connection string:', process.env.DATABASE_URL); // Debugging









// import 'dotenv/config'; 
// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
// import * as schema from "@shared/schema";

// neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?",
//   );
// }

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle({ client: pool, schema });
