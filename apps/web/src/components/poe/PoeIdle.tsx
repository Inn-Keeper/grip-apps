import { useId } from "react";
import styles from "./PoeAssistant.module.css";

// Neutral grey leaves pixels in place; the soft coloured areas move only head/chest.
const displacementMap = (region: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="829" height="1057"><defs>${region}</defs><rect width="829" height="1057" fill="#808080"/><rect width="829" height="1057" fill="url(#motion)"/></svg>`,
  )}`;
const headMap = displacementMap(
  '<radialGradient id="motion" cx="28%" cy="5%" r="30%" gradientTransform="translate(0 .02) scale(1 .85)"><stop stop-color="#ed8080"/><stop offset="1" stop-color="#808080" stop-opacity="0"/></radialGradient>',
);
const chestMap = displacementMap(
  '<radialGradient id="motion" cx="27%" cy="43%" r="24%"><stop stop-color="#805080"/><stop offset="1" stop-color="#808080" stop-opacity="0"/></radialGradient>',
);

export function PoeIdle() {
  const id = useId();
  const head = `${id}-head`;
  const chest = `${id}-chest`;
  const eye = `${id}-eye`;

  return (
    <span className={styles.idleFigure}>
      <img
        className={`${styles.image} ${styles.idleStill}`}
        src="/mascot/poe-idle.png"
        alt=""
        draggable="false"
      />
      <svg
        className={styles.idleArtwork}
        viewBox="0 0 829 1057"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={head}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={headMap}
              x="0"
              y="0"
              width="829"
              height="1057"
              result="motion"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="motion"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              <animate
                attributeName="scale"
                values="0;0;14;14;0;0"
                keyTimes="0;.48;.53;.59;.65;1"
                dur="17s"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
          <filter
            id={chest}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={chestMap}
              x="0"
              y="0"
              width="829"
              height="1057"
              result="motion"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="motion"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              <animate
                attributeName="scale"
                values="0;5;0"
                dur="4.8s"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
          <clipPath id={eye}>
            <ellipse
              cx="263"
              cy="95"
              rx="17"
              ry="19"
              transform="rotate(14 263 95)"
            />
          </clipPath>
        </defs>
        <g filter={`url(#${head})`}>
          <image
            href="/mascot/poe-idle.png"
            width="829"
            height="1057"
            filter={`url(#${chest})`}
          />
          <g clipPath={`url(#${eye})`}>
            <g className={styles.eyelid}>
              <path
                d="M240 75h46v44h-46z"
                fill="#0c1319"
              />
              <path
                d="M244 99q18 7 37-2M247 105q17 5 31-2"
                fill="none"
                stroke="#25313a"
                strokeWidth="2"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
