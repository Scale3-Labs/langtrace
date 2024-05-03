import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AnthropicSettings,
  OpenAISettings,
} from "@/lib/types/playground_types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, SettingsIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Info } from "../shared/info";
import { Input, InputLarge } from "../ui/input";
import { Label } from "../ui/label";
import { ModelsDropDown } from "./model-dropdown";

export function OpenAISettingsSheet({
  settings,
  setSettings,
}: {
  settings: OpenAISettings;
  setSettings: any;
}) {
  const [open, setOpen] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const schema = z.object({
    model: z.string(),
    stream: z.boolean().optional(),
    maxTokens: z.union([z.number().positive(), z.nan()]).optional(),
    temperature: z
      .union([
        z.number().positive().min(0),
        z.number().positive().max(2),
        z.nan(),
      ])
      .optional(),
    frequencyPenalty: z
      .union([z.number().min(-2), z.number().max(2)])
      .optional(),
    presencePenalty: z
      .union([z.number().min(-2), z.number().max(2)])
      .optional(),
    logitBias: z.any().optional(),
    logProbs: z.boolean().optional(),
    topLogProbs: z
      .union([z.number().min(0), z.number().max(20), z.nan()])
      .optional(),
    n: z.union([z.number(), z.nan()]).optional(),
    seed: z.union([z.number(), z.nan()]).optional(),
    stop: z.string().optional(),
    topP: z.union([z.number(), z.nan()]).optional(),
    responseFormat: z.string().optional(),
    tools: z.string().optional(),
    toolChoice: z.string().optional(),
    user: z.string().optional(),
  });

  const SettingsForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      model: settings.model ?? "gpt-3.5-turbo",
      stream: settings.stream ?? false,
      maxTokens: settings.maxTokens ?? undefined,
      temperature: settings.temperature ?? 1,
      frequencyPenalty: settings.frequencyPenalty ?? 0,
      presencePenalty: settings.presencePenalty ?? 0,
      logitBias: settings.logitBias ?? undefined,
      logProbs: settings.logProbs ?? false,
      topLogProbs: settings.topLogProbs ?? undefined,
      n: settings.n ?? 1,
      seed: settings.seed ?? undefined,
      stop: settings.stop ?? undefined,
      topP: settings.topP ?? 1,
      responseFormat: settings.responseFormat ?? "",
      tools: settings.tools ?? "[]",
      toolChoice: settings.toolChoice ?? "",
      user: settings.user ?? "",
    },
  });

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button variant="outline" size={"sm"}>
          <div className="flex gap-2 items-center">
            <SettingsIcon className="h-5 w-5" />
            <p className="text-xs font-semibold">OpenAI</p>
            <Image
              alt="OpenAI Logo"
              src="/openai.svg"
              width={20}
              height={20}
              className="p-[3px] rounded-full dark:bg-gray-400"
            />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
          <SheetDescription>
            Configure the settings for the OpenAI chat.
          </SheetDescription>
        </SheetHeader>
        <Form {...SettingsForm}>
          <form
            onSubmit={SettingsForm.handleSubmit(async (data) => {
              try {
                const newSettings: any = {};
                if (data.stream !== undefined) {
                  newSettings["stream"] = data.stream;
                }
                if (data.model !== undefined && (data.model as string) !== "") {
                  newSettings["model"] = data.model;
                } else {
                  throw new Error("Model is required");
                }
                if (data.maxTokens !== undefined && !isNaN(data.maxTokens)) {
                  newSettings["maxTokens"] = data.maxTokens;
                }
                if (
                  data.temperature !== undefined &&
                  !isNaN(data.temperature)
                ) {
                  if (!(data.temperature >= 0 && data.temperature <= 2)) {
                    throw new Error("Temperature must be between 0 and 2");
                  }
                  newSettings["temperature"] = data.temperature;
                }
                if (data.frequencyPenalty !== undefined) {
                  if (
                    !(data.frequencyPenalty >= -2 && data.frequencyPenalty <= 2)
                  ) {
                    throw new Error(
                      "Frequency penalty must be between -2 and 2"
                    );
                  }
                  newSettings["frequencyPenalty"] = data.frequencyPenalty;
                }
                if (data.presencePenalty !== undefined) {
                  if (
                    !(data.presencePenalty >= -2 && data.presencePenalty <= 2)
                  ) {
                    throw new Error(
                      "Presence penalty must be between -2 and 2"
                    );
                  }
                  newSettings["presencePenalty"] = data.presencePenalty;
                }
                if (data.logitBias !== undefined) {
                  newSettings["logitBias"] = data.logitBias;
                }
                if (data.logProbs !== undefined) {
                  newSettings["logProbs"] = data.logProbs;
                }
                if (
                  data.topLogProbs !== undefined &&
                  !isNaN(data.topLogProbs)
                ) {
                  newSettings["topLogProbs"] = data.topLogProbs;
                }
                if (data.n !== undefined && !isNaN(data.n)) {
                  newSettings["n"] = data.n;
                }
                if (data.seed !== undefined && !isNaN(data.seed)) {
                  if (data.seed < 0) {
                    throw new Error("Seed must be a positive number");
                  }
                  newSettings["seed"] = data.seed;
                }
                if (data.stop !== undefined) {
                  newSettings["stop"] = data.stop;
                }
                if (data.topP !== undefined && !isNaN(data.topP)) {
                  newSettings["topP"] = data.topP;
                }
                if (data.responseFormat !== undefined) {
                  newSettings["responseFormat"] = data.responseFormat;
                }
                if (data.tools !== undefined) {
                  newSettings["tools"] = data.tools;
                }
                if (data.toolChoice !== undefined) {
                  newSettings["toolChoice"] = data.toolChoice;
                }
                if (data.user !== undefined) {
                  newSettings["user"] = data.user;
                }
                setSettings({ ...settings, ...newSettings });
                toast.success("Settings saved");
                setOpen(false);
              } catch (error: any) {
                toast.error("Error saving settings", {
                  description: error?.message,
                });
              }
            })}
            className="mt-6 px-2 flex flex-col gap-4 overflow-y-scroll h-screen pb-48"
          >
            <FormField
              control={SettingsForm.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Model
                    <Info
                      information="The model to use for generating responses."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <ModelsDropDown
                      value={field.value}
                      setValue={field.onChange}
                      vendor="openai"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={SettingsForm.control}
              name="stream"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        onCheckedChange={(checked) => field.onChange(checked)}
                        checked={field.value}
                      />
                      <div className="flex items-center">
                        <Label>Stream</Label>
                        <Info
                          information="Stream the response as it is being generated."
                          className="inline-block ml-2"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={SettingsForm.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max Tokens
                      <Info
                        information="The maximum number of tokens to generate."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        min={0}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                        }}
                        type="number"
                        placeholder="Max Tokens"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={SettingsForm.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temperature
                      <Info
                        information="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        min={0}
                        max={2}
                        step={0.1}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                        }}
                        type="number"
                        placeholder="Temperature"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={SettingsForm.control}
              name="responseFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Response Format
                    <Info
                      information="An object specifying the format that the model must output. Compatible with GPT-4 Turbo and all GPT-3.5 Turbo models newer than gpt-3.5-turbo-1106. Setting to { 'type': 'json_object' } enables JSON mode, which guarantees the message the model generates is valid JSON. Important: when using JSON mode, you must also instruct the model to produce JSON yourself via a system or user message. Without this, the model may generate an unending stream of whitespace until the generation reaches the token limit, resulting in a long-running and seemingly 'stuck' request. Also note that the message content may be partially cut off if finish_reason='length', which indicates the generation exceeded max_tokens or the conversation exceeded the max context length."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <InputLarge
                      placeholder="{ 'type': 'json_object' }"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={SettingsForm.control}
              name="tools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tools
                    <Info
                      information="A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. A max of 128 functions are supported."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <InputLarge
                      placeholder="{'type': 'function', 'function': {'name': 'my_function', 'parameters': {'param1': 'value1'}}}"
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={SettingsForm.control}
              name="toolChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tool Choice
                    <Info
                      information="Controls which (if any) tool is called by the model. none means the model will not call any tool and instead generates a message. auto means the model can pick between generating a message or calling one or more tools. required means the model must call one or more tools. Specifying a particular tool via {'type': 'function', 'function': {'name': 'my_function'}} forces the model to call that tool."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <InputLarge
                      placeholder="{'type': 'function', 'function': {'name': 'my_function'}}"
                      onChange={field.onChange}
                      value={field.value as string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-fit min-h-[40px]"
              type="button"
              variant={"ghost"}
              size={"sm"}
              onClick={() => setAdvancedSettings(!advancedSettings)}
            >
              Advanced settings{" "}
              {advancedSettings ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {advancedSettings && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={SettingsForm.control}
                    name="frequencyPenalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Frequency Penalty
                          <Info
                            information="Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            min={-2}
                            max={2}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="Frequency Penalty"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={SettingsForm.control}
                    name="presencePenalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Presence Penalty
                          <Info
                            information="Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            min={-2}
                            max={2}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="Presence Penalty"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={SettingsForm.control}
                  name="logitBias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Logit Bias
                        <Info
                          information="Modify the likelihood of specified tokens appearing in the completion.

                        Accepts a JSON object that maps tokens (specified by their token ID in the tokenizer) to an associated bias value from -100 to 100. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token."
                          className="inline-block ml-2"
                        />
                      </FormLabel>
                      <FormControl>
                        <InputLarge placeholder="{...}" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={SettingsForm.control}
                    name="logProbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              onCheckedChange={(checked) =>
                                field.onChange(checked)
                              }
                              checked={field.value}
                            />
                            <div className="flex items-center">
                              <Label>Log Probs</Label>
                              <Info
                                information="Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned in the content of message."
                                className="inline-block ml-2"
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={SettingsForm.control}
                    name="topLogProbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Top Log Probs
                          <Info
                            information="An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            min={0}
                            max={20}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="Top Log Probs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={SettingsForm.control}
                    name="seed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Seed
                          <Info
                            information="This feature is in Beta. If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed, and you should refer to the system_fingerprint response parameter to monitor changes in the backend."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="Seed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={SettingsForm.control}
                    name="n"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          N
                          <Info
                            information="How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep n as 1 to minimize costs."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="N"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={SettingsForm.control}
                    name="stop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Stop (string / array)
                          <Info
                            information="Up to 4 sequences where the API will stop generating further tokens."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="stop"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={SettingsForm.control}
                    name="topP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Top P
                          <Info
                            information="An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
                        We generally recommend altering this or temperature but not both."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            step={0.1}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="Top P"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            <SheetFooter>
              <Button type="submit">Save changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function AnthropicSettingsSheet({
  settings,
  setSettings,
}: {
  settings: AnthropicSettings;
  setSettings: any;
}) {
  const [open, setOpen] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const schema = z.object({
    model: z.string(),
    stream: z.boolean().optional(),
    maxTokens: z.union([z.number().positive(), z.nan()]).optional(),
    metadata: z.any().optional(),
    system: z.string().optional(),
    temperature: z
      .union([
        z.number().positive().min(0),
        z.number().positive().max(2),
        z.nan(),
      ])
      .optional(),
    tools: z.any().optional(),
    topK: z.union([z.number().positive(), z.nan()]).optional(),
    topP: z.union([z.number().positive(), z.nan()]).optional(),
  });

  const SettingsForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      model: settings.model ?? "gpt-3.5-turbo",
      stream: settings.stream ?? false,
      maxTokens: settings.maxTokens ?? undefined,
      temperature: settings.temperature ?? 1,
      tools: settings.tools ?? [],
      topK: settings.topK ?? undefined,
      topP: settings.topP ?? 1,
      metadata: settings.metadata ?? undefined,
      system: settings.system ?? "",
    },
  });

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button variant="outline" size={"sm"}>
          <div className="flex gap-2 items-center">
            <SettingsIcon className="h-5 w-5" />
            <p className="text-xs font-semibold">Anthropic</p>
            <Image
              alt="Anthropic Logo"
              src="/anthropic.png"
              width={30}
              height={30}
              className="p-[3px] rounded-full dark:bg-gray-400"
            />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
          <SheetDescription>
            Configure the settings for the Anthropic chat.
          </SheetDescription>
        </SheetHeader>
        <Form {...SettingsForm}>
          <form
            onSubmit={SettingsForm.handleSubmit(async (data) => {
              try {
                const newSettings: any = {};
                if (data.model !== undefined && (data.model as string) !== "") {
                  newSettings["model"] = data.model;
                } else {
                  throw new Error("Model is required");
                }
                if (data.stream !== undefined) {
                  newSettings["stream"] = data.stream;
                }
                if (data.maxTokens !== undefined && !isNaN(data.maxTokens)) {
                  newSettings["maxTokens"] = data.maxTokens;
                }
                if (
                  data.temperature !== undefined &&
                  !isNaN(data.temperature)
                ) {
                  if (!(data.temperature >= 0 && data.temperature <= 2)) {
                    throw new Error("Temperature must be between 0 and 2");
                  }
                  newSettings["temperature"] = data.temperature;
                }
                if (data.tools !== undefined) {
                  newSettings["tools"] = data.tools;
                }
                if (data.topK !== undefined && !isNaN(data.topK)) {
                  newSettings["topK"] = data.topK;
                }
                if (data.topP !== undefined && !isNaN(data.topP)) {
                  newSettings["topP"] = data.topP;
                }
                if (data.metadata !== undefined) {
                  newSettings["metadata"] = data.metadata;
                }
                if (data.system !== undefined) {
                  newSettings["system"] = data.system;
                }
                setSettings({ ...settings, ...newSettings });
                toast.success("Settings saved");
                setOpen(false);
              } catch (error: any) {
                toast.error("Error saving settings", {
                  description: error?.message,
                });
              }
            })}
            className="mt-6 px-2 flex flex-col gap-4 overflow-y-scroll h-screen pb-48"
          >
            <FormField
              control={SettingsForm.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Model
                    <Info
                      information="The model that will complete your prompt."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <ModelsDropDown
                      value={field.value}
                      setValue={field.onChange}
                      vendor="anthropic"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={SettingsForm.control}
              name="stream"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        onCheckedChange={(checked) => field.onChange(checked)}
                        checked={field.value}
                      />
                      <div className="flex items-center">
                        <Label>Stream</Label>
                        <Info
                          information="Whether to incrementally stream the response using server-sent events."
                          className="inline-block ml-2"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={SettingsForm.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max Tokens
                      <Info
                        information="The maximum number of tokens to generate before stopping."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        min={0}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                        }}
                        type="number"
                        placeholder="Max Tokens"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={SettingsForm.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temperature
                      <Info
                        information="Amount of randomness injected into the response."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        min={0}
                        max={1}
                        step={0.1}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                        }}
                        type="number"
                        placeholder="Temperature"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={SettingsForm.control}
              name="system"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    System
                    <Info
                      information="A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <InputLarge
                      placeholder="This is a system prompt"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={SettingsForm.control}
              name="tools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tools
                    <Info
                      information="[beta] Definitions of tools that the model may use. If you include tools in your API request, the model may return tool_use content blocks that represent the model's use of those tools. You can then run those tools using the tool input generated by the model and then optionally return results back to the model using tool_result content blocks. Each tool definition includes: name: Name of the tool, description: Optional, but strongly-recommended description of the tool, input_schema: JSON schema for the tool input shape that the model will produce in tool_use output content blocks."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <InputLarge
                      placeholder="[
                        {
                          'name': 'get_stock_price',
                          'description': 'Get the current stock price for a given ticker symbol.',
                          'input_schema': {
                            'type': 'object',
                            'properties': {
                              'ticker': {
                                'type': 'string',
                                'description': 'The stock ticker symbol, e.g. AAPL for Apple Inc.'
                              }
                            },
                            'required': ['ticker']
                          }
                        }
                      ]"
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-fit min-h-[40px]"
              type="button"
              variant={"ghost"}
              size={"sm"}
              onClick={() => setAdvancedSettings(!advancedSettings)}
            >
              Advanced settings{" "}
              {advancedSettings ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {advancedSettings && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={SettingsForm.control}
                    name="topP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Top P
                          <Info
                            information="Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p. You should either alter temperature or top_p, but not both."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="P"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={SettingsForm.control}
                    name="topK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Top K
                          <Info
                            information="Only sample from the top K options for each subsequent token. Used to remove 'long tail' low probability responses."
                            className="inline-block ml-2"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                            type="number"
                            placeholder="K"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            <SheetFooter>
              <Button type="submit">Save changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
