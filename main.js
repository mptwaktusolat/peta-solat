import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'

var southWest = L.latLng(-1.55863, 95.74416),
  northEast = L.latLng(8.733849, 124.80310),
  bounds = L.latLngBounds(southWest, northEast);

var map = L.map('map');
map.setView([3.0701342867861086, 101.62496634913956], 7);
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
    case 'NGS':
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

function onFeatureClick(e) {
  console.log(e.target.feature.properties);
  document.getElementById("card-state-area").innerText = e.target.feature.properties.name + ", " + e.target.feature.properties.state;
  document.getElementById("card-zonecode").innerText = e.target.feature.properties.jakim_code;
  // document.getElementById("latlanginfo").innerText = "";
  console.log(e);
  document.getElementById("card-latlanginfo").innerText = `${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`;
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
  })
  .catch(error => {
    console.error('Error loading GeoJSON data:', error);
  });



