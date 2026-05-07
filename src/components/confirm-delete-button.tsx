"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  label = "Delete",
  compact = false,
  message = "Delete this item? This cannot be undone."
}: {
  label?: string;
  compact?: boolean;
  message?: string;
}) {
  return (
    <button
      type="submit"
      className={compact ? "text-red-500" : "mlp-btn-outline border-red-200 text-red-700"}
      title={label}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {compact ? <Trash2 className="size-4" /> : label}
    </button>
  );
}
