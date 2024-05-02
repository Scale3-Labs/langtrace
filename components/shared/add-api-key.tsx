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
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, LockIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LLM_VENDORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

export default function AddApiKey({
  onAdd,
  variant = "default",
}: {
  onAdd: () => void;
  variant?: "default" | "link";
}) {
  const schema = z.object({
    vendor: z.string({ required_error: "Vendor is required" }),
    key: z.string({ required_error: "API Key is required" }),
  });

  const ApiKeyForm = useForm({
    resolver: zodResolver(schema),
  });

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [vendor, setVendor] = useState("");
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          Store API Key
          {variant === "default" && (
            <LockIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save your API Key</DialogTitle>
          <DialogDescription>
            {
              "We do not store your API key. It will be saved in your browser's local storage."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...ApiKeyForm}>
          <form
            className="flex flex-col gap-8 mt-4"
            onSubmit={ApiKeyForm.handleSubmit((data) => {
              try {
                window.localStorage.setItem(
                  data.vendor.toUpperCase(),
                  data.key
                );
                onAdd();
                toast.success("API key saved successfully.");
                setOpenDialog(false);
              } catch (e) {
                toast.error("Failed to save API key.");
              }
            })}
          >
            <FormField
              control={ApiKeyForm.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {vendor
                          ? LLM_VENDORS.find(
                              (v) => v.value.toLowerCase() === vendor
                            )?.label
                          : "Select vendor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0">
                      <Command>
                        <CommandInput placeholder="Search vendor..." />
                        <CommandEmpty>No vendor found.</CommandEmpty>
                        <CommandGroup>
                          {LLM_VENDORS.map((v) => (
                            <CommandItem
                              key={v.value}
                              value={v.value}
                              onSelect={(currentValue) => {
                                setVendor(
                                  currentValue === vendor ? "" : currentValue
                                );
                                field.onChange({
                                  target: {
                                    value: currentValue,
                                  },
                                });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  vendor === v.value.toLowerCase()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {v.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={ApiKeyForm.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API KEY</FormLabel>
                  <Input
                    className="w-full"
                    placeholder="sk_test_1234567890"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
