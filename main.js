const infoDialog = document.querySelector("dialog");
const infoBtn = document.getElementById("info-button");
infoBtn.addEventListener("click", function () {
  infoDialog.showModal();
}
);

var southWest = L.latLng(-8.39979528699539, 91.17968766368219),
  northEast = L.latLng(15.368147664459787, 131.37879837658514),
  bounds = L.latLngBounds(southWest, northEast);

var map = L.map('map');
map.setView([3.0701342867861086, 102.62496634913956], 7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  minZoom: 6,
  bounds: bounds,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
map.setMaxBounds(bounds);

// var marker = L.marker([3.066967540405101, 101.63685071533915]).addTo(map);

function polystyle(feature) {
  let color = 'blue';
  switch (feature.properties.state) {
    case 'SGR':
      color = 'red';
      break;
    case 'KDH':
      color = 'green';
      break;
    case 'PLS':
      color = 'yellow';
      break;
    case 'TRG':
      color = 'purple';
      break;
    case 'KTN':
      color = 'orange';
      break;
    case 'PHG':
      color = 'brown';
      break;
    case 'PRK':
      color = '#60E550';
      break;
    case 'SBH':
      color = '#F67575';
      break;
    case 'SWK':
      color = '#FFA34D';
      break;
    case 'MLK':
      color = '#219C90';
      break;
    case 'PNG':
      color = '#D3504A';
      break;
    case 'JHR':
      color = '#22B2DA';
      break;
    case 'NSN':
      color = '#6C4AB6';
      break;
    default:
      break;
  }
  return {
    fillColor: color,
    weight: 2,
    opacity: 1,
    color: 'white',  //Outline color
    fillOpacity: 0.5,
  };
}

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

let selectMarker = {};

function onFeatureClick(e) {
  console.log(e.target.feature.properties);
  document.getElementById("card-state-area").innerText = e.target.feature.properties.name + ", " + e.target.feature.properties.state;
  document.getElementById("card-zonecode").innerText = e.target.feature.properties.jakim_code;
  document.getElementById("card-latlanginfo").innerText = `${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`;

  if (selectMarker != undefined) {
    map.removeLayer(selectMarker);
  };

  //Add a marker to show where you clicked.
  selectMarker = L.marker([e.latlng.lat, e.latlng.lng], {
    icon: greenIcon
  }).addTo(map);
}


let geoJSONLayer;
// Fetch GeoJSON data
fetch('https://corsproxyuia.up.railway.app/https://github.com/mptwaktusolat/jakim.geojson/raw/master/malaysia.district-jakim.geojson')
  .then(response => response.json())
  .then(data => {
    const features = data.features;
    function onEachFeature(feature, layer) {
      //bind click
      layer.on({
        click: onFeatureClick
      });
    }
    // Add GeoJSON layer to the map
    geoJSONLayer = L.geoJSON(features, { style: polystyle, onEachFeature: onEachFeature }).addTo(map);

    // determine user location after geojson loaded, otherwise, the area and jakim in card will be empty
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  })
  .catch(error => {
    alert('Error loading GeoJSON data:', error);
  });

const successCallback = (position) => {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  map.setView([lat, lng], 9);
  L.marker([lat, lng]).addTo(map);

  // resolve the jakim zone
  document.getElementById("card-latlanginfo").innerText = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  if (geoJSONLayer) {
    geoJSONLayer.eachLayer(function (layer) {
      if (layer.getBounds().contains([lat, lng])) {
        console.log(layer.feature.properties);
        document.getElementById("card-state-area").innerText = layer.feature.properties.name + ", " + layer.feature.properties.state;
        document.getElementById("card-zonecode").innerText = layer.feature.properties.jakim_code;
      }
    });
  }
};

const errorCallback = (error) => {
  console.log(error);
};
