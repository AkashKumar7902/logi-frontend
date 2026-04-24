import L from "leaflet";

const COLORS = {
  pickup: "#3570f5",
  dropoff: "#10b981",
  driver: "#1c42b0",
  user: "#3570f5",
};

function pinSvg({ fill, icon }) {
  return `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#0f1218" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path
        filter="url(#s)"
        d="M16 1C8.82 1 3 6.82 3 14c0 9.5 13 24 13 24s13-14.5 13-24c0-7.18-5.82-13-13-13z"
        fill="${fill}"
        stroke="white"
        stroke-width="2"
      />
      <circle cx="16" cy="14" r="6.5" fill="white"/>
      ${icon}
    </svg>
  `;
}

const ICON_PATHS = {
  pickup: `<circle cx="16" cy="14" r="3.2" fill="${COLORS.pickup}"/>`,
  dropoff: `<path d="M11.2 13.4 L14.6 16.8 L20.8 10.6" stroke="${COLORS.dropoff}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};

function pulseDotSvg(color) {
  return `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="14" fill="${color}" opacity="0.15">
        <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="18" r="7" fill="${color}" stroke="white" stroke-width="2.5"/>
    </svg>
  `;
}

export const pickupIcon = L.divIcon({
  html: pinSvg({ fill: COLORS.pickup, icon: ICON_PATHS.pickup }),
  className: "logi-marker",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

export const dropoffIcon = L.divIcon({
  html: pinSvg({ fill: COLORS.dropoff, icon: ICON_PATHS.dropoff }),
  className: "logi-marker",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

export const driverIcon = L.divIcon({
  html: pulseDotSvg(COLORS.driver),
  className: "logi-marker logi-marker-live",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const userIcon = L.divIcon({
  html: pulseDotSvg(COLORS.user),
  className: "logi-marker logi-marker-live",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const ROUTE_COLORS = {
  outline: "#ffffff",
  main: "#3570f5",
};
