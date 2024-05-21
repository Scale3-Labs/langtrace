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
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Info } from "../shared/info";
import { Label } from "../ui/label";
import { ScaleType } from "./eval-scale-picker";
import { RangeScale } from "./range-scale";

export function CreateTest({
  projectId,
  disabled = false,
  variant = "default",
  className = "",
  email,
}: {
  projectId: string;
  disabled?: boolean;
  variant?: any;
  className?: string;
  email?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [min, setMin] = useState<number>(-1);
  const [max, setMax] = useState<number>(1);
  const [step, setStep] = useState<number>(2);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().max(200, "Too long").optional(),
    min: z
      .string()
      .refine((val) => !Number.isNaN(parseInt(val, 10)))
      .default("-1"),
    max: z
      .string()
      .refine((val) => !Number.isNaN(parseInt(val, 10)))
      .default("1"),
    step: z
      .string()
      .refine((val) => !Number.isNaN(parseInt(val, 10)))
      .default("2"),
  });
  const CreateTestForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setMin(-1);
        setMax(1);
        setStep(2);
        CreateTestForm.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={variant} className={className}>
          Create Test <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Test</DialogTitle>
          <DialogDescription>
            Create a new test to evaluate your model.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateTestForm}>
          <form
            onSubmit={CreateTestForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/test", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description
                      ? data.description.toLowerCase()
                      : "",
                    min: data.min ? parseInt(data.min, 10) : -1,
                    max: data.max ? parseInt(data.max, 10) : 1,
                    step: data.step ? parseInt(data.step, 10) : 2,
                    projectId,
                  }),
                });
                await queryClient.invalidateQueries(
                  `fetch-tests-${projectId}-query`
                );
                toast("Test created!", {
                  description: "Your test has been created.",
                });
                setOpen(false);
                CreateTestForm.reset();
              } catch (error: any) {
                toast("Error creating your test!", {
                  description: `There was an error creating your test: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateTestForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name
                    <Info
                      information="The name of the test."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="Needle in a haystack"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateTestForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <Info
                      information="A brief description of the test."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Insert the question in between random text. If the question is answered correctly, the test is passed."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Label>
              Pick a Scale
              <Info
                information="The scale used to evaluate the test."
                className="inline-block ml-2"
              />
            </Label>
            <div className="flex gap-2">
              <FormField
                disabled={busy}
                control={CreateTestForm.control}
                name="min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Min Score
                      <Info
                        information="Minimum value of the scale."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0"
                        value={field.value ?? min}
                        onChange={(e) => {
                          e.preventDefault();
                          field.onChange(e.target.value);
                          setMin(parseInt(e.target.value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={CreateTestForm.control}
                name="max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max Score
                      <Info
                        information="Maximum value of the scale."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5"
                        value={field.value ?? max}
                        onChange={(e) => {
                          e.preventDefault();
                          field.onChange(e.target.value);
                          setMax(parseInt(e.target.value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={CreateTestForm.control}
                name="step"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Step
                      <Info
                        information="Step value of the scale."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1"
                        value={field.value ?? step}
                        onChange={(e) => {
                          e.preventDefault();
                          field.onChange(e.target.value);
                          setStep(parseInt(e.target.value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isNaN(min) && !isNaN(max) && !isNaN(step) && (
              <div className="flex flex-col justify-center items-center gap-2">
                <Label>Evaluation Scale</Label>
                <RangeScale
                  type={ScaleType.Range}
                  min={min}
                  max={max}
                  step={step}
                  selectedValue={min}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Test
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
