import { CLICK_HOUSE_CONSTANTS } from "@/lib/constants";
import {
  ClickHouseClient,
  InputJSON,
  InputJSONObjectEachRow,
  createClient,
} from "@clickhouse/client";
import { SelectStatement } from "sql-bricks";
import Stream from "stream";
import {
  ChSchema,
  ChSchemaOptions,
  ClickhouseSchema,
} from "../framework/schema";

type InsertValues<T> =
  | readonly T[]
  | Stream.Readable
  | InputJSON<T>
  | InputJSONObjectEachRow<T>;

export interface IBaseChClient {
  create: (query: string) => Promise<string>;
  createFromSchema: <T extends ChSchema>(
    schema: ClickhouseSchema<T>
  ) => Promise<string>;
  find: <T>(filter: SelectStatement) => Promise<T>;
  insert: <T extends InsertValues<unknown>>(
    table: string,
    data: T
  ) => Promise<T>;
  update: <T>(query: string) => Promise<T>;
  checkTableExists: (table: string) => Promise<boolean>;
}
export class ClickhouseBaseClient implements IBaseChClient {
  private static instance: ClickhouseBaseClient;
  private client: ClickHouseClient;
  private tableExistenceCache: Map<
    string,
    { exists: boolean; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
  private isConnected: boolean = false;

  private constructor(database = CLICK_HOUSE_CONSTANTS.database) {
    this.client = createClient({
      database,
      url: process.env.CLICK_HOUSE_HOST,
      username: process.env.CLICK_HOUSE_USER,
      password: process.env.CLICK_HOUSE_PASSWORD,
      compression: {
        response: true,
      },
      clickhouse_settings: {
        async_insert: 1,
        wait_for_async_insert: 1,
        max_execution_time: 30,
        max_threads: 2,
      },
      request_timeout: 30000,
      keep_alive: {
        enabled: true,
        idle_socket_ttl: 60000,
      },
      max_open_connections: 10,
      application: "langtrace_app",
    });
  }

  public static getInstance(
    database = CLICK_HOUSE_CONSTANTS.database
  ): ClickhouseBaseClient {
    if (!ClickhouseBaseClient.instance) {
      ClickhouseBaseClient.instance = new ClickhouseBaseClient(database);
    }
    return ClickhouseBaseClient.instance;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.ping();
        this.isConnected = true;
      } catch (error) {
        this.isConnected = false;
        throw new Error(`Failed to connect to ClickHouse: ${error}`);
      }
    }
  }

  async createFromSchema<T extends ChSchema>(
    schema: ClickhouseSchema<T>,
    options?: ChSchemaOptions
  ): Promise<string> {
    const schemaOptions = schema.GetOptions();
    if (options === undefined) options = schemaOptions;
    const createTableQuery = this.getCreateTableQuery(
      options,
      schema.schema as ChSchema
    );
    return await this.create(createTableQuery);
  }

  async update<T>(query: string): Promise<T> {
    try {
      return (await (
        await this.client.query({ query: query, format: "JSONEachRow" })
      ).json()) as T;
    } catch (err) {
      throw new Error(
        `An error occurred while trying to update the resource ${err}`
      );
    }
  }

  async insert<T extends InsertValues<unknown>>(
    table: string,
    data: T
  ): Promise<T> {
    try {
      await this.ensureConnection();
      const res = await this.client.insert({
        table,
        values: data,
        format: "JSONEachRow",
      });
      return { ...data, query_id: res.query_id };
    } catch (err) {
      this.isConnected = false; // Reset connection state on error
      throw new Error(
        `An error occurred while trying to insert the resource ${err}`
      );
    }
  }

  async find<T>(filter: SelectStatement): Promise<T> {
    try {
      await this.ensureConnection();
      const response = await this.client.query({
        query: filter.toString(),
        format: "JSONEachRow",
      });
      return (await response.json()) as T;
    } catch (err) {
      this.isConnected = false; // Reset connection state on error
      throw new Error(
        `An error occurred while trying to find the resource ${err}`
      );
    }
  }

  private getCreateTableQuery(
    options: ChSchemaOptions,
    schema: ChSchema
  ): string {
    const columns = Object.entries(schema)
      .map(
        ([name, field]) =>
          `${name} ${field.type} ${
            field.default !== undefined ? `DEFAULT ${field.default}` : ""
          }`
      )
      .join(",");
    if (options.table_name === undefined)
      throw new Error("Table name is required to create a table in clickhouse");
    if (options.order_by === undefined && options.primary_key === undefined)
      throw new Error("One of order_by or primary_key must be specified");
    const createTableQuery = `CREATE TABLE IF NOT EXISTS
    ${options.table_name} (${columns}) ENGINE = ${
      options.engine ?? "MergeTree()"
    }
    ${options.order_by !== undefined ? `ORDER BY ${options.order_by}` : ""}
    ${
      options.primary_key !== undefined
        ? `PRIMARY KEY ${options.primary_key}`
        : ""
    }
    ${
      options.additional_options !== undefined
        ? options.additional_options.join("\n")
        : ""
    }
    `;
    return createTableQuery;
  }

  async create(query: string): Promise<string> {
    return (await this.client.query({ query })).query_id;
  }

  async checkTableExists(table: string): Promise<boolean> {
    const now = Date.now();
    const cached = this.tableExistenceCache.get(table);

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.exists;
    }

    const query = `SELECT name FROM system.tables WHERE name = '${table}'`;
    const res = await this.client.query({ query, format: "JSONEachRow" });
    const exists = ((await res.json()) as { name: string }[]).length > 0;

    this.tableExistenceCache.set(table, { exists, timestamp: now });
    return exists;
  }

  clearTableExistenceCache(table?: string): void {
    if (table) {
      this.tableExistenceCache.delete(table);
    } else {
      this.tableExistenceCache.clear();
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}
