import { createClient } from "@clickhouse/client";

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const chClient = createClient({
  database: "default",
  url: process.env.CLICK_HOUSE_HOST,
  username: process.env.CLICK_HOUSE_USER,
  password: process.env.CLICK_HOUSE_PASSWORD,
  compression: {
    response: true,
  },
  clickhouse_settings: {
    async_insert: 1,
    wait_for_async_insert: 1,
    connect_timeout: 30000, // 30 seconds timeout
  },
  request_timeout: 30000, // 30 seconds timeout
  keep_alive: {
    enabled: true,
    idle_socket_ttl: 60000,
  },
});

console.log("Creating Clickhouse DB if not exists...");
chClient
  .query({
    query: `CREATE DATABASE IF NOT EXISTS ${process.env.CLICK_HOUSE_DATABASE_NAME}`,
  })
  .then((res) => {
    console.log(res.query_id);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
