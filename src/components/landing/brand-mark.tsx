import Image from "next/image";

export function BrandMark() {
  return (
    <Image
      src="/logo.png"
      alt="Success Academy logo"
      width={128}
      height={64}
      className="h-[46px] w-[92px] object-contain md:h-[64px] md:w-[128px]"
      priority
    />
  );
}

