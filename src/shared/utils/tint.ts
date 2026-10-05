/** Teintes d'avatar du thème (`--tint-1` à `--tint-6`), avec leur couleur de texte. */
const tints = [
  "bg-tint-1 text-tint-1-foreground",
  "bg-tint-2 text-tint-2-foreground",
  "bg-tint-3 text-tint-3-foreground",
  "bg-tint-4 text-tint-4-foreground",
  "bg-tint-5 text-tint-5-foreground",
  "bg-tint-6 text-tint-6-foreground",
];

/** Teinte stable pour un identifiant : un même objet garde toujours sa couleur. */
export function tintFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tints[Math.abs(hash) % tints.length];
}

/** Initiales d'un nom : première lettre du premier et du dernier mot. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")
  ).toUpperCase();
}
