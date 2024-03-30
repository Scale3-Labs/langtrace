
interface SchemaValue { type: any, default?: string }
/**
 * One of order_by or primary_key must be specified.
 * Additional options can be added to the schema which are appended to the end of create table query. For example, TTL time + INTERVAL 1 MONTH DELETE would
 */
export interface ChSchemaOptions { auto_create?: boolean, primary_key?: string, order_by?: string, engine?: string, table_name?: string, additional_options?: string[] }
export type ChSchema = Record<string, SchemaValue>

export class ClickhouseSchema<T extends ChSchema> {
  readonly schema: T
  private readonly options: ChSchemaOptions

  constructor (schema: T, options: ChSchemaOptions) {
    this.schema = schema
    this.options = options
  }

  GetOptions (): ChSchemaOptions {
    return this.options
  }
}
