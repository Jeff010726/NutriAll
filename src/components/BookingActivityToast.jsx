import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { asset } from "../lib";

const content = {
  en: {
    label: "Demo",
    region: "Sample booking activity",
    dismiss: "Dismiss sample booking activity",
    activities: [
      ["Angela", "12 minutes ago", "Booked a free 15-minute phone consultation"],
      ["David", "28 minutes ago", "Booked GLP-1 nutrition support"],
      ["Wei", "1 hour ago", "Booked a one-to-one weight loss consultation"],
      ["Michael", "2 hours ago", "Asked about a community nutrition class"],
      ["James", "Today", "Booked a heart health nutrition consultation"],
      ["Lisa", "Today", "Booked a menopause nutrition consultation"],
    ],
  },
  "zh-CN": {
    label: "演示",
    region: "预约动态示例",
    dismiss: "关闭预约动态示例",
    activities: [
      ["Angela", "12 分钟前", "预约了免费 15 分钟电话咨询"],
      ["David", "28 分钟前", "预约了 GLP-1 营养支持"],
      ["Wei", "1 小时前", "预约了一对一减重咨询"],
      ["Michael", "2 小时前", "咨询了社区营养课程"],
      ["James", "今天", "预约了心脏健康营养咨询"],
      ["Lisa", "今天", "预约了更年期营养咨询"],
    ],
  },
  "zh-TW": {
    label: "示範",
    region: "預約動態示例",
    dismiss: "關閉預約動態示例",
    activities: [
      ["Angela", "12 分鐘前", "預約了免費 15 分鐘電話諮詢"],
      ["David", "28 分鐘前", "預約了 GLP-1 營養支援"],
      ["Wei", "1 小時前", "預約了一對一減重諮詢"],
      ["Michael", "2 小時前", "諮詢了社區營養課程"],
      ["James", "今天", "預約了心臟健康營養諮詢"],
      ["Lisa", "今天", "預約了更年期營養諮詢"],
    ],
  },
  es: {
    label: "Demostración",
    region: "Ejemplo de actividad de reservas",
    dismiss: "Cerrar el ejemplo de actividad de reservas",
    activities: [
      ["Angela", "Hace 12 minutos", "Reservó una llamada gratuita de 15 minutos"],
      ["David", "Hace 28 minutos", "Reservó apoyo nutricional para GLP-1"],
      ["Wei", "Hace 1 hora", "Reservó una consulta individual para bajar de peso"],
      ["Michael", "Hace 2 horas", "Preguntó por una clase comunitaria de nutrición"],
      ["James", "Hoy", "Reservó una consulta de nutrición para la salud del corazón"],
      ["Lisa", "Hoy", "Reservó una consulta de nutrición para la menopausia"],
    ],
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

export function BookingActivityToast({ language = "en", pathname = "/" }) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const copy = content[language] || content.en;
  const shouldHide = hiddenPaths.has(pathname);

  useEffect(() => {
    if (dismissed || shouldHide) return undefined;

    const revealTimer = window.setTimeout(() => setVisible(true), 1400);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return () => window.clearTimeout(revealTimer);

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % avatars.length);
    }, 6500);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearInterval(rotationTimer);
    };
  }, [dismissed, shouldHide]);

  if (dismissed || shouldHide || !visible) return null;

  const [name, time, action] = copy.activities[activeIndex];

  return (
    <aside className="booking-activity-region" aria-label={copy.region} aria-live="polite">
      <div className="booking-activity-toast" key={`${language}-${activeIndex}`}>
        <img className="booking-activity-avatar" src={asset(avatars[activeIndex])} alt="" />
        <div className="booking-activity-copy">
          <div className="booking-activity-meta">
            <strong>{name}</strong>
            <span aria-hidden="true">·</span>
            <span>{time}</span>
          </div>
          <p>{action}</p>
          <span className="booking-activity-demo">{copy.label}</span>
        </div>
        <button type="button" className="booking-activity-close" onClick={() => setDismissed(true)} aria-label={copy.dismiss}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
