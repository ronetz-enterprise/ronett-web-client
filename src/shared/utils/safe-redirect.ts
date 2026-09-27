function hasUnsafeCharacters(value: string) {
  return [...value].some(
    (char) =>
      char === "\\" || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
  );
}
export function safeRedirect(value: string | null | undefined, fallback = "/") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    hasUnsafeCharacters(value)
  )
    return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || hasUnsafeCharacters(decoded))
      return fallback;
    return value;
  } catch {
    return fallback;
  }
}
