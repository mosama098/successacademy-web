const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function toAsciiDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

export function normalizeEgyptianMobile(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed || !/^[0-9٠-٩۰-۹+\s-]+$/.test(trimmed)) {
    return null;
  }

  const compact = toAsciiDigits(trimmed).replace(/[\s-]/g, "");
  const localNumber = compact.startsWith("+20")
    ? `0${compact.slice(3)}`
    : compact.startsWith("0020")
      ? `0${compact.slice(4)}`
      : compact;

  return /^01[0125]\d{8}$/.test(localNumber) ? localNumber : null;
}
