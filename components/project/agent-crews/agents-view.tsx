import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CrewAIAgent, CrewAITask } from "@/lib/crewai_trace_util";
import { cn } from "@/lib/utils";
import { MoveDiagonal } from "lucide-react";
import { useState } from "react";

export function AgentsView({ agents }: { agents: CrewAIAgent[] }) {
  return (
    <Accordion type="multiple" className="w-full">
      {agents.map((agent, index) => (
        <AccordionItem value={index.toString()} key={index}>
          <AccordionTrigger>{`Agent ${index + 1} - ${agent?.id}`}</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-1 rounded-md p-2">
              <p className="text-xs font-semibold mt-2">ID</p>
              <p className="w-fit mt-2">{agent?.id || "N/A"}</p>
              <p className="text-xs font-semibold mt-2">Role</p>
              <p className="w-fit mt-2">{agent?.role || "N/A"}</p>
              <p className="text-xs font-semibold mt-2">Goal</p>
              <ExpandableP content={agent?.goal || "N/A"} className="mt-2" />
              <p className="text-xs font-semibold mt-2">Backstory</p>
              <ExpandableP
                content={agent?.backstory || "N/A"}
                className="mt-2"
              />
              <p className="text-xs font-semibold mt-2">Result</p>
              <ExpandableP content={agent?.result || "N/A"} className="mt-2" />
              <p className="text-xs font-semibold mt-2">Max Iter</p>
              <p className="w-fit mt-2">{agent?.max_iter || "N/A"}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function TasksView({ tasks }: { tasks: CrewAITask[] }) {
  return (
    <Accordion type="multiple" className="w-full">
      {tasks.map((task, index) => (
        <AccordionItem value={index.toString()} key={index}>
          <AccordionTrigger>{`Task ${index + 1} - ${task?.id}`}</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-1 rounded-md p-2">
              <p className="text-xs font-semibold mt-2">ID</p>
              <p className="w-fit mt-2">{task?.id || "N/A"}</p>
              <p className="text-xs font-semibold mt-2">Description</p>
              <ExpandableP
                content={task?.description || "N/A"}
                className="mt-2"
              />
              <p className="text-xs font-semibold mt-2">Agent</p>
              <p className="w-fit mt-2">{task?.agent || "N/A"}</p>
              <p className="text-xs font-semibold mt-2">Used Tools</p>
              <p className="text-xs font-semibold mt-2">
                {task?.used_tools || "N/A"}
              </p>
              <p className="text-xs font-semibold mt-2">Tool Errors</p>
              <ExpandableP content={task?.tool_errors || "N/A"} />
              <p className="text-xs font-semibold mt-2">Human Input</p>
              <p className="text-xs font-semibold mt-2">
                {task?.human_input || "False"}
              </p>
              <p className="text-xs font-semibold mt-2">Expected Output</p>
              <ExpandableP
                content={task?.expected_output || "N/A"}
                className="mt-2"
              />
              <p className="text-xs font-semibold mt-2">Result</p>
              <ExpandableP content={task?.result || "N/A"} className="mt-2" />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function ExpandableP({
  content,
  className,
}: {
  content: any;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn(
        "flex w-fit",
        !expanded ? "min-h-fit max-h-24 overflow-y-scroll" : "",
        className
      )}
    >
      <p>{content}</p>
      <Button
        variant={"ghost"}
        onClick={() => setExpanded(!expanded)}
        size={"sm"}
      >
        <MoveDiagonal size={16} />
      </Button>
    </div>
  );
}
