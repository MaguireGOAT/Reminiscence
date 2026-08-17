import { Film, Image as ImageIcon, Music, Type } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "../data/starter.js";

const TYPE_ICONS = {
  song: Music,
  photo: ImageIcon,
  video: Film,
  text: Type
};

export function MediaThumb({ item, className = "", size = "md" }) {
  const Icon = TYPE_ICONS[item.type] || ImageIcon;
  const src = item.coverUrl || item.posterUrl || (item.type === "photo" ? item.mediaUrl : null);
  return (
    <div className={`media-thumb media-thumb-${size} ${className}`}>
      {src ? (
        <img src={src} alt={item.title} loading="lazy" />
      ) : (
        <div className="media-thumb-icon">
          <Icon size={size === "sm" ? 18 : 24} aria-hidden="true" />
          <span>{MEDIA_TYPE_LABELS[item.type]}</span>
        </div>
      )}
    </div>
  );
}
