import maplibregl, {
  type ExpressionSpecification,
  type LngLatLike,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const geoJsonUrl =
  "https://raw.githubusercontent.com/mptwaktusolat/jakim.geojson/master/malaysia.district-jakim.geojson";
const malaysiaBounds: [[number, number], [number, number]] = [
  [91.17968766368219, -8.39979528699539],
  [131.37879837658514, 15.368147664459787],
];

type JakimProperties = {
  name?: string;
  state?: string;
  jakim_code?: string;
};

type Position = [number, number];
type Ring = Position[];
type JakimGeometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type JakimFeature = {
  type: "Feature";
  properties: JakimProperties;
  geometry: JakimGeometry;
};
type JakimFeatureCollection = {
  type: "FeatureCollection";
  features: JakimFeature[];
};

const fillColorExpression: ExpressionSpecification = [
  "match",
  ["get", "state"],
  "SGR",
  "red",
  "KDH",
  "green",
  "PLS",
  "yellow",
  "TRG",
  "purple",
  "KTN",
  "orange",
  "PHG",
  "brown",
  "PRK",
  "#60E550",
  "SBH",
  "#F67575",
  "SWK",
  "#FFA34D",
  "MLK",
  "#219C90",
  "PNG",
  "#D3504A",
  "JHR",
  "#22B2DA",
  "NSN",
  "#6C4AB6",
  "blue",
];

const infoDialog = document.querySelector("dialog");
const infoBtn = document.getElementById("info-button");
const stateArea = document.getElementById("card-state-area");
const zoneCode = document.getElementById("card-zonecode");
const latLngInfo = document.getElementById("card-latlanginfo");

infoBtn?.addEventListener("click", () => {
  infoDialog?.showModal();
});

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  },
  center: [102.62496634913956, 3.0701342867861086],
  zoom: 7,
  minZoom: 6,
  maxZoom: 19,
  maxBounds: malaysiaBounds,
});

let geoJson: JakimFeatureCollection | undefined;
let selectedMarker: maplibregl.Marker | undefined;

function setCard(
  feature: JakimFeature,
  lat: number,
  lng: number,
  precision = 2,
) {
  if (stateArea) {
    stateArea.innerText = `${feature.properties.name ?? "--"}, ${
      feature.properties.state ?? "--"
    }`;
  }
  if (zoneCode) {
    zoneCode.innerText = feature.properties.jakim_code ?? "--";
  }
  if (latLngInfo) {
    latLngInfo.innerText = `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }
}

function setSelectedMarker(lngLat: LngLatLike) {
  selectedMarker?.remove();
  selectedMarker = new maplibregl.Marker({ color: "#22c55e" })
    .setLngLat(lngLat)
    .addTo(map);
}

function pointInRing(point: Position, ring: Ring) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInPolygon(point: Position, rings: Ring[]) {
  return (
    pointInRing(point, rings[0]) &&
    !rings.slice(1).some((ring) => pointInRing(point, ring))
  );
}

function featureContains(feature: JakimFeature, point: Position) {
  if (feature.geometry.type === "Polygon") {
    return pointInPolygon(point, feature.geometry.coordinates);
  }

  return feature.geometry.coordinates.some((polygon) =>
    pointInPolygon(point, polygon),
  );
}

function findFeatureAt(lng: number, lat: number) {
  return geoJson?.features.find((feature) =>
    featureContains(feature, [lng, lat]),
  );
}

function onMapClick(event: MapLayerMouseEvent) {
  const feature = event.features?.[0] as JakimFeature | undefined;
  if (!feature) {
    return;
  }

  setCard(feature, event.lngLat.lat, event.lngLat.lng);
  setSelectedMarker(event.lngLat);
}

function locateUser() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      map.flyTo({ center: [lng, lat], zoom: 9 });
      new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);

      if (latLngInfo) {
        latLngInfo.innerText = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
      }

      const feature = findFeatureAt(lng, lat);
      if (feature) {
        setCard(feature, lat, lng, 3);
      }
    },
    (error) => {
      alert(error.message);
    },
  );
}

map.on("load", async () => {
  try {
    const response = await fetch(geoJsonUrl);
    if (!response.ok) {
      throw new Error(`GeoJSON request failed: ${response.status}`);
    }

    geoJson = (await response.json()) as JakimFeatureCollection;

    map.addSource("jakim", {
      type: "geojson",
      data: geoJson,
    });

    map.addLayer({
      id: "jakim-fill",
      type: "fill",
      source: "jakim",
      paint: {
        "fill-color": fillColorExpression,
        "fill-opacity": 0.5,
      },
    });

    map.addLayer({
      id: "jakim-outline",
      type: "line",
      source: "jakim",
      paint: {
        "line-color": "white",
        "line-width": 2,
        "line-opacity": 1,
      },
    });

    map.on("click", "jakim-fill", onMapClick);
    map.on("mouseenter", "jakim-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "jakim-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    locateUser();
  } catch (error) {
    alert(`Error loading GeoJSON data: ${String(error)}`);
  }
});
