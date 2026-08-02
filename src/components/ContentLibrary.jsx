import { useMemo, useState } from "react";
import { asset } from "../lib";
import { SiteLink } from "./SiteLink";

export function ContentLibrary({ items, filters, type }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const visibleItems = useMemo(() => activeFilter === "All" ? items : items.filter((item) => item.category === activeFilter || item.tags?.includes(activeFilter)), [activeFilter, items]);
  return <>
    <div className="filter-bar" aria-label={`${type} filters`}>{filters.map(([value, label]) => <button className={activeFilter === value ? "is-active" : ""} type="button" key={value} onClick={() => setActiveFilter(value)}>{label}</button>)}</div>
    <div className={`listing-grid${type === "research" ? " research-listing-grid" : ""}`} aria-live="polite">
      {visibleItems.map((item) => {
        const to = type === "recipe" ? `/recipes/${item.slug}` : `/research/${item.slug}`;
        const meta = type === "recipe" ? `${item.prepTime || item.prep} prep / serves ${item.servings}` : `${item.source} / ${item.year}`;
        const image = item.image ? asset(item.image) : asset("generated/behavior-education-cards.png");
        return <article className="listing-card" key={item.slug}><SiteLink to={to} className="listing-image"><img src={image} alt="" /></SiteLink><div className="listing-card-body"><p className="tag">{item.category}</p><h3><SiteLink to={to}>{item.title}</SiteLink></h3><p>{item.excerpt || item.summary}</p><span>{meta}</span></div></article>;
      })}
    </div>
  </>;
}
