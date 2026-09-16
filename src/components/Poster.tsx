import { forwardRef } from "react";
import type { Brand, Draft } from "../lib/types";
import { templates } from "../lib/templates";
export const Poster = forwardRef<
  HTMLDivElement,
  { draft: Draft; brand: Brand; mini?: boolean }
>(function Poster({ draft, brand, mini = false }, ref) {
  const t = templates.find((t) => t.id === draft.templateId) || templates[0];
  return (
    <div
      ref={ref}
      className={`poster ${draft.format} ${mini ? "mini" : ""}`}
      style={{ backgroundColor: t.background, color: t.foreground }}
    >
      <img className="poster-art" src={t.image} alt="" />
      <div className="poster-inner">
        <div className="poster-kicker">A LITTLE CELEBRATION OF YOU</div>
        <div
          className="poster-heading"
          style={{ fontSize: `${draft.heading.length > 25 ? 4.8 : 7.1}cqw` }}
        >
          {draft.heading}
        </div>
        <div
          className={`poster-name ${draft.font}`}
          style={{
            fontSize: `${Math.max(4.5, (draft.font === "script" ? 9.3 : 7.3) - Math.max(0, draft.name.length - 18) * 0.17)}cqw`,
          }}
        >
          {draft.name || "Your name"}
        </div>
        <div className="poster-rule">✦</div>
        <div className="poster-photo" style={{ borderColor: brand.accent }}>
          {draft.photo ? (
            <img src={draft.photo} alt={draft.name} />
          ) : (
            <span>{draft.emoji || "🎂"}</span>
          )}
        </div>
        <p className="poster-quote">{draft.quote}</p>
        <div className="poster-brand">
          {brand.logo ? (
            <img src={brand.logo} alt="Company logo" />
          ) : (
            <span className="brand-mark">
              {brand.type === "music" ? "♬" : "✦"}
            </span>
          )}
          <span>{brand.name}</span>
        </div>
      </div>
    </div>
  );
});
