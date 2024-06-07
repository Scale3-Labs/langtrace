import { getFormattedTime } from "../utils";

export interface PropertyFilter {
  key: string;
  operation: "EQUALS" | "CONTAINS" | "NOT_EQUALS";
  value: string;
  type: "attribute" | "property"; // New field to distinguish between attribute and property filters
}

export interface IQueryBuilderService {
  CountFilteredSpanAttributesQuery: (
    tableName: string,
    filters: PropertyFilter[],
    filterOperation?: string
  ) => string;
  GetFilteredSpansAttributesQuery: (
    tableName: string,
    filters: PropertyFilter[],
    pageSize: number,
    offset: number,
    filterOperation?: string,
    lastNHours?: number
  ) => string;
  GetFilteredSpanAttributesSpanById: (
    tableName: string,
    spanId: string,
    filters: PropertyFilter[],
    filterOperation?: string
  ) => string;
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: PropertyFilter[],
    filterOperation?: string
  ) => string;
  GetFilteredTraceAttributesQuery: (
    tableName: string,
    filters: PropertyFilter[],
    pageSize: number,
    offset: number,
    filterOperation?: string
  ) => string;
  GetFilteredTraceAttributesTraceById: (
    tableName: string,
    traceId: string,
    filters: PropertyFilter[],
    filterOperation?: string
  ) => string;
}

export class QueryBuilderService implements IQueryBuilderService {
  private constructCondition(filter: PropertyFilter): string {
    let condition: string;
    if (filter.type === "attribute") {
      const attributeName = `JSONExtractString(attributes, '${filter.key}')`;
      switch (filter.operation) {
        case "EQUALS":
          condition = `${attributeName} = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${attributeName} LIKE '%${filter.value}%'`;
          break;
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }
    } else {
      switch (filter.operation) {
        case "EQUALS":
          condition = `${filter.key} = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${filter.key} LIKE '%${filter.value}%'`;
          break;
        case "NOT_EQUALS":
          condition = `${filter.key} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }
    }
    return condition;
  }

  CountFilteredSpanAttributesQuery(
    tableName: string,
    filters: PropertyFilter[],
    filterOperation: string = "OR"
  ): string {
    let baseQuery = `COUNT(DISTINCT span_id) AS total_spans FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: PropertyFilter[],
    filterOperation: string = "OR"
  ): string {
    let baseQuery = `COUNT(DISTINCT trace_id) AS total_traces FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredSpansAttributesQuery(
    tableName: string,
    filters: PropertyFilter[],
    pageSize: number = 10,
    offset: number = 0,
    filterOperation: string = "OR",
    lastNHours?: number
  ): string {
    let baseQuery = `* FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    if (lastNHours) {
      const startTime = getFormattedTime(lastNHours);
      baseQuery += ` AND start_time >= '${startTime}'`;
      baseQuery += ` ORDER BY start_time DESC`;
    } else {
      baseQuery += ` ORDER BY start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesQuery(
    tableName: string,
    filters: PropertyFilter[],
    pageSize: number,
    offset: number,
    filterOperation: string = "OR"
  ): string {
    let baseQuery = `trace_id, MIN(start_time) AS earliest_start_time FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    baseQuery += ` GROUP BY trace_id ORDER BY earliest_start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    return baseQuery;
  }

  GetFilteredSpanAttributesSpanById(
    tableName: string,
    spanId: string,
    filters: PropertyFilter[],
    filterOperation: string = "OR"
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE span_id = '${spanId}'`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` AND (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesTraceById(
    tableName: string,
    traceId: string,
    filters: PropertyFilter[],
    filterOperation: string = "OR"
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE trace_id = '${traceId}'`;
    let whereConditions: string[] = [];

    filters.forEach((filter) => {
      whereConditions.push(`(${this.constructCondition(filter)})`);
    });

    if (whereConditions.length > 0) {
      baseQuery += ` AND (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }
}
