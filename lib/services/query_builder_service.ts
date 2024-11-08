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
    filters: Filter,
    keyword?: string
  ) => string;
  GetFilteredSpansAttributesQuery: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
    lastNHours?: number,
    keyword?: string
  ) => string;
  GetFilteredSpanAttributesSpanById: (
    tableName: string,
    spanId: string,
    filters: Filter,
    keyword?: string
  ) => string;
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: Filter,
    keyword?: string
  ) => string;
  GetFilteredTraceAttributesQuery: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
    keyword?: string
  ) => string;
  GetFilteredTraceAttributesTraceById: (
    tableName: string,
    traceId: string,
    filters: Filter,
    keyword?: string
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
          condition = `${eventName} LIKE '%${filter.value}%', JSONExtractArrayRaw(events))`;
          break;
        case "NOT_EQUALS":
          condition = `${eventName} != '${filter.value}', JSONExtractArrayRaw(events))`;
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
    filters: Filter,
    keyword?: string
  ): string {
    let baseQuery = `COUNT(DISTINCT span_id) AS total_spans FROM ${tableName}`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();

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

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
    }

    return baseQuery;
  }

  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: Filter,
    keyword?: string
  ): string {
    let baseQuery = `COUNT(DISTINCT trace_id) AS total_traces FROM ${tableName}`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();
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

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
    }

    return baseQuery;
  }

  GetFilteredSpansAttributesQuery(
    tableName: string,
    filters: Filter,
    pageSize: number = 10,
    offset: number = 0,
    lastNHours?: number,
    keyword?: string
  ): string {
    let baseQuery = `* FROM ${tableName}`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();
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

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (match(CAST(attributes AS String), '${keyword}') OR arrayExists(x -> position(x, '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (match(CAST(attributes AS String), '${keyword}') OR arrayExists(x -> position(x, '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
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
    offset: number,
    keyword?: string
  ): string {
    let baseQuery = `trace_id, MIN(start_time) AS earliest_start_time FROM ${tableName}`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();
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

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
    }

    baseQuery += ` GROUP BY trace_id ORDER BY earliest_start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    return baseQuery;
  }

  GetFilteredSpanAttributesSpanById(
    tableName: string,
    spanId: string,
    filters: Filter,
    keyword?: string
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE span_id = '${spanId}'`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();
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
      baseQuery += ` AND (${whereConditions.join(` ${filters.operation} `)})`;
    }

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesTraceById(
    tableName: string,
    traceId: string,
    filters: Filter,
    keyword?: string
  ): string {
    let baseQuery = `* FROM ${tableName} WHERE trace_id = '${traceId}'`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();
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
      baseQuery += ` AND (${whereConditions.join(` ${filters.operation} `)})`;
    }

    if (keyword !== "" && keyword !== undefined) {
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      } else {
        baseQuery += ` WHERE (position(lower(CAST(attributes AS String)), '${keyword}') > 0 OR arrayExists(x -> position(lower(x), '${keyword}') > 0, JSONExtractArrayRaw(events)))`;
      }
    }

    return baseQuery;
  }
}
