export function cleanText(input: unknown) {
  return String(input ?? "").replace(/[<>]/g, "").trim();
}

export function cleanOptional(input: unknown) {
  const value = cleanText(input);
  return value.length ? value : null;
}
