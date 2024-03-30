export function convertTracesToHierarchy(trace: any[]): any[] {
  // First, sort the traces based on start_time, then end_time
  trace.sort((a, b) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? -1 : 1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  // Step 1: Create a mapping from span_id to span, and prepare an array for top-level spans.
  const spanMap: Record<string, any> = {};
  trace.forEach((span) => {
    spanMap[span.span_id] = span;
    span.children = []; // Initialize an empty children array for each span
  });

  const topLevelSpans: any[] = [];

  // Step 2: Populate the children arrays and identify top-level spans.
  trace.forEach((span) => {
    if (span.parent_id && span.parent_id in spanMap) {
      spanMap[span.parent_id].children!.push(span);
    } else {
      topLevelSpans.push(span);
    }
  });

  return topLevelSpans;
}

function sortByTime(spans: any[]): any[] {
  return spans.sort((a, b) => {
    const startTimeComparison = a.start_time.localeCompare(b.start_time);
    if (startTimeComparison !== 0) return startTimeComparison;
    return a.end_time.localeCompare(b.end_time);
  });
}

export function calculateTotalTime(spans: any[]): number {
  if (spans.length === 0) return 0;

  const sortedSpans = sortByTime(spans);
  const earliestStartTime = sortedSpans[0].start_time;
  const latestEndTime = sortedSpans[sortedSpans.length - 1].end_time;

  // Assuming start_time and end_time are ISO 8601 strings, we can convert them to Date objects to calculate the difference.
  const start = new Date(correctTimestampFormat(earliestStartTime)).getTime();
  const end = new Date(correctTimestampFormat(latestEndTime)).getTime();

  // The result is in milliseconds, convert to seconds if necessary
  const totalTimeMs = end - start;

  // Return total time in milliseconds or convert to another unit as required
  return totalTimeMs;
}

export function correctTimestampFormat(timestamp: string) {
  // Corrects the format by removing the additional ".xxx" before the "Z"
  return timestamp.replace(/(\.\d{3})\.\d+Z$/, "$1Z");
}
