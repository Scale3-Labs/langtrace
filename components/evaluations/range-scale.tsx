import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Scale, ScaleType } from "./eval-scale-picker";

export function RangeScale({ min, max, step, type = ScaleType.Range }: Scale) {
  const [selectedValue, setSelectedValue] = useState<number>(1);
  if (min === undefined || max === undefined || step === undefined) return null;

  if (type === "range") {
    const values = Array.from(
      { length: (max - min) / step + 1 },
      (_, i) => min + i * step
    );

    // Limit the number of values to 10
    if (values.length > 11 || values.length === 1 || step === 0)
      return (
        <p className="text-destructive">
          {values.length > 11 && "The range scale is limited to 11 values."}
          {values.length === 1 &&
            "The range scale must have at least 2 values."}
          {step === 0 && "The step value must be greater than 0."}
        </p>
      );

    if (values.length !== 2) {
      return (
        <RadioGroup defaultValue={`${min}`} className="flex items-center gap-2">
          {values.map((value: number, i: number) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <RadioGroupItem value={`${value}`} id="r1" />
              <Label htmlFor="r1">{value}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant={selectedValue === min ? "default" : "ghost"}
              size={"icon"}
              onClick={() => setSelectedValue(min)}
            >
              <ThumbsDownIcon />
            </Button>
            <Label>{min}</Label>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant={selectedValue === max ? "default" : "ghost"}
              size={"icon"}
              onClick={() => setSelectedValue(max)}
            >
              <ThumbsUpIcon />
            </Button>
            <Label>{max}</Label>
          </div>
        </div>
      );
    }
  }
  return null;
}
