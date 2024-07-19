import TraceGraph from "@/components/traces/trace_graph";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trace } from "@/lib/trace_util";
import { calculateTotalTime } from "@/lib/trace_utils";

export function TraceSheet({
  trace,
  open,
  setOpen,
}: {
  trace: Trace;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-3/4">
        <SheetHeader>
          <SheetTitle>Trace Details</SheetTitle>
          <div className="flex flex-col gap-4">
            <div className=" overflow-x-scroll">
              <TraceGraph
                totalSpans={trace.sorted_trace.length}
                spans={trace.trace_hierarchy}
                totalTime={calculateTotalTime(trace.sorted_trace)}
                startTime={trace.start_time.toString()}
              />
            </div>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
