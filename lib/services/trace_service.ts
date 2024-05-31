import { Span, SpanSchema } from "@/lib/clients/scale3_clickhouse/models/span";
import { format } from "date-fns";
import sql from "sql-bricks";
import { ClickhouseBaseClient } from "../clients/scale3_clickhouse/client/client";
import { calculatePriceFromUsage } from "../utils";
import {
  IQueryBuilderService,
  PropertyFilter,
  QueryBuilderService,
} from "./query_builder_service";

export interface PaginationResult<T> {
  result: T[];
  metadata?: { page?: number; page_size?: number; total_pages: number };
}

function getFormattedTime(lastNHours: number): string {
  const nHoursAgo = format(
    new Date(Date.now() - lastNHours * 60 * 60 * 1000),
    "yyyy-MM-dd HH:mm:ss"
  );
  return nHoursAgo;
}

export interface ITraceService {
  GetTotalTracePerHourPerProject: (
    project_id: string,
    lastNHours?: number
  ) => Promise<number>;
  GetTotalSpansPerHourPerProject: (
    project_id: string,
    lastNHours?: number
  ) => Promise<number>;
  GetTokensUsedPerHourPerProject: (
    project_id: string,
    lastNHours?: number
  ) => Promise<number>;
  GetTokensCostPerHourPerProject: (
    project_id: string,
    lastNHours?: number
  ) => Promise<number>;
  GetAverageTraceLatenciesPerHourPerProject(
    project_id: string,
    lastNHours?: number
  ): Promise<any>;
  GetTokensCostPerProject: (project_id: string) => Promise<any>;
  GetTotalTracesPerProject: (project_id: string) => Promise<number>;
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
    filters?: PropertyFilter[]
  ) => Promise<PaginationResult<Span>>;
  GetSpansInProject: (project_id: string, lastNDays: number) => Promise<Span[]>;
  GetTracesInProjectPaginated: (
    project_id: string,
    page: number,
    pageSize: number,
    filters?: PropertyFilter[]
  ) => Promise<PaginationResult<Span[]>>;
  GetTokensUsedPerProject: (project_id: string) => Promise<any>;
  GetTokensUsedPerAccount: (project_ids: string[]) => Promise<number>;
  GetSpanById: (span_id: string, project_id: string) => Promise<Span>;
  GetTraceById: (trace_id: string, project_id: string) => Promise<Span[]>;
  GetSpansWithAttribute: (
    attribute: string,
    project_id: string,
    page: number,
    pageSize: number
  ) => Promise<PaginationResult<Span>>;
  GetFailedSpans: (project_id: string) => Promise<Span[]>;
  GetSpanLatencyPerProject: (project_id: string) => Promise<number>;
  GetSpansPerModel: (model: string, project_ids: string[]) => Promise<Span[]>;
  GetSpanLatencyPerModel: (
    model: string,
    project_ids: string[]
  ) => Promise<number>;
  AddSpans: (spans: Span[], project_id: string) => Promise<void>;
}

export class TraceService implements ITraceService {
  private readonly client: ClickhouseBaseClient;
  private readonly queryBuilderService: IQueryBuilderService;
  constructor() {
    this.client = new ClickhouseBaseClient();
    this.queryBuilderService = new QueryBuilderService();
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
    lastNHours = 168
  ): Promise<any> {
    const nHoursAgo = getFormattedTime(lastNHours);
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `count(*) AS spanCount`,
        ])
        .from(project_id)
        .where(sql.gte("start_time", nHoursAgo))
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

  async GetTotalTracesPerProject(project_id: string): Promise<number> {
    try {
      // check if the table exists
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return 0;
      }

      const query = sql
        .select("COUNT(DISTINCT trace_id) AS total_traces")
        .from(project_id);
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
    lastNHours = 168
  ): Promise<any> {
    const nHoursAgo = getFormattedTime(lastNHours);
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `COUNT(DISTINCT trace_id) AS traceCount`,
        ])
        .from(project_id)
        .where(sql.gte("start_time", nHoursAgo))
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
    pageSize: number
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
      const query = sql.select(
        `* FROM ${project_id} WHERE attributes LIKE '%${attribute}%' ORDER BY 'start_time' DESC LIMIT ${pageSize} OFFSET ${
          (page - 1) * pageSize
        };`
      );
      let spans: Span[] = await this.client.find<Span[]>(query);
      // filter and remove empty attributes
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
    filters: PropertyFilter[] = [],
    filterOperation: string = "OR"
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
          filters,
          filterOperation
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
          (page - 1) * pageSize,
          filterOperation
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
    lastNHours = 168
  ): Promise<Span[]> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }
      const query = sql.select().from(project_id);
      if (!lastNHours) {
        return await this.client.find<Span[]>(query);
      } else {
        const nHoursAgo = getFormattedTime(lastNHours);
        query.where(sql.gte("start_time", nHoursAgo));

        return await this.client.find<Span[]>(query);
      }
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
    filters: PropertyFilter[] = [],
    filterOperation: string = "OR"
  ): Promise<PaginationResult<Span[]>> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return {
          result: [],
          metadata: { page, page_size: pageSize, total_pages: 1 },
        };
      }

      // Query strategy: get page offset, get trace ids, get the traces

      // build the pagination metadata
      const getTotalTracesPerProjectQuery = sql.select(
        this.queryBuilderService.CountFilteredTraceAttributesQuery(
          project_id,
          filters,
          filterOperation
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

      // get all span IDs grouped by trace_id and sort by start_time in descending order
      const getTraceIdsQuery = sql.select(
        this.queryBuilderService.GetFilteredTraceAttributesQuery(
          project_id,
          filters,
          pageSize,
          (page - 1) * pageSize,
          filterOperation
        )
      );
      const spans: Span[] = await this.client.find<Span[]>(getTraceIdsQuery);

      // get all traces
      const traces: Span[][] = [];
      for (const span of spans) {
        const getTraceByIdQuery = sql.select(
          this.queryBuilderService.GetFilteredTraceAttributesTraceById(
            project_id,
            span.trace_id,
            filters,
            filterOperation
          )
        );
        const trace = await this.client.find<Span[]>(getTraceByIdQuery);
        traces.push(trace);
      }
      return { result: traces, metadata: md };
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the trace ${error}`
      );
    }
  }

  async GetAverageTraceLatenciesPerHourPerProject(
    project_id: string,
    lastNHours = 168
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

      // Directly embedding the ClickHouse-specific functions within string literals
      let innerSelect = sql
        .select(
          "trace_id",
          "min(parseDateTime64BestEffort(start_time)) AS minStart",
          "max(parseDateTime64BestEffort(end_time)) AS maxEnd",
          "(toUnixTimestamp(max(parseDateTime64BestEffort(end_time))) - toUnixTimestamp(min(parseDateTime64BestEffort(start_time)))) * 1000 AS duration"
        )
        .from(project_id)
        .where(sql.gte("start_time", nHoursAgo))
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
    lastNHours = 168
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const nHoursAgo = getFormattedTime(lastNHours);

      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `groupArray(attributes) AS attributes_list`,
        ])
        .from(project_id)
        .where(
          sql.like("attributes", "%total_tokens%"),
          sql.gte("start_time", nHoursAgo)
        )
        .groupBy("date")
        .orderBy("date");
      const result = await this.client.find<any>(query);

      // calculate total tokens used per day
      const tokensUsedPerHour = result.map((row: any) => {
        let totalTokens = 0;
        let inputTokens = 0;
        let outputTokens = 0;
        row.attributes_list.forEach((attributes: any) => {
          const parsedAttributes = JSON.parse(attributes);
          const llmTokenCounts = parsedAttributes["llm.token.counts"]
            ? JSON.parse(parsedAttributes["llm.token.counts"])
            : {};
          const token_count = llmTokenCounts.total_tokens || 0;
          totalTokens += token_count;

          const input_token_count =
            "input_tokens" in llmTokenCounts
              ? llmTokenCounts.input_tokens
              : "prompt_tokens" in llmTokenCounts
              ? llmTokenCounts.prompt_tokens
              : 0;
          inputTokens += input_token_count;

          const output_token_count =
            "output_tokens" in llmTokenCounts
              ? llmTokenCounts.output_tokens
              : "completion_tokens" in llmTokenCounts
              ? llmTokenCounts.completion_tokens
              : 0;
          outputTokens += output_token_count;
        });
        return {
          date: row.date,
          totalTokens,
          inputTokens,
          outputTokens,
        };
      });

      return tokensUsedPerHour;
    } catch (error) {
      throw new Error(
        `An error occurred while trying to get the tokens used ${error}`
      );
    }
  }

  async GetTokensCostPerHourPerProject(
    project_id: string,
    lastNHours = 168 // Default to 168 hours (7 days)
  ): Promise<any> {
    try {
      const tableExists = await this.client.checkTableExists(project_id);
      if (!tableExists) {
        return [];
      }

      const nHoursAgo = getFormattedTime(lastNHours);
      const query = sql
        .select([
          `toDate(parseDateTimeBestEffort(start_time)) AS date`,
          `JSONExtractString(attributes, 'llm.model') AS model`,
          `JSONExtractString(attributes, 'langtrace.service.name') AS vendor`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'total_tokens'
          )
        ) AS total_tokens`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'input_tokens'
          )
        ) AS input_tokens`,
          `SUM(
          JSONExtractInt(
            JSONExtractString(attributes, 'llm.token.counts'), 'output_tokens'
          )
        ) AS output_tokens`,
        ])
        .from(project_id)
        .where(
          sql.like("attributes", "%total_tokens%"),
          sql.gte("start_time", nHoursAgo)
        )
        .groupBy("date", "model", "vendor")
        .orderBy("date");

      const result: any[] = await this.client.find(query);

      const costPerHour = result.map((row: any) => {
        const llmTokenCounts = {
          total_tokens: row.total_tokens,
          input_tokens: row.input_tokens,
          output_tokens: row.output_tokens,
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
          total_tokens: span.total_tokens,
          input_tokens: span.input_tokens,
          output_tokens: span.output_tokens,
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
        const token_count = llmTokenCounts.total_tokens || 0;
        totalTokens += token_count;

        const input_token_count =
          llmTokenCounts.input_tokens || llmTokenCounts.prompt_tokens || 0;
        totalInputTokens += input_token_count;

        const output_token_count =
          llmTokenCounts.output_tokens || llmTokenCounts.completion_tokens || 0;
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
