import { Span } from "@/lib/clients/scale3_clickhouse/models/span";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";

const CustomEdge = ({ id, data, ...props }: any) => {
  const [edgePath, labelX, labelY] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "#000000",
            padding: 1,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
            color: "#ffffff",
          }}
          className='nodrag nopan'
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default function LanggraphView({ trace }: { trace: Span[] }) {
  // construct the nodes and edges from the trace
  let x = 0;
  let y = 0;
  const nodes = [
    { id: "__start__", data: { label: "Start" }, position: { x: 0, y: 0 } },
  ];
  const edges = [];
  try {
    for (const span of trace) {
      const attributes = JSON.parse(span.attributes);
      if (Object.keys(attributes).length > 0) {
        const vendor = attributes["langtrace.service.name"].toLowerCase();
        const node = attributes["langgraph.node"];
        const edge = attributes["langgraph.edge"];
        const task = attributes["langgraph.task.name"];
        if (vendor === "langgraph" && node) {
          x += 200;
          y += 200;
          const pNode = JSON.parse(node);
          nodes.push({
            id: pNode?.name || span.span_id,
            data: {
              label:
                `${pNode?.name} (action: ${pNode.action})}` || span.span_id,
            },
            position: { x, y },
          });
        }

        if (vendor === "langgraph" && edge) {
          const pEdge = JSON.parse(edge);
          if (task === "add_conditional_edges") {
            const pathMap = pEdge?.path_map;
            if (pathMap) {
              for (const k of Object.keys(pathMap)) {
                edges.push({
                  id: `${pEdge?.source || "source"}-${
                    pathMap[k] || "destination"
                  }`,
                  data: { label: `${pEdge?.path} (output: ${k})` || "" },
                  source: pEdge?.source || "source",
                  target: pathMap[k] || "destination",
                  type: "custom",
                  animated: true,
                });
              }
            }
          } else {
            edges.push({
              id: `${pEdge?.source || "source"}-${
                pEdge?.destination || "destination"
              }`,
              source: pEdge?.source || "source",
              target: pEdge?.destination || "destination",
            });
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  nodes.push({
    id: "__end__",
    data: { label: "End" },
    position: { x: 0, y: y + 200 },
  });

  return (
    <div style={{ height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={{
          custom: CustomEdge,
        }}
        draggable={true}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
