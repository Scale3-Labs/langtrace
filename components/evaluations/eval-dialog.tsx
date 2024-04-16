import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Test } from "@prisma/client";
import { Cross1Icon, EnterIcon } from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import {
  ArrowLeftSquareIcon,
  ArrowRightSquareIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  DeleteIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ScaleType } from "./eval-scale-picker";
import { RangeScale } from "./range-scale";

const MESSAGES = [
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
  {
    role: "user",
    message: "Hello, I am a user",
  },
  {
    role: "assistant",
    message: "Hello, I am a assistant",
  },
];

export function EvalDialog({ test }: { test: Test }) {
  const min = test?.min !== undefined && test?.min !== null ? test.min : -1;
  const max = test?.max !== undefined && test?.max !== null ? test.max : 1;
  const step = test?.step !== undefined && test?.step !== null ? test.step : 2;
  const [score, setScore] = useState<number>(min);
  const [scorePercent, setScorePercent] = useState<number>(0);
  const [color, setColor] = useState<string>("red");

  // Reset the score and color when the test changes
  useEffect(() => {
    setScore(test?.min !== undefined && test?.min !== null ? test.min : -1);
    setScorePercent(0);
    setColor("red");
  }, [test]);

  const onScoreSelected = (value: number) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    const range = max - min;
    const steps = range / step;
    const scorePercent = ((value - min) / steps) * 100;
    setScorePercent(scorePercent);

    if (scorePercent < 33) {
      setColor("red");
    }
    if (scorePercent >= 33 && scorePercent < 66) {
      setColor("yellow");
    }
    if (scorePercent >= 66) {
      setColor("green");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 background-animate"
          variant="default"
        >
          Start Testing <ChevronsRight className="ml-2" />{" "}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-screen-lg h-5/6">
        <div className="flex flex-row gap-6 justify-between h-5/6">
          <div className="flex flex-col gap-4 w-full pr-6 overflow-y-scroll">
            {MESSAGES.map((msg, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 bg-muted px-2 p-1 rounded-md"
              >
                <p
                  className={`text-${
                    msg.role === "user" ? "left" : "right"
                  }-0 capitalize text-xs font-semibold`}
                >
                  {msg.role}
                </p>
                <p
                  className={`text-${msg.role === "user" ? "left" : "right"}-0`}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 w-full overflow-y-scroll">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold break-normal capitalize">
                {test?.name || "No name provided"}
              </h2>
              <p className="text-md text-muted-foreground">
                {test?.description || "No description provided"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold break-normal">
                Evaluation Scale
              </h3>
              <p className="text-md text-muted-foreground">
                {min} to {max} in steps of +{step}
              </p>
            </div>
            <h3 className="text-lg font-semibold break-normal">Scale</h3>
            <RangeScale
              variant="large"
              type={ScaleType.Range}
              min={min}
              max={max}
              step={step}
              selectedValue={score}
              onSelectedValueChange={onScoreSelected}
            />
            <h3 className="text-lg font-semibold break-normal">Score</h3>
            <ProgressCircle
              value={scorePercent}
              size="lg"
              color={color}
              className="relative"
            >
              <p className="text-4xl font-semibold text-slate-700">{score}</p>
            </ProgressCircle>
            <div className="flex flex-col gap-3 mb-24">
              <h3 className="text-lg font-semibold break-normal">Hotkeys</h3>
              <div className="flex flex-row gap-2 items-center">
                <ArrowLeftSquareIcon className="text-muted-foreground h-4 w-4" />
                <ArrowRightSquareIcon className="text-muted-foreground h-4 w-4" />
                <p className="text-sm">Arrow keys to navigate the scale</p>
              </div>
              <div className="flex flex-row gap-2">
                <EnterIcon className="text-muted-foreground h-4 w-4" />
                <p className="text-sm">
                  Enter/Return to submit the score and continue to the next
                  evaluation
                </p>
              </div>
              <div className="flex flex-row gap-2">
                <DeleteIcon className="text-muted-foreground h-4 w-4" />
                <p className="text-sm">
                  Delete/Backspace to go back to the previous evaluation
                </p>
              </div>
              <div className="flex flex-row gap-2">
                <p className="text-sm text-muted-foreground">Esc</p>
                <p className="text-sm">
                  Press Esc to exit the evaluation dialog
                </p>
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="absolute bottom-5 right-5">
          <AlertDialogCancel>
            Exit
            <Cross1Icon className="ml-2" />
          </AlertDialogCancel>
          <Button variant={"outline"}>
            <ChevronLeft className="mr-2" />
            Previous
          </Button>
          <Button>
            Next
            <ChevronRight className="ml-2" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
