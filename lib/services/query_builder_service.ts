export interface AttributesFilter {
  key: string;
  operation: "EQUALS" | "CONTAINS" | "NOT_EQUALS";
  value: string;
}

export interface IQueryBuilderService {
  CountFilteredSpanAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[],
    filterOperation?: string
  ) => string;
  GetFilteredSpansAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number,
    filterOperation?: string
  ) => string;
  GetFilteredSpanAttributesSpanById: (
    tableName: string,
    spanId: string,
    filters: AttributesFilter[],
    filterOperation?: string
  ) => string;
  CountFilteredTraceAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[],
    filterOperation?: string
  ) => string;
  GetFilteredTraceAttributesQuery: (
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number,
    filterOperation?: string
  ) => string;
  GetFilteredTraceAttributesTraceById: (
    tableName: string,
    traceId: string,
    filters: AttributesFilter[],
    filterOperation?: string
  ) => string;
}

export class QueryBuilderService implements IQueryBuilderService {
  CountFilteredSpanAttributesQuery(
    tableName: string,
    filters: AttributesFilter[],
    filterOperation: string = "OR"
  ): string {
    // Base query parts
    let baseQuery = `COUNT(DISTINCT span_id) AS total_spans FROM '${tableName}'`;
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  CountFilteredTraceAttributesQuery(
    tableName: string,
    filters: AttributesFilter[],
    filterOperation: string = "OR"
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredSpansAttributesQuery(
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number,
    filterOperation: string = "OR"
  ): string {
    // Base query parts
    let baseQuery = `* FROM ${tableName}`;
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    // Append LIMIT and OFFSET to the base query
    baseQuery += ` ORDER BY 'createdAt' DESC LIMIT ${pageSize} OFFSET ${offset}`;

    return baseQuery;
  }

  GetFilteredTraceAttributesQuery(
    tableName: string,
    filters: AttributesFilter[],
    pageSize: number,
    offset: number,
    filterOperation: string = "OR"
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE (${whereConditions.join(` ${filterOperation} `)})`;
    }

    // Append LIMIT and OFFSET to the base query
    baseQuery += ` GROUP BY trace_id ORDER BY earliest_start_time DESC LIMIT ${pageSize} OFFSET ${offset}`;
    return baseQuery;
  }

  GetFilteredSpanAttributesSpanById(
    tableName: string,
    spanId: string,
    filters: AttributesFilter[],
    filterOperation: string = "OR"
  ): string {
    // Base query parts
    let baseQuery = `* FROM '${tableName}' WHERE span_id = '${spanId}'`;
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` AND (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }

  GetFilteredTraceAttributesTraceById(
    tableName: string,
    traceId: string,
    filters: AttributesFilter[],
    filterOperation: string = "OR"
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
        case "NOT_EQUALS":
          condition = `${attributeName} != '${filter.value}'`;
          break;
        default:
          throw new Error(`Unsupported filter operation: ${filter.operation}`);
      }

      whereConditions.push(`(${condition})`);
    });

    // Append WHERE conditions to the base query if any
    if (whereConditions.length > 0) {
      baseQuery += ` AND (${whereConditions.join(` ${filterOperation} `)})`;
    }

    return baseQuery;
  }
}
