import { Info } from "@/components/shared/info";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, UploadIcon } from "@radix-ui/react-icons";
import { SelectGroup, SelectTrigger } from "@radix-ui/react-select";
import papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";
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
  const [selectedInputOption, setSelectedInputOption] = useState<string>();
  const [selectedOutputOption, setSelectedOutputOption] = useState<string>();
  const [selectedNoteOption, setSelectedNoteOption] = useState<string>("");
  const [myData, setMyData] = useState<any[]>([]);

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
    input: z.string().min(1),
    output: z.string().min(1),
    note: z.string().min(1).optional(),
  });

  const CreateDataForm = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open == false) {
      setSelectedInputOption("");
      setSelectedOutputOption("");
      setSelectedNoteOption("");
      setCsvFields(["upload a csv file"]);
    } else {
      if (csvFields.length == 0) {
        setSelectedInputOption("");
        setCsvFields(["upload a csv file"]);
      }
    }
  }, [open]);

  const fetchParseData = (files: FileList) => {
    let file: any = files[0];
    papa.parse(file, {
      skipEmptyLines: true,
      header: true,
      complete: (result) => {
        const papa_data: any[] = result.data.map((row) => {
          return row;
        });
        setMyData([...papa_data]);
        const newFields: string[] = result.meta.fields?.map((field) => {
          return field;
        })!;
        setCsvFields([...newFields]);
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
                if (typeof data.input === "object") {
                  data.input = JSON.stringify(data.input);
                }
                if (typeof data.output === "object") {
                  data.output = JSON.stringify(data.output);
                }
                setBusy(true);

                let datas = myData.map((d) => {
                  return {
                    input: d[selectedInputOption!],
                    output: d[selectedOutputOption!],
                    note:
                      selectedNoteOption !== "" ? d[selectedNoteOption!] : "",
                  };
                });
                await fetch("/api/data", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    datas: datas,
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
                    Select a File
                    <Info
                      information="The input data. Ex: user input"
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      placeholder="I'm good, how can I help you?"
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-100 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                      onChange={(event) => {
                        setSelectedInputOption("");
                        setSelectedOutputOption("");
                        setSelectedNoteOption("");
                        field.onChange(event.target?.files?.[0] ?? undefined);
                        console.log(event.target.files![0].type);
                        event.target.files!.length > 0 &&
                        event.target.files![0].type == "text/csv"
                          ? fetchParseData(csvFileRef.current?.files!)
                          : setCsvFields([]);
                      }}
                      ref={csvFileRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Input Column
                    <Info
                      information="Expected response to the input data by the LLM."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      value={selectedInputOption}
                      onValueChange={(el) => {
                        setSelectedInputOption(el);
                        field.onChange(el ?? undefined);
                      }}
                    >
                      <SelectTrigger
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Food"
                      >
                        <SelectValue placeholder="Select a column header…" />
                      </SelectTrigger>

                      <SelectContent className="SelectContent">
                        <SelectGroup>
                          {csvFields.map(function (val, index) {
                            return (
                              <React.Fragment key={index}>
                                {" "}
                                <SelectItem
                                  disabled={
                                    val == "upload a csv file" ? true : false
                                  }
                                  value={val}
                                >
                                  {val}
                                </SelectItem>{" "}
                              </React.Fragment>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="output"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expected Output
                    <Info
                      information="Expected response to the input data by the LLM."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      value={selectedOutputOption}
                      onValueChange={(el) => {
                        setSelectedOutputOption(el);
                        field.onChange(el ?? undefined);
                      }}
                    >
                      <SelectTrigger
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Food"
                      >
                        <SelectValue placeholder="Select a column header…" />
                      </SelectTrigger>

                      <SelectContent className="SelectContent">
                        <SelectGroup>
                          {csvFields.map(function (val, index) {
                            return (
                              <React.Fragment key={index}>
                                <SelectItem
                                  disabled={
                                    val == "upload a csv file" ? true : false
                                  }
                                  value={val}
                                >
                                  {val}
                                </SelectItem>{" "}
                              </React.Fragment>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note
                    <Info
                      information="Expected response to the input data by the LLM."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      value={selectedNoteOption}
                      onValueChange={(el) => {
                        setSelectedNoteOption(el);
                        field.onChange(el ?? undefined);
                      }}
                    >
                      <SelectTrigger
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Food"
                      >
                        <SelectValue placeholder="Select a column header…" />
                      </SelectTrigger>

                      <SelectContent className="SelectContent">
                        <SelectGroup>
                          {csvFields.map(function (val, index) {
                            return (
                              <React.Fragment key={index}>
                                {" "}
                                <SelectItem
                                  disabled={
                                    val == "upload a csv file" ? true : false
                                  }
                                  value={val}
                                >
                                  {val}
                                </SelectItem>{" "}
                              </React.Fragment>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
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
