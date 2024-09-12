import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PAGE_SIZE } from "@/lib/constants";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { StackIcon } from "@radix-ui/react-icons";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { ConversationRow } from "../project/traces/conversation-row";
import TraceRowSkeleton from "../shared/row-skeleton";
import { SetupInstructions } from "../shared/setup-instructions";
import { Spinner } from "../shared/spinner";
import { Button } from "../ui/button";

export default function ImportTraceConversation({
  setMessages,
}: {
  setMessages: (messages: any) => void;
}) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [enableFetch, setEnableFetch] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    setShowLoader(true);
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setEnableFetch(true);
  }, []);

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchTraces.refetch();
    }
  });

  const fetchTraces = useQuery({
    queryKey: ["fetch-traces-query"],
    queryFn: async () => {
      const apiEndpoint = "/api/traces";
      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: {
          operation: "AND",
          filters: [
            {
              key: "langtrace.service.type",
              operation: "EQUALS",
              value: "llm",
              type: "attribute",
            },
          ],
        },
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch traces");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

        setCurrentData(updatedData);
      } else {
        setCurrentData(newData);
      }

      setEnableFetch(false);
      setShowLoader(false);
    },
    onError: (error) => {
      setEnableFetch(false);
      setShowLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger>
        <Button
          type="button"
          size="sm"
          className="w-full flex justify-start gap-2"
          variant={"ghost"}
          onClick={() => {
            setOpenDialog(true);
          }}
        >
          <StackIcon className="h-4 w-4" />
          Import Traced Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-6xl h-[600px] overflow-y-scroll">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-left text-lg mb-4">
            Select a conversation to import
          </Label>
          <div className="grid grid-cols-12 items-center p-3 bg-muted">
            <p className="ml-10 text-xs font-medium">
              Time <span>&#8595;</span> Local
            </p>
            <p className="text-xs font-medium">Model</p>
            <p className="text-xs font-medium col-span-2">Input</p>
            <p className="text-xs font-medium col-span-2">Output</p>
          </div>
          {fetchTraces.isLoading || !fetchTraces?.data || !currentData ? (
            <PageSkeleton />
          ) : (
            <div
              className="flex flex-col rounded-md border border-muted h-[450px] overflow-y-scroll"
              ref={scrollableDivRef as any}
            >
              {!fetchTraces.isLoading &&
                fetchTraces?.data &&
                currentData?.map((trace: any, i: number) => {
                  return (
                    <div key={i} className="px-3">
                      <ConversationRow
                        trace={trace}
                        utcTime={false}
                        importTrace={true}
                        setMessages={(messages: any[]) => {
                          setMessages(messages);
                          setOpenDialog(false);
                        }}
                      />{" "}
                    </div>
                  );
                })}
              {showLoader && (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8 text-center" />
                </div>
              )}
              {page < totalPages && (
                <div className="bg-gradient-to-t from-muted-foreground to-transparent absolute bottom-0 left-0 right-0 h-12" />
              )}
              {!fetchTraces.isLoading &&
                fetchTraces?.data &&
                currentData?.length === 0 &&
                !showLoader && (
                  <div className="flex flex-col gap-3 items-center justify-center p-4">
                    <p className="text-muted-foreground text-sm mb-3">
                      No traces available. Get started by setting up Langtrace
                      in your application.
                    </p>
                    <SetupInstructions project_id={project_id} />
                  </div>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen">
      {Array.from({ length: 3 }).map((_, index) => (
        <TraceRowSkeleton key={index} />
      ))}
    </div>
  );
}
