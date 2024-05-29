"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Adjust the import path as needed
import {
  ChromaDBMethods,
  Event,
  OpenAIMethods,
  PineconeMethods,
} from "@langtrase/trace-attributes";
import { Button, Checkbox, FormControlLabel } from "@mui/material";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import * as React from "react";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

type FilterTypes = Event | OpenAIMethods | ChromaDBMethods | PineconeMethods;

export function FilterDialog({
  open,
  onClose,
  onApplyFilters,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}) {
  const [selectedFilters, setSelectedFilters] = React.useState<FilterTypes[]>(
    []
  );
  const [showEvents, setShowEvents] = React.useState<boolean>(false);
  const [showOpenAI, setShowOpenAI] = React.useState<boolean>(false);
  const [showChromaDB, setShowChromaDB] = React.useState<boolean>(false);
  const [showPinecone, setShowPinecone] = React.useState<boolean>(false);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as FilterTypes;
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  };

  const applyFilters = () => {
    onApplyFilters({
      filters: selectedFilters,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Traces</DialogTitle>
          <DialogDescription>
            Select filters to apply to the traces.
          </DialogDescription>
        </DialogHeader>
        <div>
          <h4
            onClick={() => setShowEvents(!showEvents)}
            className="cursor-pointer flex items-center"
          >
            Events
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showEvents &&
            Object.values(Event).map((event) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(event)}
                    onChange={handleFilterChange}
                    value={event}
                  />
                }
                label={event}
                key={event}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowOpenAI(!showOpenAI)}
            className="cursor-pointer flex items-center"
          >
            OpenAI
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showOpenAI &&
            Object.values(OpenAIMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowChromaDB(!showChromaDB)}
            className="cursor-pointer flex items-center"
          >
            ChromaDB
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showChromaDB &&
            Object.values(ChromaDBMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowPinecone(!showPinecone)}
            className="cursor-pointer flex items-center"
          >
            Pinecone
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showPinecone &&
            Object.values(PineconeMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={applyFilters} color="primary">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FilterDialog;
