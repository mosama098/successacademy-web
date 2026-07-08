import Image from "next/image";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

const logoCandidates = [
  "/logo.svg",
  "/logo.png",
  "/success-academy-logo.svg",
  "/success-academy-logo.png",
  "/brand/logo.svg",
  "/brand/logo.png",
];

function resolveLogo() {
  return logoCandidates.find((src) => existsSync(join(process.cwd(), "public", src)));
}

export function hasLogoAsset() {
  return Boolean(resolveLogo());
}

function textBrand(slogan: string) {
  return (
    <span className="flex items-center gap-3">
      {/* Place the real Success Academy logo in public/logo.png or public/logo.svg to replace this temporary text mark. */}
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#EC911F] to-[#E32F54] text-base font-black text-white shadow-xl shadow-[#391B68]/15">
        SA
      </span>
      <span>
        <span className="block text-lg font-black text-[#391B68]">Success Academy</span>
        <span className="hidden text-[13px] font-black text-[#EC911F] sm:block">{slogan}</span>
      </span>
    </span>
  );
}

function hasDarkSvgBackground(filePath: string) {
  const svg = readFileSync(filePath, "utf8").toLowerCase();
  return /<(rect|path|circle|polygon|g)[^>]+fill=["'](#391b68|#2a144e|#000|#000000|black|rgb\(\s*57\s*,\s*27\s*,\s*104\s*\))/i.test(svg);
}

function averageRgbBrightness(values: Array<[number, number, number, number]>) {
  const opaque = values.filter(([, , , alpha]) => alpha > 220);
  if (!opaque.length) return 255;
  const total = opaque.reduce((sum, [red, green, blue]) => sum + (red + green + blue) / 3, 0);
  return total / opaque.length;
}

function unfilterPngScanlines(raw: Buffer, width: number, height: number, bytesPerPixel: number, stride: number) {
  const rows: Buffer[] = [];
  let offset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[offset];
    offset += 1;
    const row = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;
    const previous = rows[y - 1];

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = previous ? previous[x] : 0;
      const upLeft = previous && x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;

      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const pa = Math.abs(up - upLeft);
        const pb = Math.abs(left - upLeft);
        const pc = Math.abs(left + up - 2 * upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      }
    }
    rows.push(row);
  }

  return rows;
}

function hasDarkPngBackground(filePath: string) {
  const png = readFileSync(filePath);
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return false;

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let palette: Buffer | undefined;
  let transparency: Buffer | undefined;
  const data: Buffer[] = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const chunk = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      colorType = chunk[9];
    } else if (type === "PLTE") palette = chunk;
    else if (type === "tRNS") transparency = chunk;
    else if (type === "IDAT") data.push(chunk);
    else if (type === "IEND") break;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 || colorType === 3 ? 1 : 0;
  if (!width || !height || !channels) return false;

  const rows = unfilterPngScanlines(inflateSync(Buffer.concat(data)), width, height, channels, width * channels);
  const points = [
    [0, 0],
    [Math.max(0, width - 1), 0],
    [0, Math.max(0, height - 1)],
    [Math.max(0, width - 1), Math.max(0, height - 1)],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), Math.max(0, height - 1)],
  ];

  const samples = points.map(([x, y]) => {
    const row = rows[y];
    const index = x * channels;
    if (colorType === 6) return [row[index], row[index + 1], row[index + 2], row[index + 3]] as [number, number, number, number];
    if (colorType === 2) return [row[index], row[index + 1], row[index + 2], 255] as [number, number, number, number];
    if (colorType === 4) return [row[index], row[index], row[index], row[index + 1]] as [number, number, number, number];
    if (colorType === 3 && palette) {
      const paletteIndex = row[index];
      return [palette[paletteIndex * 3], palette[paletteIndex * 3 + 1], palette[paletteIndex * 3 + 2], transparency?.[paletteIndex] ?? 255] as [number, number, number, number];
    }
    return [row[index], row[index], row[index], 255] as [number, number, number, number];
  });

  return averageRgbBrightness(samples) < 120;
}

function logoHasOwnDarkBackground(src: string) {
  const filePath = join(process.cwd(), "public", src);
  try {
    if (src.endsWith(".svg")) return hasDarkSvgBackground(filePath);
    if (src.endsWith(".png")) return hasDarkPngBackground(filePath);
  } catch {
    return false;
  }
  return false;
}

export function BrandMark({
  slogan,
  compact = false,
  placement = "navbar",
}: {
  slogan: string;
  compact?: boolean;
  placement?: "navbar" | "footer";
}) {
  const logoSrc = resolveLogo();

  if (!logoSrc) return textBrand(slogan);

  if (placement === "navbar") {
    if (!logoHasOwnDarkBackground(logoSrc)) return textBrand(slogan);
    return (
      <Image
        src={logoSrc}
        alt="Success Academy logo"
        width={150}
        height={52}
        className="h-[42px] max-h-[42px] w-auto max-w-[150px] object-contain md:h-[52px] md:max-h-[52px]"
        priority
      />
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-2xl bg-[#391B68] px-3 py-2 shadow-lg shadow-[#391B68]/12">
      <Image
        src={logoSrc}
        alt="Success Academy logo"
        width={compact ? 150 : 170}
        height={56}
        className="h-10 max-h-[56px] w-auto max-w-[150px] object-contain md:h-12"
      />
    </span>
  );
}
