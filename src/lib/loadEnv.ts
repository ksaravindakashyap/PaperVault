import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local first (Next.js convention), then .env as fallback
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });
