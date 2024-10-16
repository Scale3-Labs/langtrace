import { Info } from "@/components/shared/info";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, UploadIcon } from "@radix-ui/react-icons";
import { Check } from "lucide-react";
import papa from "papaparse";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export function UploadCsv({
  datasetId,
  projectId,
  disabled = false,
  className = "",
}: {
  datasetId?: string;
  projectId?: string;
  disabled?: boolean;
  className?: string;
}) {
  const csvFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [csvFields, setCsvFields] = useState<string[]>([]);
  const [myData, setMyData] = useState<any[]>([]);
  const [selectedInputHeader, setSelectedInputHeader] = useState<string>("");
  const [selectedOutputHeader, setSelectedOutputHeader] = useState<string>("");
  const [selectedNoteHeader, setSelectedNoteHeader] = useState<string>("");
  const MAX_UPLOAD_SIZE = 1024 * 1024 * 0.5; // 0.5MB = 512KB
  const ACCEPTED_FILE_TYPES = ["text/csv"];
  const schema = z.object({
    file: z
      .custom<File>((val) => val instanceof File, "Please upload a file")
      .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
        message: "Please select csv files only",
      })
      .refine((file) => file.size <= MAX_UPLOAD_SIZE, {
        message: "Your file is too large, file has to be a max of 512KB",
      }),
  });

  const CreateDataForm = useForm({
    resolver: zodResolver(schema),
  });

  const parseData = (files: FileList) => {
    let file: any = files[0];
    papa.parse(file, {
      skipEmptyLines: true,
      header: true,
      complete: (result: any) => {
        const papa_data: any[] = result.data.map((row: any) => {
          return row;
        });
        setMyData(papa_data ?? []);
        const newFields: string[] = result.meta.fields?.map((field: any) => {
          return field;
        })!;
        setCsvFields(newFields ?? []);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={"outline"} className={className}>
          Upload csv <UploadIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Data</DialogTitle>
          <DialogDescription>
            Upload a csv file to create data for the dataset.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateDataForm}>
          <form
            onSubmit={CreateDataForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/data", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    datas: myData,
                    datasetId,
                    projectId,
                  }),
                });
                await queryClient.invalidateQueries(datasetId);
                toast("Data added!", {
                  description: "Your data has been added.",
                });
                setOpen(false);
                CreateDataForm.reset();
              } catch (error: any) {
                toast("Error added your data!", {
                  description: `There was an error added your data: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Select a CSV File
                    <Info
                      information="Upload a CSV file to create data for the dataset. The CSV file should have the an 'input', 'output' and 'note' columns."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(event) => {
                        field.onChange(event.target?.files?.[0] ?? undefined);
                        event.target.files!.length > 0 &&
                        event.target.files![0].type == "text/csv"
                          ? parseData(csvFileRef.current?.files!)
                          : setCsvFields([]);
                      }}
                      ref={csvFileRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Label>Input</Label>
                <Info
                  information="The input column is the column that contains the input data."
                  className="inline-block ml-2"
                />
              </div>
              <div className="flex flex-col gap-2">
                <HeaderSelect
                  headers={csvFields}
                  setSelectedHeader={setSelectedInputHeader}
                  selectedHeader={selectedInputHeader}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Output</Label>
                  <Info
                    information="The output column is the column that contains the output data."
                    className="inline-block ml-2"
                  />
                </div>
                <HeaderSelect
                  headers={csvFields}
                  setSelectedHeader={setSelectedOutputHeader}
                  selectedHeader={selectedOutputHeader}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Note</Label>
                  <Info
                    information="The note column is the column that contains the note data."
                    className="inline-block ml-2"
                  />
                </div>
                <HeaderSelect
                  headers={csvFields}
                  setSelectedHeader={setSelectedNoteHeader}
                  selectedHeader={selectedNoteHeader}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  busy ||
                  !selectedInputHeader ||
                  !selectedOutputHeader ||
                  !selectedNoteHeader
                }
              >
                Create Data
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function HeaderSelect({
  headers,
  setSelectedHeader,
  selectedHeader,
}: {
  headers: string[];
  setSelectedHeader: (header: string) => void;
  selectedHeader: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full z-[920] justify-between"
        >
          {selectedHeader
            ? headers.length > 0
              ? headers.find((header: string) => header === selectedHeader)
              : "No headers found"
            : "Select header..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[920] w-[370px] p-0">
        <Command>
          <CommandInput placeholder="Search header..." />
          <CommandEmpty>No header found.</CommandEmpty>
          <CommandGroup>
            {headers.length > 0 ? (
              headers.map((header: string, index: number) => (
                <CommandItem
                  key={index}
                  value={header}
                  onSelect={(currentValue) => {
                    setSelectedHeader(
                      currentValue === selectedHeader ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedHeader === header ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {header}
                </CommandItem>
              ))
            ) : (
              <CommandItem>No headers found</CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
