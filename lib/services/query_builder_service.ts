import { getFormattedTime } from "../utils";

export interface PropertyFilter {
  key: string;
  operation: "EQUALS" | "CONTAINS" | "NOT_EQUALS";
  value: string;
  type: "attribute" | "property" | "event";
}

export interface FilterItem {
  filters: PropertyFilter[];
  operation: "AND" | "OR";
}

export interface Filter {
  filters: FilterItem[] | PropertyFilter[];
  operation: "AND" | "OR";
}

export interface IQueryBuilderService {
  CountFilteredSpanAttributesQuery: (
    tableName: string,
    filters: Filter
  ) => string;
  GetFilteredSpansAttributesQuery: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
    lastNHours?: number
  ) => string;
  GetFilteredSpanAttributesSpanById: (
    tableName: string,
    spanId: string,
    filters: Filter
  ) => string;
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: Filter
  ) => string;
  GetFilteredTraceAttributesQuery: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number
  ) => string;
  GetFilteredTraceAttributesTraceById: (
    tableName: string,
    traceId: string,
    filters: Filter
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
    } else if (filter.type === "event") {
      const eventName = `arrayExists(x -> JSONExtractString(x, '${filter.key}')`;
      switch (filter.operation) {
        case "EQUALS":
          condition = `${eventName} = '${filter.value}', JSONExtractArrayRaw(events))`;
          break;
        case "CONTAINS":
          condition = `${eventName} LIKE '%${filter.value}%'`;
          break;
        case "NOT_EQUALS":
          condition = `${eventName} != '${filter.value}'`;
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

  CountFilteredSpanAttributesQuery(tableName: string, filters: Filter): string {
    let baseQuery = `COUNT(DISTINCT span_id) AS total_spans FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
    }

    return baseQuery;
  }

  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: Filter
  ): string {
    let baseQuery = `COUNT(DISTINCT trace_id) AS total_traces FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredSpansAttributesQuery(
    tableName: string,
    filters: Filter,
    pageSize: number = 10,
    offset: number = 0,
    lastNHours?: number
  ): string {
    let baseQuery = `* FROM ${tableName}`;
    let whereConditions: string[] = [];

    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
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
    filters: Filter,
    pageSize: number,
    offset: number
  ): string {
    let baseQuery = `trace_id, MIN(start_time) AS earliest_start_time FROM ${tableName}`;
    let whereConditions: string[] = [];
    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
    }

    baseQuery += ` GROUP BY trace_id ORDER BY earliest_start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    return baseQuery;
  }

  GetFilteredSpanAttributesSpanById(
    tableName: string,
    spanId: string,
    filters: Filter
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE span_id = '${spanId}'`;
    let whereConditions: string[] = [];

    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesTraceById(
    tableName: string,
    traceId: string,
    filters: Filter
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE trace_id = '${traceId}'`;
    let whereConditions: string[] = [];
    filters.filters.forEach((filter) => {
      // if it's a property filter
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        // if it's a filter item
        let subConditions: string[] = [];
        filter.filters.forEach((subFilter) => {
          subConditions.push(
            `(${this.constructCondition(subFilter as PropertyFilter)})`
          );
        });
        whereConditions.push(
          `(${subConditions.join(` ${filter.operation} `)})`
        );
      }
    });

    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filters.operation} `)})`;
    }

    return baseQuery;
  }
}
