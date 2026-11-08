// Bloomer Beauty Studio: Interactive map (Part 3)
// Shows both studios on a Leaflet map with OpenStreetMap tiles.
// Loaded only on contact.html, after the Leaflet library.
// Guided by the Leaflet quick start guide (leafletjs.com).



// ---------Studio details---------------

// The location pins for the two studios. 
const studioLocations = [
  {
    id: "sandton",
    name: "Sandton Studio",
    address: "12 Rivonia Road, Sandton, Johannesburg",
    phone: "011 234 5678",
    phoneLink: "+27112345678",
    latitude: -26.1075,
    longitude: 28.0560
  },
  {
    id: "rosebank",
    name: "Rosebank Studio",
    address: "45 Jan Smuts Avenue, Rosebank, Johannesburg",
    phone: "011 234 5679",
    phoneLink: "+27112345679",
    latitude: -26.1460,
    longitude: 28.0435
  }
];

// Matches the business hours in the footer of every page.
const studioHoursText = "Monday to Friday: 09:00 to 18:00. Saturday: 09:00 to 14:00.";

// How far in the map zooms when one studio is chosen (16 shows the streets).
const studioZoom = 16;


// ---------- Start-up-------------------

// Wait until the page has been read, then draw the map.
document.addEventListener("DOMContentLoaded", initStudioMap);


// ---------- Helpers-------------

// Builds an element with text in one go. Using textContent means the text is
// always shown as plain text and never run as code.
function buildElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

// The link that opens turn by turn directions to a studio in Google Maps.
function directionsUrl(studio) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + studio.latitude + "," + studio.longitude;
}

// The custom pin: a blush pink teardrop drawn with CSS (see style.css), so
// no image file is needed.
function buildPinIcon() {
  return L.divIcon({
    className: "studio-pin", // replaces Leaflet's default white box
    html: "<span></span>",
    iconSize: [30, 30],
    iconAnchor: [15, 38], // the tip of the pin sits on the exact spot
    popupAnchor: [0, -36] // the popup opens above the pin
  });
}

// Builds the content of the popup that opens when a pin is selected.
function buildPopupContent(studio) {
  const box = document.createElement("div");

  const phoneLink = buildElement("a", studio.phone);
  phoneLink.href = "tel:" + studio.phoneLink; // tapping it calls the studio on a phone
  const phoneLine = document.createElement("p");
  phoneLine.append("Tel: ", phoneLink);

  const directionsLink = buildElement("a", "Get directions (opens Google Maps)", "directions-link");
  directionsLink.href = directionsUrl(studio);
  directionsLink.target = "_blank";
  directionsLink.rel = "noopener noreferrer";

  box.append(
    buildElement("h3", studio.name),
    buildElement("p", studio.address),
    phoneLine,
    buildElement("p", studioHoursText),
    directionsLink
  );
  return box;
}


// ---------- The map------------

function initStudioMap() {
  const mapBox = document.getElementById("studio-map");
  if (!mapBox) return; // not on the contact page

  // Leaflet adds this class when it draws a map. If it is already there, the
  // map has been set up, so do not set it up a second time.
  if (mapBox.classList.contains("leaflet-container")) return;

  // If the Leaflet library did not load (for example, no internet), hide the
  // empty map box. The directions links under it still work.
  if (typeof L === "undefined") {
    mapBox.hidden = true;
    return;
  }

  // People who ask their device for less movement get no map animation.
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const moveOptions = { animate: !reduceMotion };

  // scrollWheelZoom is off so scrolling down the page with a mouse wheel
  // does not suddenly zoom the map. The + and - buttons still work.
  const map = L.map(mapBox, { scrollWheelZoom: false });

  // The map tiles come from OpenStreetMap, which must be credited.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add one pin per studio and remember it, so the buttons can open its popup.
  const pinIcon = buildPinIcon();
  const markers = {};
  const positions = [];

  studioLocations.forEach(function (studio) {
    const position = [studio.latitude, studio.longitude];
    positions.push(position);

    markers[studio.id] = L.marker(position, {
      icon: pinIcon,
      title: studio.name, // shown as a tooltip and read by screen readers
      alt: studio.name,
      keyboard: true // the pin can be reached with Tab and opened with Enter
    })
      .addTo(map)
      .bindPopup(buildPopupContent(studio));
  });

  // Start with both studios in view, with some space around the pins.
  const showBoth = function () {
    map.closePopup();
    map.fitBounds(positions, Object.assign({ padding: [60, 60] }, moveOptions));
  };
  showBoth();

  // Moves to one studio and opens its popup.
  const showStudio = function (studio) {
    map.setView([studio.latitude, studio.longitude], studioZoom, moveOptions);
    markers[studio.id].openPopup();
  };

  // The buttons above the map. They only make sense once the map exists,
  // so they start hidden in the HTML.
  const controls = document.getElementById("map-controls");
  controls.hidden = false;

  controls.querySelectorAll("button").forEach(function (button) {
    button.addEventListener("click", function () {
      const choice = button.dataset.studio;
      if (choice === "both") {
        showBoth();
        return;
      }
      const studio = studioLocations.find(function (item) { return item.id === choice; });
      if (studio) showStudio(studio);
    });
  });
}