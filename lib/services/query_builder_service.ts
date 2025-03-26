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
    keyword?: string,
    lastXDays?: string
  ) => string;
  GetFilteredSpansAttributesQuery: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
    lastNHours?: number,
    keyword?: string
  ) => string;
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: Filter,
    keyword?: string,
    lastXDays?: string
  ) => string;
  GetTracesWithFilters: (
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
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
          condition = `COALESCE(${attributeName}, '') = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${attributeName} LIKE '%${filter.value}%'`;
          break;
        case "NOT_EQUALS":
          condition = `COALESCE(${attributeName}, '') != '${filter.value}'`;
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

  private constructKeywordCondition(keyword: string): string {
    // Escape special characters in the keyword
    const escapedKeyword = keyword.replace(/[%_]/g, "\\$&");
    return `
      (lower(CAST(attributes AS String)) LIKE '%${escapedKeyword}%' OR
       arrayExists(x -> lower(CAST(x AS String)) LIKE '%${escapedKeyword}%', JSONExtractArrayRaw(events)))
    `;
  }

  CountFilteredSpanAttributesQuery(
    tableName: string,
    filters: Filter,
    keyword?: string,
    lastXDays?: string
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

    if (lastXDays) {
      // convert lastXDays to lastNHours
      const lastNHours = Number(lastXDays) * 24;
      const startTime = getFormattedTime(lastNHours);
      if (baseQuery.includes("WHERE")) {
        baseQuery += ` AND start_time >= '${startTime}'`;
      } else {
        baseQuery += ` WHERE start_time >= '${startTime}'`;
      }
    }

    return baseQuery;
  }

  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: Filter,
    keyword?: string,
    lastXDays?: string
  ): string {
    let baseQuery = `COUNT(DISTINCT trace_id) AS total_traces FROM ${tableName}`;
    let whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();

    filters.filters.forEach((filter) => {
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
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
      const keywordCondition = this.constructKeywordCondition(keyword);
      baseQuery += baseQuery.includes("WHERE")
        ? ` AND (${keywordCondition})`
        : ` WHERE (${keywordCondition})`;
    }

    if (lastXDays) {
      const lastNHours = Number(lastXDays) * 24;
      const startTime = getFormattedTime(lastNHours);
      baseQuery += baseQuery.includes("WHERE")
        ? ` AND start_time >= '${startTime}'`
        : ` WHERE start_time >= '${startTime}'`;
    }

    baseQuery = baseQuery.replace("WHERE", "PREWHERE");
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
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
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
      const keywordCondition = this.constructKeywordCondition(keyword);
      baseQuery += baseQuery.includes("WHERE")
        ? ` AND (${keywordCondition})`
        : ` WHERE (${keywordCondition})`;
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

  GetTracesWithFilters(
    tableName: string,
    filters: Filter,
    pageSize: number,
    offset: number,
    keyword?: string
  ): string {
    const whereConditions: string[] = [];
    keyword = keyword?.toLowerCase();

    filters.filters.forEach((filter) => {
      if ("key" in filter) {
        whereConditions.push(`(${this.constructCondition(filter)})`);
      } else {
        const subConditions: string[] = [];
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

    let filterClause =
      whereConditions.length > 0
        ? `WHERE (${whereConditions.join(` ${filters.operation} `)})`
        : "";

    if (keyword && keyword !== "") {
      const keywordCondition = this.constructKeywordCondition(keyword);
      filterClause += `${filterClause ? " AND" : "WHERE"} (${keywordCondition})`;
    }

    const query = `
      WITH latest_traces AS (
        SELECT 
          trace_id,
          min(start_time) as trace_start
        FROM ${tableName}
        ${filterClause}
        GROUP BY trace_id
        ORDER BY trace_start DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      )
      SELECT 
        groupArray(
          map(
            'name', name,
            'trace_id', trace_id,
            'span_id', span_id,
            'trace_state', trace_state,
            'kind', toString(kind),
            'parent_id', parent_id,
            'start_time', start_time,
            'end_time', end_time,
            'attributes', attributes,
            'status_code', status_code,
            'events', events,
            'links', links,
            'duration', toString(duration)
          )
        ) AS result
      FROM ${tableName} t
      INNER JOIN latest_traces lt ON t.trace_id = lt.trace_id
      ${filterClause}
      GROUP BY t.trace_id
      ORDER BY max(t.end_time) DESC`;

    return query;
  }
}
