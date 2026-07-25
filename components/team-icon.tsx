import {
  Baby,
  BookOpen,
  Camera,
  Church,
  DoorOpen,
  Flame,
  HeartHandshake,
  Megaphone,
  Mic,
  Music,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { IconoEquipoId } from "@/lib/domain";

// Catalogo de iconos elegibles para un equipo: id estable en base + etiqueta + glifo lucide.
export const ICONOS_EQUIPO: { id: IconoEquipoId; label: string; Glyph: LucideIcon }[] = [
  { id: "users", label: "Grupo", Glyph: UsersRound },
  { id: "sliders", label: "Técnica", Glyph: SlidersHorizontal },
  { id: "music", label: "Música", Glyph: Music },
  { id: "mic", label: "Micrófono", Glyph: Mic },
  { id: "video", label: "Video", Glyph: Video },
  { id: "camera", label: "Cámara", Glyph: Camera },
  { id: "megaphone", label: "Anuncios", Glyph: Megaphone },
  { id: "door", label: "Ujieres", Glyph: DoorOpen },
  { id: "serve", label: "Servir", Glyph: HeartHandshake },
  { id: "church", label: "Iglesia", Glyph: Church },
  { id: "shield", label: "Escudo", Glyph: Shield },
  { id: "book", label: "Palabra", Glyph: BookOpen },
  { id: "kitchen", label: "Cafetería", Glyph: Utensils },
  { id: "kids", label: "Niños", Glyph: Baby },
  { id: "sparkles", label: "Brillo", Glyph: Sparkles },
  { id: "flame", label: "Antorcha", Glyph: Flame },
];

const MAPA_ICONOS = new Map(ICONOS_EQUIPO.map((item) => [item.id, item.Glyph]));

// Glifo del icono de un equipo, o null si el equipo no tiene un icono valido cargado.
export function TeamIconGlyph({ icon, size = 25 }: { icon?: string | null; size?: number }) {
  const Glyph = icon ? MAPA_ICONOS.get(icon as IconoEquipoId) : undefined;
  return Glyph ? <Glyph size={size} /> : null;
}
