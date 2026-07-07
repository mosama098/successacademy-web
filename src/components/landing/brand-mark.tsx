import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";

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

export function BrandMark({ slogan, compact = false }: { slogan: string; compact?: boolean }) {
  const logoSrc = resolveLogo();

  if (logoSrc) {
    return (
      <span className="flex items-center gap-3">
        <Image src={logoSrc} alt="Success Academy logo" width={compact ? 44 : 52} height={compact ? 44 : 52} className="h-11 w-auto object-contain" priority={!compact} />
        <span>
          <span className="block text-lg font-black text-[#391B68]">Success Academy</span>
          <span className="hidden text-[13px] font-black text-[#EC911F] sm:block">{slogan}</span>
        </span>
      </span>
    );
  }

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
