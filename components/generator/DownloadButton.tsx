"use client";

import type * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GenerateResponse } from "@/types";

interface DownloadButtonProps {
  generated: GenerateResponse;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

export function DownloadButton({
  generated,
  variant = "default",
  size = "default",
}: DownloadButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      type="button"
      onClick={() => downloadSkill(generated)}
    >
      <Download className="size-4" />
      Download
    </Button>
  );
}

export function downloadSkill(response: GenerateResponse) {
  const bytes = Uint8Array.from(atob(response.zip_base64), (char) =>
    char.charCodeAt(0)
  );
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = response.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
