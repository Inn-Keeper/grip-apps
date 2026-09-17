import "driver.js/dist/driver.css";
import "./tour.css";
import { driver, type PopoverDOM } from "driver.js";
import { t } from "@grip/core/i18n";

const poeReactions = [
  { mood: "welcome", pose: "/mascot/poe-idle.png" },
  { mood: "prep", pose: "/mascot/poe-thinking.png" },
  { mood: "stories", pose: "/mascot/poe-thinking.png" },
  { mood: "board", pose: "/mascot/poe-idle.png" },
  { mood: "quest", pose: "/mascot/poe-correct.png" },
  { mood: "profile", pose: "/mascot/poe-thinking.png" },
  { mood: "about", pose: "/mascot/poe-correct.png" },
] as const;

function renderPoeReaction(popover: PopoverDOM, stepIndex = 0) {
  popover.wrapper.querySelector(".grip-tour-poe")?.remove();

  const reaction = poeReactions[stepIndex] ?? poeReactions[0];
  const container = document.createElement("div");
  container.className = `grip-tour-poe grip-tour-poe-${reaction.mood}`;
  container.setAttribute("aria-hidden", "true");

  const figure = document.createElement("div");
  figure.className = "grip-tour-poe-figure";

  const image = document.createElement("img");
  image.className = "grip-tour-poe-image";
  image.src = reaction.pose;
  image.alt = "";
  image.draggable = false;
  figure.append(image);

  const stage = document.createElement("div");
  stage.className = "grip-tour-poe-stage";

  for (let i = 0; i < 5; i += 1) {
    const mark = document.createElement("span");
    mark.className = "grip-tour-poe-mark";
    stage.append(mark);
  }

  container.append(figure, stage);
  popover.description.after(container);
}

export function startTour(onNavigate: (page: string) => void) {
  const d = driver({
    animate: true,
    smoothScroll: true,
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.7,
    stagePadding: 10,
    popoverClass: "grip-tour",
    nextBtnText: t("common.next"),
    prevBtnText: t("tour.prev"),
    doneBtnText: t("tour.done"),
    onPopoverRender: (popover, { state }) => renderPoeReaction(popover, state.activeIndex),
    steps: [
      {
        popover: {
          title: t("tour.welcomeTitle"),
          description: t("tour.welcomeBody"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-prep']",
        popover: {
          title: t("tour.prepTitle"),
          description: t("tour.prepBody"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='nav-stories']",
        popover: {
          title: t("tour.storiesTitle"),
          description: t("tour.storiesBody"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='nav-board']",
        popover: {
          title: t("tour.boardTitle"),
          description: t("tour.boardBody"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='nav-quest']",
        popover: {
          title: t("tour.questTitle"),
          description: t("tour.questBody"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='nav-profile']",
        popover: {
          title: t("tour.profileTitle"),
          description: t("tour.profileBody"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='nav-about']",
        popover: {
          title: t("tour.aboutTitle"),
          description: t("tour.aboutBody"),
          side: "bottom",
          onNextClick: () => {
            d.destroy();
            onNavigate("prep");
          },
        },
      },
    ],
  });

  d.drive();
}
