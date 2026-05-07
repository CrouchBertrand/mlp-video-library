"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error", error);
  }, [error]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3]">
      <h1 className="text-2xl font-extrabold text-[#243447]">This admin page hit a problem</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6b7c8f]">
        The app kept running, but this page needs a refresh. Try again, or go back to the resources list.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="mlp-btn-primary">
          Try again
        </button>
        <a href="/admin/videos" className="mlp-btn-outline">
          Manage Resources
        </a>
      </div>
    </div>
  );
}
