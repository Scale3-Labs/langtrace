import { Span, SpanSchema } from "@/lib/clients/scale3_clickhouse/models/span";
import sql from "sql-bricks";
import { ClickhouseBaseClient } from "../clients/scale3_clickhouse/client/client";
import { calculatePriceFromUsage, getFormattedTime } from "../utils";
import {
  Filter,
  IQueryBuilderService,
  QueryBuilderService,
} from "./query_builder_service";

export interface PaginationResult<T> {
  result: T[];
  metadata?: { page?: number; page_size?: number; total_pages: number };
}

export interface ITraceService {
  GetTotalTracePerHourPerProject: (
    project_id: string,
    lastNHours?: number,
    userId?: string,
    experimentId?: string,
    model?: string,
    inference?: boolean
  ) => Promise<number>;
  GetTotalSpansPerHourPerProject: (
    project_id: string,
    lastNHours?: number,
    userId?: string
  ) => Promise<number>;
  GetTokensUsedPerHourPerProject: (
    project_id: string,
    lastNHours?: number,
    userId?: string,
    model?: string
  ) => Promise<number>;
  GetTokensCostPerHourPerProject: (
    project_id: string,
    lastNHours?: number,
    userId?: string,
    model?: string
  ) => Promise<number>;
  GetAverageTraceLatenciesPerHourPerProject(
    project_id: string,
    lastNHours?: number,
    userId?: string,
    model?: string,
    inference?: boolean
  ): Promise<any>;
  GetTokensCostPerProject: (project_id: string) => Promise<any>;
  GetTotalTracesPerProject: (
    project_id: string,
    inference?: boolean
  ) => Promise<number>;
  GetTotalSpansPerProject: (project_id: string) => Promise<number>;
  GetTotalSpansWithAttributesPerProject: (
    project_id: string,
    attribute: string
  ) => Promise<number>;
  GetTotalSpansPerAccount: (project_ids: string[]) => Promise<number>;
  GetSpansInProjectPaginated: (
    project_id: string,
    page: number,
    pageSize: number,
    filters?: Filter
  ) => Promise<PaginationResult<Span>>;
  GetSpansInProject: (
    project_id: string,
    lastNHours: number,
    filters?: Filter
  ) => Promise<Span[]>;
  GetTracesInProjectPaginated: (
    project_id: string,
    page: number,
    pageSize: number,
    filters?: Filter,
    keyword?: string
  ) => Promise<PaginationResult<Span[]>>;
  GetTokensUsedPerProject: (project_id: string) => Promise<any>;
  GetTokensUsedPerAccount: (project_ids: string[]) => Promise<number>;
  GetSpanById: (span_id: string, project_id: string) => Promise<Span>;
  GetTraceById: (trace_id: string, project_id: string) => Promise<Span[]>;
  GetSpansWithAttribute: (
    attribute: string,
    project_id: string,
    page: number,
    pageSize: number,
    trace_id?: string
  ) => Promise<PaginationResult<Span>>;
  GetFailedSpans: (project_id: string) => Promise<Span[]>;
  GetSpanLatencyPerProject: (project_id: string) => Promise<number>;
  GetSpansPerModel: (model: string, project_ids: string[]) => Promise<Span[]>;
  GetSpanLatencyPerModel: (
    model: string,
    project_ids: string[]
  ) => Promise<number>;
  AddSpans: (spans: Span[], project_id: string) => Promise<void>;
  GetUsersInProject: (project_id: string) => Promise<string[]>;
  GetPromptsInProject: (project_id: string) => Promise<string[]>;
  GetModelsInProject: (project_id: string) => Promise<string[]>;
  GetInferenceCostPerProject: (
    project_id: string,
    attribute_filters?: { [key: string]: string }
  ) => Promise<any>;
}

export class TraceService implements ITraceService {
  private readonly client: ClickhouseBaseClient;
  private readonly queryBuilderService: IQueryBuilderService;
  constructor() {
    this.client = new ClickhouseBaseClient();
    this.queryBuilderService = new QueryBuilderService();
  }

  async GetInferenceCostPerProject(
    project_id: string,
    attribute_filters: { [key: string]: string } = {}
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return 0;
      }
      const conditions = [
        sql.eq(
          "JSONExtractString(attributes, 'langtrace.service.type')",
          "llm"
        ),
      ];

      if (Object.keys(attribute_filters).length > 0) {
        Object.keys(attribute_filters).forEach((key) => {
          conditions.push(
            sql.eq(
              `JSONExtractString(attributes, '${key}')`,
              attribute_filters[key]
            )
          );
        });
      }

      const query = sql
        .select([
          `IF(
            JSONExtractString(attributes, 'llm.model') != '',
            JSONExtractString(attributes, 'llm.model'),
            IF(
              JSONExtractString(attributes, 'gen_ai.response.model') != '',
              JSONExtractString(attributes, 'gen_ai.response.model'),
              JSONExtractString(attributes, 'gen_ai.request.model')
            )
          ) AS model`,
          `JSONExtractString(attributes, 'langtrace.service.name') AS vendor`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens'
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.input_tokens'), 0
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.prompt_tokens'), 0
          )
        ) AS input_tokens`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens'
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.output_tokens'), 0
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.completion_tokens'), 0
          )
        ) AS output_tokens`,
        ])
        .from(project_id)
        .where(...conditions)
        .groupBy("vendor", "model");

      const result = await this.client.find<any>(query);
      return result;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetUsersInProject(project_id: string): Promise<string[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql
        .select([
          `DISTINCT JSONExtractString(attributes, 'user_id') AS user_id`,
        ])
        .from(project_id);
      const result: any[] = await this.client.find(query);
      return result
        .map((row) => row.user_id)
        .filter((user_id) => user_id !== "");
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the users ${error}`
      );
    }
  }

  async GetPromptsInProject(project_id: string): Promise<string[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql
        .select([
          `DISTINCT JSONExtractString(attributes, 'prompt_id') AS prompt_id`,
        ])
        .from(project_id);
      const result: any[] = await this.client.find(query);
      return result
        .map((row) => row.prompt_id)
        .filter((prompt_id) => prompt_id !== "");
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the prompts ${error}`
      );
    }
  }

  async GetModelsInProject(project_id: string): Promise<string[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql
        .select([
          `DISTINCT
        IF(
          JSONExtractString(attributes, 'llm.model') != '',
          JSONExtractString(attributes, 'llm.model'),
          IF(
            JSONExtractString(attributes, 'gen_ai.response.model') != '',
            JSONExtractString(attributes, 'gen_ai.response.model'),
            JSONExtractString(attributes, 'gen_ai.request.model')
          )
        ) AS model`,
        ])
        .from(project_id);
      const result: any[] = await this.client.find(query);
      return result.map((row) => row.model).filter((model) => model !== "");
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the models ${error}`
      );
    }
  }

  async AddSpans(spans: Span[], project_id: string): Promise<void> {
    try {
      await this.client
        .createFromSchema(SpanSchema, {
          table_name: `${project_id}`,
          order_by: "(trace_id, span_id, start_time)",
          primary_key: "(trace_id, span_id, start_time)",
        })
        .catch((err) => {
          throw new Error(
            `An error occurred while trying to get the span ${err}`
          );
        });
      await this.client.insert<Span[]>(project_id, spans);
    } catch (error) {
      throw new Error(
        `An error occurred while trying to add the span ${error}`
      );
    }
  }

  async GetSpanById(span_id: string, project_id: string): Promise<Span> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {} as Span;
      }
      const query = sql.select().from(project_id).where({ span_id });
      const span: Span[] = await this.client.find<Span[]>(query);
      return span[0];
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the span ${error}`
      );
    }
  }

  async GetTraceById(trace_id: string, project_id: string): Promise<Span[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql.select().from(project_id).where({ trace_id });
      const span: Span[] = await this.client.find<Span[]>(query);
      return span;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the trace ${error}`
      );
    }
  }

  async GetTotalSpansPerProject(project_id: string): Promise<number> {
    try {
      // check if the table exists
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return 0;
      }

      const query = sql.select("count()").from(project_id);
      const result = await this.client.find<any>(query);
      return parseInt(result[0]["count()"], 10);
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetTotalSpansWithAttributesPerProject(
    project_id: string,
    attribute: string
  ): Promise<number> {
    try {
      // check if the table exists
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return 0;
      }

      const query = sql
        .select("count()")
        .from(project_id)
        .where(sql.like("attributes", `%${attribute}%`));
      const result = await this.client.find<any>(query);
      return parseInt(result[0]["count()"], 10);
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetTotalSpansPerHourPerProject(
    project_id: string,
    lastNHours = 168,
    userId?: string
  ): Promise<any> {
    const nHoursAgo = getFormattedTime(lastNHours);
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const conditions = [sql.gte("start_time", nHoursAgo)];

      if (userId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'user_id')", userId)
        );
      }

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `count(*) AS spanCount`,
        ])
        .from(project_id)
        .where(...conditions)
        .groupBy(`toDate(parseDateTimeBestEffort(start_time))`)
        .orderBy(`toDate(parseDateTimeBestEffort(start_time))`);
      const result = await this.client.find<any>(query);
      return result;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetTotalTracesPerProject(
    project_id: string,
    inference = false
  ): Promise<number> {
    try {
      // check if the table exists
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return 0;
      }
      const conditions = [];

      if (inference) {
        conditions.push(
          sql.eq(
            "JSONExtractString(attributes, 'langtrace.service.type')",
            "llm"
          )
        );
      }
      const query = sql
        .select("COUNT(DISTINCT trace_id) AS total_traces")
        .from(project_id)
        .where(...conditions);
      const result = await this.client.find<any>(query);
      return parseInt(result[0]["total_traces"], 10);
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetTotalTracePerHourPerProject(
    project_id: string,
    lastNHours = 168,
    userId?: string,
    experimentId?: string,
    model?: string,
    inference = false
  ): Promise<any> {
    const nHoursAgo = getFormattedTime(lastNHours);
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const conditions = [sql.gte("start_time", nHoursAgo)];

      if (userId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'user_id')", userId)
        );
      }

      if (experimentId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'experiment')", experimentId)
        );
      }

      if (model) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'llm.model')", model)
        );
      }

      if (inference) {
        conditions.push(
          sql.eq(
            "JSONExtractString(attributes, 'langtrace.service.type')",
            "llm"
          )
        );
      }

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `COUNT(DISTINCT trace_id) AS traceCount`,
        ])
        .from(project_id)
        .where(...conditions)
        .groupBy(`toDate(parseDateTimeBestEffort(start_time))`)
        .orderBy(`toDate(parseDateTimeBestEffort(start_time))`);
      const result = await this.client.find<any>(query);
      return result;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetSpansWithAttribute(
    attribute: string,
    project_id: string,
    page: number,
    pageSize: number,
    trace_id?: string
  ): Promise<PaginationResult<Span>> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          result: [],
          metadata: { page, page_size: pageSize, total_pages: 1 },
        };
      }

      const totalLen = await this.GetTotalSpansWithAttributesPerProject(
        project_id,
        attribute
      );
      const totalPages =
        Math.ceil(totalLen / pageSize) === 0
          ? 1
          : Math.ceil(totalLen / pageSize);

      const md = { page, page_size: pageSize, total_pages: totalPages };
      if (page! > totalPages) {
        page = totalPages;
      }

      let query = `* FROM ${project_id} WHERE attributes LIKE '%${attribute}%'`;
      if (trace_id) {
        query += ` AND trace_id = '${trace_id}'`;
      }
      query += ` ORDER BY 'start_time' DESC LIMIT ${pageSize} OFFSET ${
        (page - 1) * pageSize
      };`;
      let spans: Span[] = await this.client.find<Span[]>(sql.select(query));
      spans = spans.filter(
        (span) => JSON.parse(span.attributes)[attribute]?.length > 0
      );
      return { result: spans.reverse(), metadata: md };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the spans with attribute ${error}`
      );
    }
  }

  async GetFailedSpans(project_id: string): Promise<Span[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql
        .select()
        .from(project_id)
        .where(sql.notEq("status_code", "OK"));
      const spans: Span[] = await this.client.find<Span[]>(query);
      return spans;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the failed spans ${error}`
      );
    }
  }

  async GetTotalSpansPerAccount(project_ids: string[]): Promise<number> {
    try {
      let totalCount = 0;

      for (const projectId of project_ids) {
        // check if the table exists
        const tableExists = await this.client.checkTableExists(projectId);
        if (!tableExists) {
          totalCount += 0;
          continue;
        }

        const query = sql.select("count()").from(projectId);
        const result = await this.client.find<any>(query);
        const count = parseInt(result[0]["count()"], 10);
        totalCount += count.valueOf();
      }
      return totalCount;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the total spans ${error}`
      );
    }
  }

  async GetSpansInProjectPaginated(
    project_id: string,
    page: number,
    pageSize: number,
    filters: Filter = { operation: "AND", filters: [] }
  ): Promise<PaginationResult<Span>> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          result: [],
          metadata: { page, page_size: pageSize, total_pages: 1 },
        };
      }

      // build the pagination metadata
      const getTotalSpansPerProjectQuery = sql.select(
        this.queryBuilderService.CountFilteredSpanAttributesQuery(
          project_id,
          filters
        )
      );
      const result = await this.client.find<any>(getTotalSpansPerProjectQuery);
      const totalLen = parseInt(result[0]["total_spans"], 10);
      const totalPages =
        Math.ceil(totalLen / pageSize) === 0
          ? 1
          : Math.ceil(totalLen / pageSize);

      const md = { page, page_size: pageSize, total_pages: totalPages };
      if (page! > totalPages) {
        page = totalPages;
      }

      // get all spans sorted by start_time in descending order
      const getSpansQuery = sql.select(
        this.queryBuilderService.GetFilteredSpansAttributesQuery(
          project_id,
          filters,
          pageSize,
          (page - 1) * pageSize
        )
      );
      const spans: Span[] = await this.client.find<Span[]>(getSpansQuery);
      return { result: spans, metadata: md };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the spans ${error}`
      );
    }
  }

  async GetSpansInProject(
    project_id: string,
    lastNHours = 168,
    filters: Filter = { operation: "AND", filters: [] }
  ): Promise<Span[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = this.queryBuilderService.GetFilteredSpansAttributesQuery(
        project_id,
        filters,
        1000,
        10,
        lastNHours
      );
      const getSpansQuery = sql.select(query);
      const spans: Span[] = await this.client.find<Span[]>(getSpansQuery);
      return spans;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the spans ${error}`
      );
    }
  }

  async GetTracesInProjectPaginated(
    project_id: string,
    page: number,
    pageSize: number,
    filters: Filter = { operation: "AND", filters: [] },
    keyword?: string
  ): Promise<PaginationResult<Span[]>> {
    try {
      // check if the table exists
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          result: [],
          metadata: { page, page_size: pageSize, total_pages: 1 },
        };
      }

      // build the pagination metadata
      const getTotalTracesPerProjectQuery = sql.select(
        this.queryBuilderService.CountFilteredTraceAttributesQuery(
          project_id,
          filters,
          keyword
        )
      );
      const result = await this.client.find<any>(getTotalTracesPerProjectQuery);
      const totalLen = parseInt(result[0]["total_traces"], 10);
      const totalPages =
        Math.ceil(totalLen / pageSize) === 0
          ? 1
          : Math.ceil(totalLen / pageSize);

      const md = { page, page_size: pageSize, total_pages: totalPages };
      if (page! > totalPages) {
        page = totalPages;
      }

      // get the traces with filters for the page
      const queryStr = this.queryBuilderService.GetTracesWithFilters(
        project_id,
        filters,
        pageSize,
        (page - 1) * pageSize,
        keyword
      );
      const query = sql.select("*").from(`(${queryStr})`);
      const results = await this.client.find<any>(query);

      // Extract the arrays and remove all wrapping
      const traces: Span[][] = results.map((r: any) => r.result);
      return { result: traces, metadata: md };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the trace ${error}`
      );
    }
  }

  async GetAverageTraceLatenciesPerHourPerProject(
    project_id: string,
    lastNHours = 168,
    userId?: string,
    model?: string,
    inference = false
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          averageLatencies: [],
          p99Latencies: [],
          p95Latencies: [],
        };
      }

      const nHoursAgo = getFormattedTime(lastNHours);

      const conditions = [sql.gte("start_time", nHoursAgo)];
      if (userId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'user_id')", userId)
        );
      }

      if (model) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'llm.model')", model)
        );
      }

      if (inference) {
        conditions.push(
          sql.eq(
            "JSONExtractString(attributes, 'langtrace.service.type')",
            "llm"
          )
        );
      }

      // Directly embedding the ClickHouse-specific functions within string literals
      let innerSelect = sql
        .select(
          "trace_id",
          "min(parseDateTime64BestEffort(start_time)) AS minStart",
          "max(parseDateTime64BestEffort(end_time)) AS maxEnd",
          "(toUnixTimestamp(max(parseDateTime64BestEffort(end_time))) - toUnixTimestamp(min(parseDateTime64BestEffort(start_time)))) * 1000 AS duration"
        )
        .from(project_id)
        .where(...conditions)
        .groupBy("trace_id");

      // Assembling the outer query
      let query = sql
        .select(
          "toDate(minStart) AS day",
          "groupArray(trace_id) AS trace_ids",
          "groupArray(duration) AS durations"
        )
        .from(innerSelect)
        .groupBy("day")
        .orderBy("day");

      const result: any[] = await this.client.find<any[]>(query);

      // Calculate average latency per day
      const averageLatencies: any = result.map((row: any) => {
        const totalLatency = row.durations.reduce(
          (a: string, b: string) => parseFloat(a) + parseFloat(b),
          0
        );
        return {
          date: row.day,
          averageLatency: totalLatency / row.durations.length,
        };
      });
      // return averageLatencies;

      // calculate the p99 latency per day
      const p99Latencies: any = result.map((row: any) => {
        const sortedDurations = row.durations.sort((a: any, b: any) => a - b);
        const p99Index = Math.floor(sortedDurations.length * 0.99);
        return {
          date: row.day,
          p99Latency: sortedDurations[p99Index],
        };
      });

      // calculate the p95 latency per day
      const p95Latencies: any = result.map((row: any) => {
        const sortedDurations = row.durations.sort((a: any, b: any) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        return {
          date: row.day,
          p95Latency: sortedDurations[p95Index],
        };
      });

      return {
        averageLatencies,
        p99Latencies,
        p95Latencies,
      };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensUsedPerHourPerProject(
    project_id: string,
    lastNHours = 168,
    userId?: string,
    model?: string
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const nHoursAgo = getFormattedTime(lastNHours);

      // Build conditions array
      const conditions = [
        sql.or(
          sql.like("attributes", "%gen_ai.usage.input_tokens%"),
          sql.like("attributes", "%gen_ai.usage.prompt_tokens%")
        ),
        sql.gte("start_time", nHoursAgo),
      ];

      if (userId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'user_id')", userId)
        );
      }

      if (model) {
        conditions.push(
          sql.or(
            sql.eq(
              "JSONExtractString(attributes, 'gen_ai.response.model')",
              model
            ),
            sql.eq(
              "JSONExtractString(attributes, 'gen_ai.request.model')",
              model
            )
          )
        );
      }

      const query = sql
        .select([
          "toDate(parseDateTimeBestEffort(start_time)) AS date",
          `sum(
            CASE
              WHEN JSONHas(attributes, 'llm.token.counts')
              THEN toInt64(JSONExtractString(JSONExtractString(attributes, 'llm.token.counts'), 'total_tokens'))
              WHEN JSONHas(attributes, 'gen_ai.usage.prompt_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.prompt_tokens')) +
                   toInt64(JSONExtractString(attributes, 'gen_ai.usage.completion_tokens'))
              WHEN JSONHas(attributes, 'gen_ai.usage.input_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.input_tokens')) +
                   toInt64(JSONExtractString(attributes, 'gen_ai.usage.output_tokens'))
              ELSE 0
            END
          ) AS totalTokens`,
          `sum(
            CASE
              WHEN JSONHas(attributes, 'llm.token.counts')
              THEN if(JSONHas(JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens'),
                     toInt64(JSONExtractString(JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens')),
                     toInt64(JSONExtractString(JSONExtractString(attributes, 'llm.token.counts'), 'prompt_tokens')))
              WHEN JSONHas(attributes, 'gen_ai.usage.prompt_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.prompt_tokens'))
              WHEN JSONHas(attributes, 'gen_ai.usage.input_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.input_tokens'))
              ELSE 0
            END
          ) AS inputTokens`,
          `sum(
            CASE
              WHEN JSONHas(attributes, 'llm.token.counts')
              THEN if(JSONHas(JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens'),
                     toInt64(JSONExtractString(JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens')),
                     toInt64(JSONExtractString(JSONExtractString(attributes, 'llm.token.counts'), 'completion_tokens')))
              WHEN JSONHas(attributes, 'gen_ai.usage.completion_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.completion_tokens'))
              WHEN JSONHas(attributes, 'gen_ai.usage.output_tokens')
              THEN toInt64(JSONExtractString(attributes, 'gen_ai.usage.output_tokens'))
              ELSE 0
            END
          ) AS outputTokens`,
        ])
        .from(project_id)
        .where(...conditions)
        .groupBy("date")
        .orderBy("date");

      const result = await this.client.find<any>(query);
      return result;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensCostPerHourPerProject(
    project_id: string,
    lastNHours = 168,
    userId?: string,
    model?: string
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const nHoursAgo = getFormattedTime(lastNHours);

      const conditions = [
        sql.or(
          sql.like("attributes", "%total_tokens%"),
          sql.like("attributes", "%gen_ai.usage.input_tokens%")
        ),
        sql.gte("start_time", nHoursAgo),
      ];
      if (userId) {
        conditions.push(
          sql.eq("JSONExtractString(attributes, 'user_id')", userId)
        );
      }

      if (model) {
        conditions.push(
          sql.or(
            sql.eq("JSONExtractString(attributes, 'llm.model')", model),
            sql.eq(
              "JSONExtractString(attributes, 'gen_ai.response.model')",
              model
            ),
            sql.eq(
              "JSONExtractString(attributes, 'gen_ai.request.model')",
              model
            )
          )
        );
      }

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `IF(
            JSONExtractString(attributes, 'llm.model') != '',
            JSONExtractString(attributes, 'llm.model'),
            IF(
              JSONExtractString(attributes, 'gen_ai.response.model') != '',
              JSONExtractString(attributes, 'gen_ai.response.model'),
              JSONExtractString(attributes, 'gen_ai.request.model')
            )
          ) AS model`,
          `JSONExtractString(attributes, 'langtrace.service.name') AS vendor`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'total_tokens'
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.total_tokens'), 0
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.request.total_tokens'), 0
          )
        ) AS total_tokens`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens'
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.input_tokens'), 0
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.prompt_tokens'), 0
          )
        ) AS input_tokens`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens'
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.output_tokens'), 0
          ) + COALESCE(
            JSONExtractInt(attributes, 'gen_ai.usage.completion_tokens'), 0
          )
        ) AS output_tokens`,
        ])
        .from(project_id)
        .where(...conditions)
        .groupBy("date", "model", "vendor")
        .orderBy("date");

      const result: any[] = await this.client.find(query);

      const costPerHour = result.map((row: any) => {
        const llmTokenCounts = {
          total_tokens: Number(row.total_tokens),
          input_tokens: Number(row.input_tokens),
          output_tokens: Number(row.output_tokens),
        };
        const model = row.model;
        const vendor = row.vendor.toLowerCase();
        const cost = calculatePriceFromUsage(vendor, model, llmTokenCounts);
        return {
          date: row.date,
          total: cost.total,
          input: cost.input,
          output: cost.output,
        };
      });

      return costPerHour;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensCostPerProject(project_id: string): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          total: 0,
          input: 0,
          output: 0,
        };
      }

      const query = sql.select(`
        JSONExtractString(attributes, 'llm.model') AS model,
        JSONExtractString(attributes, 'langtrace.service.name') AS vendor,
        SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'total_tokens'
          )
        ) AS total_tokens,
        SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens'
          )
        ) AS input_tokens,
        SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens'
          )
        ) AS output_tokens
        FROM ${project_id}
        WHERE JSONHas(attributes, 'llm.token.counts')
        GROUP BY JSONExtractString(attributes, 'llm.model'), JSONExtractString(attributes, 'langtrace.service.name')
      `);
      const spans: any[] = await this.client.find(query);

      let total = 0;
      let input = 0;
      let output = 0;

      spans.forEach((span) => {
        const llmTokenCounts = {
          total_tokens: Number(span.total_tokens || 0),
          input_tokens: Number(span.input_tokens || 0),
          output_tokens: Number(span.output_tokens || 0),
        };
        const model = span.model;
        const vendor = span.vendor.toLowerCase();

        const cost = calculatePriceFromUsage(vendor, model, llmTokenCounts);
        total += cost.total;
        input += cost.input;
        output += cost.output;
      });

      return {
        total,
        input,
        output,
      };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensUsedPerProject(project_id: string): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
        };
      }
      const query = sql.select(
        `JSONExtractRaw(attributes, 'llm.token.counts') AS token_counts FROM ${project_id}`
      );
      const spans: any[] = await this.client.find<Span[]>(query);
      let totalTokens = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      spans.forEach((span) => {
        const parsedAttributes = JSON.parse(span.token_counts || "{}");
        const llmTokenCounts =
          typeof parsedAttributes === "string"
            ? JSON.parse(parsedAttributes)
            : parsedAttributes;
        const token_count = Number(llmTokenCounts.total_tokens || 0);
        totalTokens += token_count;

        const input_token_count = Number(
          llmTokenCounts.input_tokens || llmTokenCounts.prompt_tokens || 0
        );
        totalInputTokens += input_token_count;

        const output_token_count = Number(
          llmTokenCounts.output_tokens || llmTokenCounts.completion_tokens || 0
        );
        totalOutputTokens += output_token_count;
      });
      return {
        totalTokens,
        totalInputTokens,
        totalOutputTokens,
      };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensUsedPerAccount(project_ids: string[]): Promise<number> {
    try {
      let totalTokens = 0;
      for (const projectId of project_ids) {
        const tokens = await this.GetTokensUsedPerProject(projectId);
        totalTokens += tokens;
      }
      return totalTokens;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetSpanLatencyPerProject(project_id: string): Promise<number> {
    try {
      const spans = await this.GetSpansInProject(project_id);
      let totalLatency = 0;
      spans.forEach((span) => {
        const latency =
          new Date(span.end_time).getTime() -
          new Date(span.start_time).getTime();
        totalLatency += latency;
      });
      return totalLatency / spans.length;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the span latency ${error}`
      );
    }
  }

  async GetSpansPerModel(
    model: string,
    project_ids: string[]
  ): Promise<Span[]> {
    try {
      let spans: Span[] = [];
      for (const projectId of project_ids) {
        const query = sql
          .select()
          .from(projectId)
          .where(sql.like("attributes", "%llm.model%"));
        const projectSpans: Span[] = await this.client.find<Span[]>(query);
        spans = spans.concat(projectSpans);
      }
      return spans.filter(
        (span) => JSON.parse(span.attributes)["llm.model"] === model
      );
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the spans per model ${error}`
      );
    }
  }

  async GetSpanLatencyPerModel(
    model: string,
    project_ids: string[]
  ): Promise<number> {
    try {
      const spans = await this.GetSpansPerModel(model, project_ids);
      let totalLatency = 0;
      spans.forEach((span) => {
        const latency =
          new Date(span.end_time).getTime() -
          new Date(span.start_time).getTime();
        totalLatency += latency;
      });
      return totalLatency / spans.length;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the span latency per model ${error}`
      );
    }
  }
}
