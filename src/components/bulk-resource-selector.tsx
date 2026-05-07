"use client";

export function BulkResourceSelector() {
  function toggleAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>('input[name="videoIds"]').forEach((input) => {
      input.checked = checked;
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#526579]">
      <input
        type="checkbox"
        className="size-4 rounded border-[#d8dde5] accent-[#a64026]"
        onChange={(event) => toggleAll(event.currentTarget.checked)}
      />
      Select all
    </label>
  );
}
