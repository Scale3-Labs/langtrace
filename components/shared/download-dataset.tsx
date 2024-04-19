"use client";

import { Check, ChevronsUpDown, DownloadIcon, PlusIcon } from "lucide-react";
import * as React from "react";

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
import { toast } from "sonner";
import { useState } from 'react';

export function DownloadDataset({
  datasetId
}: {
  datasetId: string;

}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const handleDownload = async () => {
    setBusy(true);
    try {
      datasetId = datasetId.toString();
      const response = await fetch(`/api/dataset-download?dataset_id=${datasetId}`, {
        method: "GET",
        headers: {
          "Content-Type": "text/csv",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download dataset.");
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');

      let filename;
      if (contentDisposition) {
        const filenameKeyValue = contentDisposition.split(':')[1].split('.');

        if (filenameKeyValue.length === 2) {
          filename = filenameKeyValue[0];
        }
      }
      // Initiate file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename?.toString() || "dataset.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setBusy(false);
      setOpen(false);
      toast.success("Dataset downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download dataset.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Download Dataset
          <DownloadIcon className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download Dataset</DialogTitle>
          <DialogDescription>
            This will download the data as .csv and only up to a maximum of 500 records. To download the entire dataset, please contact us.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={busy} onClick={handleDownload}>
            Download
          </Button>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}