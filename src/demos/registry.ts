import { type ComponentType, type LazyExoticComponent, lazy } from "react";

export type DemoProps = { variant: string };

export type DemoScreen = {
  id: string;
  label: string;
  component: LazyExoticComponent<ComponentType<DemoProps>>;
};

const swipeDeck = lazy(() => import("./swipe-deck"));
const parallaxCarousel = lazy(() => import("./parallax-carousel"));
const morphingCapsule = lazy(() => import("./morphing-capsule"));
const expandingCards = lazy(() => import("./expanding-cards"));
const radialMenu = lazy(() => import("./radial-menu"));

export const demos: Record<string, DemoScreen[]> = {
  "swipe-deck": [{ id: "stories", label: "Stories", component: swipeDeck }],
  "parallax-carousel": [{ id: "places", label: "Places", component: parallaxCarousel }],
  "morphing-capsule": [
    { id: "player", label: "Player", component: morphingCapsule },
    { id: "delivery", label: "Delivery", component: morphingCapsule },
  ],
  "expanding-cards": [{ id: "stories", label: "Stories", component: expandingCards }],
  "radial-menu": [{ id: "notes", label: "Notes", component: radialMenu }],
};
