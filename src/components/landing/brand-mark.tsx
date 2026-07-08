import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";

const logoCandidates = [
  "/logo.png",
  "/logo.svg",
  "/success-academy-logo.png",
  "/success-academy-logo.svg",
  "/brand/logo.png",
  "/brand/logo.svg",
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
      {/* Place the real Success Academy logo in public/logo.png to replace this temporary text mark. */}
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

export function BrandMark({
  slogan,
  placement = "navbar",
}: {
  slogan: string;
  compact?: boolean;
  placement?: "navbar" | "footer";
}) {
  const logoSrc = resolveLogo();

  if (!logoSrc) return textBrand(slogan);

  return (
    <Image
      src={logoSrc}
      alt="Success Academy logo"
      width={placement === "navbar" ? 210 : 180}
      height={placement === "navbar" ? 64 : 60}
      className={
        placement === "navbar"
          ? "h-[46px] max-h-[46px] w-auto max-w-[145px] object-contain md:h-[64px] md:max-h-[64px] md:max-w-[210px]"
          : "h-12 max-h-[60px] w-auto max-w-[180px] object-contain md:h-[60px]"
      }
      priority={placement === "navbar"}
    />
  );
}
