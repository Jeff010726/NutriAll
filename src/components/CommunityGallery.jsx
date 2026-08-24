import { useTranslation } from "react-i18next";
import { asset } from "../lib";

const galleryRows = [
  [
    { src: "community-gallery/community-highlights.mp4", poster: "community-gallery/community-highlights-poster.webp", shape: "video", video: true },
    { src: "community-gallery/outdoor-family-fair.webp", shape: "portrait" },
    { src: "community-gallery/outdoor-team.webp", shape: "portrait" },
    { src: "community-gallery/wellness-booth.webp", shape: "portrait" },
    { src: "community-gallery/conference-poster-team.webp", shape: "landscape" },
    { src: "community-gallery/fnce-2025-group.webp", shape: "landscape" },
  ],
  [
    { src: "community-gallery/senior-community-class-1.webp", shape: "narrow" },
    { src: "community-gallery/senior-community-class-2.webp", shape: "narrow" },
    { src: "community-gallery/bilingual-dsmes-poster-team.webp", shape: "landscape" },
    { src: "community-gallery/conference-poster-presentation.webp", shape: "wide" },
    { src: "community-gallery/adces-conference-team.webp", shape: "portrait" },
    { src: "community-gallery/fnce-2025-pair.webp", shape: "landscape" },
  ],
];

function GalleryGroup({ items, duplicate = false }) {
  const { t } = useTranslation();

  return <div className="community-gallery-group" aria-hidden={duplicate || undefined}>
    {items.map((item) => <figure className={`community-gallery-item is-${item.shape}`} key={`${duplicate ? "copy" : "original"}-${item.src}`}>
      {item.video && !duplicate
        ? <video autoPlay loop muted playsInline preload="metadata" poster={asset(item.poster)} aria-label={t("community.galleryVideoLabel")}><source src={asset(item.src)} type="video/mp4" /></video>
        : <img src={asset(item.video ? item.poster : item.src)} alt={duplicate ? "" : t("community.galleryImageAlt")} loading="eager" />}
    </figure>)}
  </div>;
}

export function CommunityGallery() {
  const { t } = useTranslation();

  return <section className="community-gallery" aria-labelledby="community-gallery-title">
    <header className="community-gallery-heading">
      <p className="eyebrow">{t("community.galleryEyebrow")}</p>
      <h2 id="community-gallery-title">{t("community.galleryTitle")}</h2>
      <p>{t("community.galleryIntro")}</p>
    </header>
    <div className="community-gallery-rows">
      {galleryRows.map((items, index) => <div className={`community-gallery-rail community-gallery-rail-${index + 1}`} key={index}>
        <div className="community-gallery-track">
          <GalleryGroup items={items} />
          <GalleryGroup items={items} duplicate />
        </div>
      </div>)}
    </div>
  </section>;
}
