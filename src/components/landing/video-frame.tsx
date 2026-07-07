import { existsSync } from "node:fs";
import { join } from "node:path";

function publicAssetExists(src: string) {
  return existsSync(join(process.cwd(), "public", src));
}

export function VideoFrame({
  src,
  poster,
  title,
  placeholder,
  compact = false,
}: {
  src: string;
  poster: string;
  title: string;
  placeholder: string;
  compact?: boolean;
}) {
  const hasVideo = publicAssetExists(src);
  const hasPoster = publicAssetExists(poster);

  return (
    <div className={`group relative overflow-hidden rounded-[30px] border border-white/20 bg-[#391B68] shadow-2xl shadow-[#391B68]/20 ${compact ? "aspect-[16/11]" : "aspect-video"}`}>
      {hasVideo ? (
        <video className="h-full w-full object-cover" controls preload="metadata" poster={hasPoster ? poster : undefined} aria-label={title}>
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(236,145,31,0.32),transparent_34%),linear-gradient(135deg,#391B68,#2a144e)] p-6 text-center text-white">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 text-2xl font-black text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
              ▶
            </span>
            <p className="mx-auto mt-5 max-w-[320px] text-lg font-black leading-8">{placeholder}</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/15 transition group-hover:ring-[#EC911F]/50" />
    </div>
  );
}
