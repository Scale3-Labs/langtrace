import {
  ClickhouseDataTypes,
  InferSchemaTypeClickhouse,
} from "../framework/data_types";
import { ClickhouseSchema } from "../framework/schema";

export const SpanSchema = new ClickhouseSchema(
  {
    name: { type: ClickhouseDataTypes.String },
    trace_id: { type: ClickhouseDataTypes.String },
    span_id: { type: ClickhouseDataTypes.String },
    trace_state: { type: ClickhouseDataTypes.String },
    kind: { type: ClickhouseDataTypes.Int16 },
    parent_id: { type: ClickhouseDataTypes.String },
    start_time: { type: ClickhouseDataTypes.String },
    end_time: { type: ClickhouseDataTypes.String },
    attributes: { type: ClickhouseDataTypes.String },
    status_code: { type: ClickhouseDataTypes.String },
    events: { type: ClickhouseDataTypes.String },
    links: { type: ClickhouseDataTypes.String },
    duration: { type: ClickhouseDataTypes.Float64 },
  },
  {}
);

export type Span = InferSchemaTypeClickhouse<typeof SpanSchema>;
