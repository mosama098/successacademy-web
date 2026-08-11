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
  const internationalNumber = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact;

  if (/^01[0125]\d{8}$/.test(internationalNumber)) {
    return `+20${internationalNumber.slice(1)}`;
  }

  if (internationalNumber.startsWith("+20")) {
    return /^\+201[0125]\d{8}$/.test(internationalNumber)
      ? internationalNumber
      : null;
  }

  return /^\+[1-9]\d{7,14}$/.test(internationalNumber)
    ? internationalNumber
    : null;
}
