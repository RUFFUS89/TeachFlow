export type Tone =
  | "neutral"
  | "peach"
  | "sage"
  | "caramel"
  | "butter"
  | "blush"
  | "lilac"
  | "accent";

export const TONE_BG: Record<Tone, string> = {
  neutral: "bg-surface2 text-ink",
  peach: "bg-peach text-peachInk",
  sage: "bg-sage text-sageInk",
  caramel: "bg-caramel text-caramelInk",
  butter: "bg-butter text-butterInk",
  blush: "bg-blush text-blushInk",
  lilac: "bg-lilac text-lilacInk",
  accent: "bg-accent text-accentInk",
};

export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-ink",
  peach: "text-peachInk",
  sage: "text-sageInk",
  caramel: "text-caramelInk",
  butter: "text-butterInk",
  blush: "text-blushInk",
  lilac: "text-lilacInk",
  accent: "text-accentInk",
};

export const TONE_RING: Record<Tone, string> = {
  neutral: "stroke-inkMuted",
  peach: "stroke-peachInk",
  sage: "stroke-sageInk",
  caramel: "stroke-caramelInk",
  butter: "stroke-butterInk",
  blush: "stroke-blushInk",
  lilac: "stroke-lilacInk",
  accent: "stroke-accentInk",
};
