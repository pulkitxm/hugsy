import { type ComponentType, type LazyExoticComponent, lazy } from "react";

export type DemoProps = { variant: string };

export type DemoScreen = {
  id: string;
  label: string;
  hint: string;
  component: LazyExoticComponent<ComponentType<DemoProps>>;
};

const swipeDeck = lazy(() => import("./swipe-deck"));
const parallaxCarousel = lazy(() => import("./parallax-carousel"));
const morphingCapsule = lazy(() => import("./morphing-capsule"));
const expandingCards = lazy(() => import("./expanding-cards"));
const radialMenu = lazy(() => import("./radial-menu"));

export const demos: Record<string, DemoScreen[]> = {
  "swipe-deck": [
    { id: "stories", label: "Stories", hint: "Drag or flick the top card", component: swipeDeck },
  ],
  "parallax-carousel": [
    { id: "places", label: "Places", hint: "Swipe or drag sideways", component: parallaxCarousel },
  ],
  "morphing-capsule": [
    { id: "player", label: "Player", hint: "Tap or pull the capsule", component: morphingCapsule },
    {
      id: "delivery",
      label: "Delivery",
      hint: "Tap or pull the capsule",
      component: morphingCapsule,
    },
  ],
  "expanding-cards": [
    {
      id: "stories",
      label: "Stories",
      hint: "Tap a card, then drag it down",
      component: expandingCards,
    },
  ],
  "radial-menu": [
    { id: "notes", label: "Notes", hint: "Tap the plus button", component: radialMenu },
  ],
};
