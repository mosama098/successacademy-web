import { Fragment, type ReactNode } from "react";
import type {
  StoryblokRichTextDocument,
  StoryblokRichTextMark,
  StoryblokRichTextNode,
} from "@/content/blog/types";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getSafeHref(mark: StoryblokRichTextMark) {
  const href = readString(mark.attrs?.href).trim();
  if (!href) return null;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return href;

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderMarkedText(node: StoryblokRichTextNode, key: string) {
  let rendered: ReactNode = node.text ?? "";

  for (const [index, mark] of [...(node.marks ?? [])].reverse().entries()) {
    const markKey = `${key}-mark-${index}`;

    if (mark.type === "bold" || mark.type === "strong") {
      rendered = <strong key={markKey} className="font-black text-[#391B68]">{rendered}</strong>;
    } else if (mark.type === "italic") {
      rendered = <em key={markKey}>{rendered}</em>;
    } else if (mark.type === "link") {
      const href = getSafeHref(mark);
      if (!href) continue;

      const opensInNewTab = mark.attrs?.target === "_blank";
      rendered = (
        <a
          key={markKey}
          href={href}
          target={opensInNewTab ? "_blank" : undefined}
          rel={opensInNewTab ? "noopener noreferrer" : undefined}
          className="rounded-sm font-bold text-[#391B68] underline decoration-[#EC911F] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
        >
          {rendered}
        </a>
      );
    }
  }

  return <Fragment key={key}>{rendered}</Fragment>;
}

function renderNode(node: StoryblokRichTextNode, key: string): ReactNode {
  if (node.type === "text") return renderMarkedText(node, key);
  if (node.type === "hard_break") return <br key={key} />;

  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));

  if (node.type === "doc") return <Fragment key={key}>{children}</Fragment>;

  if (node.type === "heading") {
    const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
    const className = "mb-3 mt-9 font-black leading-[1.4] text-[#391B68]";

    if (level >= 4) return <h4 key={key} className={`${className} text-[20px] sm:text-[22px]`}>{children}</h4>;
    if (level === 3) return <h3 key={key} className={`${className} text-[22px] sm:text-[25px]`}>{children}</h3>;
    return <h2 key={key} className={`${className} text-[25px] sm:text-[28px]`}>{children}</h2>;
  }

  if (node.type === "paragraph") return <p key={key} className="my-4">{children}</p>;

  if (node.type === "bullet_list") {
    return <ul key={key} className="my-5 grid list-disc gap-3 border-s-2 border-[#DDD3E8] ps-8 marker:text-[#EC911F]">{children}</ul>;
  }

  if (node.type === "ordered_list") {
    return <ol key={key} className="my-5 grid list-decimal gap-3 border-s-2 border-[#DDD3E8] ps-8 marker:font-black marker:text-[#EC911F]">{children}</ol>;
  }

  if (node.type === "list_item") return <li key={key} className="ps-1">{children}</li>;

  if (node.type === "blockquote") {
    return (
      <blockquote key={key} className="my-6 border-s-4 border-[#EC911F] bg-[#EEE9F4]/65 px-5 py-4 font-semibold italic text-[#5F5369]">
        {children}
      </blockquote>
    );
  }

  return <Fragment key={key}>{children}</Fragment>;
}

export function StoryblokRichText({ document }: { document: StoryblokRichTextDocument }) {
  return <>{renderNode(document, "storyblok-richtext")}</>;
}
