import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { redis,redisSub } from "@cex/redis";


const BACKEND_ID = process.env.BACKEND_INSTANCE_ID!;
const TIMEOUT_MS = Number(process.env.ENGINE_TIMEOUT_MS) || 30_000;

type Pending = {
  resolve: (value: unknown) => void;
  reject:  (err: Error) => void;
  timer:   ReturnType<typeof setTimeout>;
};


