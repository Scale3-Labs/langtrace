export interface AttributesFilter {
  key: string;
  operation: "EQUALS" | "CONTAINS";
  value: string;
}

export interface IQueryBuilderService {
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[]
  ) => string;
  GetFilteredTraceAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number
  ) => string;
  GetFilteredTraceAttributesTraceById: (
    tableName: string,
    traceId: string,
    filters: AttributesFilter[]
  ) => string;
}

export class QueryBuilderService implements IQueryBuilderService {
  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: AttributesFilter[]
  ): string {
    // Base query parts
    let baseQuery = `COUNT(DISTINCT trace_id) AS total_traces FROM '${tableName}'`;
    let whereConditions: string[] = [];

    // Iterate over filters to construct WHERE conditions
    filters.forEach((filter) => {
      const attributeName = `JSONExtractString(attributes, '${filter.key}')`;
      let condition: string;

      switch (filter.operation) {
        case "EQUALS":
          condition = `${attributeName} = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${attributeName} LIKE '%${filter.value}%'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(" OR ")}`;
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesQuery(
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number
  ): string {
    // Base query parts
    let baseQuery = `trace_id, MIN(start_time) AS earliest_start_time FROM '${tableName}'`;
    let whereConditions: string[] = [];

    // Iterate over filters to construct WHERE conditions
    filters.forEach((filter) => {
      const attributeName = `JSONExtractString(attributes, '${filter.key}')`;
      let condition: string;

      switch (filter.operation) {
        case "EQUALS":
          condition = `${attributeName} = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${attributeName} LIKE '%${filter.value}%'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(" OR ")}`;
    }

    // Append LIMIT and OFFSET to the base query
    baseQuery += ` GROUP BY trace_id ORDER BY earliest_start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    return baseQuery;
  }

  GetFilteredTraceAttributesTraceById(
    tableName: string,
    traceId: string,
    filters: AttributesFilter[]
  ): string {
    // Base query parts
    let baseQuery = `* FROM '${tableName}' WHERE trace_id = '${traceId}'`;
    let whereConditions: string[] = [];

    // Iterate over filters to construct WHERE conditions
    filters.forEach((filter) => {
      const attributeName = `JSONExtractString(attributes, '${filter.key}')`;
      let condition: string;

      switch (filter.operation) {
        case "EQUALS":
          condition = `${attributeName} = '${filter.value}'`;
          break;
        case "CONTAINS":
          condition = `${attributeName} LIKE '%${filter.value}%'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` AND (${whereConditions.join(" OR ")})`;
    }

    return baseQuery;
  }
}
