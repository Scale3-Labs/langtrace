import React, { useEffect } from "react";
import { Label } from "../ui/label";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemLarge,
} from "../ui/radio-group";
import { ScaleType } from "./eval-scale-picker";

interface RangeScaleProps {
  min: number;
  max: number;
  step: number;
  selectedValue: number;
  onSelectedValueChange?: (value: number) => void;
  type?: ScaleType | "range";
  variant?: string | "default";
  disabled?: boolean;
  disableAutoFocus?: boolean;
}

export function RangeScale({
  min,
  max,
  step,
  selectedValue,
  onSelectedValueChange,
  type = ScaleType.Range,
  variant = "default",
  disabled = false,
  disableAutoFocus = false,
}: RangeScaleProps) {
  const radioRef = React.createRef<HTMLDivElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();

  useEffect(() => {
    if (disableAutoFocus) return;
    if (radioRef.current) {
      radioRef.current.focus();
    }
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [radioRef, buttonRef]);

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

    return (
      <RadioGroup
        disabled={disabled}
        ref={radioRef}
        onValueChange={(value) =>
          onSelectedValueChange && onSelectedValueChange(parseInt(value, 10))
        }
        value={selectedValue.toString()}
        className="flex items-center gap-2"
      >
        {values.map((value: number, i: number) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            {variant === "large" ? (
              <RadioGroupItemLarge
                type="button"
                value={`${value}`}
                id={`r${i}`}
              />
            ) : (
              <RadioGroupItem type="button" value={`${value}`} id={`r${i}`} />
            )}
            <Label htmlFor={`r${i}`}>{value}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }
  return null;
}
