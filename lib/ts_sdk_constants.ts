import {
  DatabaseSpanAttributeNames,
  Event,
  FrameworkSpanAttributeNames,
  LLMSpanAttributeNames,
  TracedFunctionsByVendor,
  Vendor,
  Vendors,
} from "@langtrase/trace-attributes";
import { extractPropertyNames } from "./utils";

export const VendorsLocal = Vendors;

export const EventsLocal = Object.values(Event);

export type VendorsLocal = Vendor;

export const SpanAttributes = extractPropertyNames(
  DatabaseSpanAttributeNames,
  FrameworkSpanAttributeNames,
  LLMSpanAttributeNames
);

export const TracedFunctionsByVendorsLocal = TracedFunctionsByVendor;
