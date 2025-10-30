// pathshala-saathi/server/index.ts

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, pool } from './db'; // Make sure you import both `db` (drizzle instance) and `pool` (pg Pool)

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// --- IMPORTANT DEBUGGING LOGS (keep these, they're useful) ---
console.log('--- Environment Variables Loaded ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL); // Log your DB URL
console.log('DB_USER:', process.env.DB_USER); // Log individual components if you use them
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined'); // Don't log password directly!
console.log('---------------------------------');


// --- ADD THIS ASYNC FUNCTION TO TEST DB CONNECTION ---
async function testDbConnection() {
    try {
        // Use pool.connect() to explicitly get a client and test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()'); // Run a simple query to confirm
        client.release(); // Release the client back to the pool

        console.log('Node.js app successfully connected to PostgreSQL!');
    } catch (error: any) {
        console.error('Node.js app FAILED to connect to PostgreSQL.');
        console.error('Error message:', error.message);
        console.error('Error code (if available):', error.code); // Look for specific PG error codes
        console.error('Error stack:', error.stack); // Full stack trace
        // Log any additional properties from the error object
        if (error.detail) console.error('Error detail:', error.detail);
        if (error.where) console.error('Error where:', error.where);
        // If connection fails, you might want to exit the process
        process.exit(1); // Exit with a non-zero code to indicate failure
    }
}
// ---------------------------------------------------


(async () => {
  // --- CALL THE CONNECTION TEST HERE ---
  await testDbConnection(); // Wait for the DB test before proceeding

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();











// import 'dotenv/config';
// import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined = undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }

//       if (logLine.length > 80) {
//         logLine = logLine.slice(0, 79) + "…";
//       }

//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   const server = await registerRoutes(app);

//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     const status = err.status || err.statusCode || 500;
//     const message = err.message || "Internal Server Error";

//     res.status(status).json({ message });
//     throw err;
//   });

//   // importantly only setup vite in development and after
//   // setting up all the other routes so the catch-all route
//   // doesn't interfere with the other routes
//   if (app.get("env") === "development") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // ALWAYS serve the app on the port specified in the environment variable PORT
//   // Other ports are firewalled. Default to 5000 if not specified.
//   // this serves both the API and the client.
//   // It is the only port that is not firewalled.
//   const port = parseInt(process.env.PORT || '5000', 10);
//   server.listen({
//     port,
//     host: "0.0.0.0",
//     // reusePort: true,
//   }, () => {
//     log(`serving on port ${port}`);
//   });
// })();

// console.log('--- Environment Variables Loaded ---');
// console.log('DATABASE_URL:', process.env.DATABASE_URL); // Log your DB URL
// console.log('DB_USER:', process.env.DB_USER); // Log individual components if you use them
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PORT:', process.env.DB_PORT);
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined'); // Don't log password directly!
// // console.log('---------------------------------');

// // console.log('PGUSER:', process.env.PGUSER);
// // console.log('PGHOST:', process.env.PGHOST);
// // console.log('PGPORT:', process.env.PGPORT);
// // console.log('PGDATABASE:', process.env.PGDATABASE);
// // console.log('PGPASSWORD length:', process.env.PGPASSWORD ? process.env.PGPASSWORD.length : 'undefined');