import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { asset } from "../lib";
import { apiRequest } from "../api";

const content = {
  en: {
    demo: "Demo",
    region: "Recent booking activity",
    dismiss: "Dismiss recent booking activity",
    justNow: "Just now",
    actions: { "free-call": "Booked a free 15-minute phone consultation", "nutrition-consultation": "Booked a one-to-one nutrition consultation", "community-program": "Asked about a community nutrition program" },
  },
  "zh-CN": {
    demo: "演示",
    region: "近期预约动态",
    dismiss: "关闭近期预约动态",
    justNow: "刚刚",
    actions: { "free-call": "预约了免费 15 分钟电话咨询", "nutrition-consultation": "预约了一对一营养咨询", "community-program": "咨询了社区营养课程" },
  },
  "zh-TW": {
    demo: "示範",
    region: "近期預約動態",
    dismiss: "關閉近期預約動態",
    justNow: "剛剛",
    actions: { "free-call": "預約了免費 15 分鐘電話諮詢", "nutrition-consultation": "預約了一對一營養諮詢", "community-program": "諮詢了社區營養課程" },
  },
  es: {
    demo: "Demostración",
    region: "Actividad reciente de reservas",
    dismiss: "Cerrar la actividad reciente de reservas",
    justNow: "Ahora mismo",
    actions: { "free-call": "Reservó una llamada gratuita de 15 minutos", "nutrition-consultation": "Reservó una consulta individual de nutrición", "community-program": "Preguntó por un programa comunitario de nutrición" },
  },
};

const avatars = [
  "assets/social-proof/demo-mei.png",
  "assets/social-proof/demo-david.png",
  "assets/social-proof/demo-wei.png",
  "assets/social-proof/demo-linda.png",
  "assets/social-proof/demo-maria.png",
  "assets/social-proof/demo-robert.png",
];

const hiddenPaths = new Set(["/book", "/booking-redirect", "/booking-whatsapp", "/booking-confirmation"]);

const demoTemplates = [
  { name: "J***", kind: "free-call", minutesAgo: 9 },
  { name: "M***", kind: "nutrition-consultation", minutesAgo: 18 },
  { name: "L***", kind: "free-call", minutesAgo: 34 },
  { name: "R***", kind: "community-program", minutesAgo: 52 },
  { name: "S***", kind: "nutrition-consultation", minutesAgo: 77 },
  { name: "A***", kind: "free-call", minutesAgo: 143 },
];

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function mixedActivities(realActivities) {
  const real = shuffled(realActivities.map((activity) => ({ ...activity, origin: "real" })));
  const demo = shuffled(demoTemplates.map((activity, index) => ({
    ...activity,
    origin: "demo",
    createdAt: new Date(Date.now() - activity.minutesAgo * 60_000).toISOString(),
    avatarIndex: (index + 1) % avatars.length,
  })));
  const mixed = [];
  const length = Math.max(real.length, demo.length);
  for (let index = 0; index < length; index += 1) {
    if (real[index]) mixed.push(real[index]);
    if (demo[index]) mixed.push(demo[index]);
  }
  return mixed;
}

function relativeTime(value, language, justNow) {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  if (!Number.isFinite(elapsedSeconds) || Math.abs(elapsedSeconds) < 45) return justNow;
  const ranges = [["day", 86400], ["hour", 3600], ["minute", 60]];
  const [unit, seconds] = ranges.find(([, size]) => Math.abs(elapsedSeconds) >= size) || ["minute", 60];
  return new Intl.RelativeTimeFormat(language, { numeric: "auto" }).format(Math.round(elapsedSeconds / seconds), unit);
}

export function BookingActivityToast({ language = "en", pathname = "/" }) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const copy = content[language] || content.en;
  const shouldHide = hiddenPaths.has(pathname);

  useEffect(() => {
    if (shouldHide) return undefined;
    const controller = new AbortController();
    apiRequest("/api/booking-activity", { signal: controller.signal })
      .then((data) => setActivities(mixedActivities(Array.isArray(data.activities) ? data.activities : [])))
      .catch(() => { if (!controller.signal.aborted) setActivities(mixedActivities([])); });
    return () => controller.abort();
  }, [shouldHide]);

  useEffect(() => {
    if (dismissed || shouldHide || activities.length === 0) return undefined;

    const revealTimer = window.setTimeout(() => setVisible(true), 1400);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return () => window.clearTimeout(revealTimer);

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % activities.length);
    }, 6500);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearInterval(rotationTimer);
    };
  }, [activities.length, dismissed, shouldHide]);

  if (dismissed || shouldHide || !visible || activities.length === 0) return null;

  const activity = activities[activeIndex % activities.length];
  const avatar = avatars[Number(activity.avatarIndex) % avatars.length] || avatars[0];
  const action = copy.actions[activity.kind] || copy.actions["nutrition-consultation"];

  return (
    <aside className="booking-activity-region" aria-label={copy.region} aria-live="polite">
      <div className="booking-activity-toast" key={`${language}-${activeIndex}`} data-activity-origin={activity.origin}>
        <img className="booking-activity-avatar" src={asset(avatar)} alt="" />
        <div className="booking-activity-copy">
          <div className="booking-activity-meta">
            <strong>{activity.name}</strong>
            <span aria-hidden="true">·</span>
            <span>{relativeTime(activity.createdAt, language, copy.justNow)}</span>
          </div>
          <p>{action}</p>
          {activity.origin === "demo" && <span className="booking-activity-demo">{copy.demo}</span>}
        </div>
        <button type="button" className="booking-activity-close" onClick={() => setDismissed(true)} aria-label={copy.dismiss}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
