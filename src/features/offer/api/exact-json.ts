/** JSON lexical numbers remain decimal strings; quoted text is never rewritten.
 * JSON.parse remains the grammar validator. No monetary/int64 value uses Number.
 */
export function parseExactJson(text: string): unknown {
  return JSON.parse(
    text.replace(
      /"(?:[^"\\]|\\[\s\S])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
      (token) =>
        token.startsWith('"') ? token : JSON.stringify(expandDecimal(token)),
    ),
  );
}
function expandDecimal(token: string) {
  const [mantissa, exponent = "0"] = token.toLowerCase().split("e");
  const shift = Number(exponent);
  if (!Number.isInteger(shift) || Math.abs(shift) > 100)
    throw new Error("Numeric exponent out of bounds");
  const negative = mantissa.startsWith("-");
  const [whole, fraction = ""] = mantissa.replace(/^-/, "").split(".");
  const digits = whole + fraction,
    point = whole.length + shift;
  const expanded =
    point <= 0
      ? "0." + "0".repeat(-point) + digits
      : point >= digits.length
        ? digits + "0".repeat(point - digits.length)
        : digits.slice(0, point) + "." + digits.slice(point);
  return (negative ? "-" : "") + expanded;
}
export class ExactNumber {
  readonly value: string;
  constructor(value: string) {
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value))
      throw new Error("Invalid exact number");
    this.value = value;
  }
}
/** Offer command DTOs are flat records. Only explicitly marked numbers become raw tokens. */
function stringifyCommand(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Command object required");
  return (
    "{" +
    Object.entries(value)
      .map(([key, field]) => {
        if (
          field !== null &&
          typeof field === "object" &&
          !(field instanceof ExactNumber)
        )
          throw new Error("Flat command required");
        const encoded =
          field instanceof ExactNumber ? field.value : JSON.stringify(field);
        if (encoded === undefined) throw new Error("Undefined command field");
        return JSON.stringify(key) + ":" + encoded;
      })
      .join(",") +
    "}"
  );
}
export const offerJsonCodec = {
  parse: parseExactJson,
  stringify: stringifyCommand,
};
