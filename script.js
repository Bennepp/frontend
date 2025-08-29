document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([40.7128, -74.0060], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const osuIcon = L.icon({
    iconUrl: "https://i.imgur.com/HQ2XMRB.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });

  const locations = [
    { address: "New York City", title: "New York City", details: "Example details" },
    { position: [40.73061, -73.935242], title: "Brooklyn", details: "Example details" },
    { address: "1401 N malone street", title: "Dazl", details: "zoophile" },
    { address: "20465 w walnut dr sonora ca", title: "intelzoz", details: "ilcp those who know" },
    { address: "pirupi, title: ", title:"409 snowbird rd chesterfield va", details: "BABY BABY I WANNA MAKE YOU KAMMMMMMMMMMM -bryan yahir hermandez cruz" },
    { address: "4 marsden avenue st helens", title: "Joshstar", details: "wow i made this" },
    { address: "140 abery drive maidstone kent", title: "TingMomentum", details: '"WHY DO YOU SPREAD CP TING? I DONT DO THAT ANYMORE"'},
    { address: "Edmonton canada", title: "Exislu", details: "schizo king"},
    { address: "8297 oliver twist lane nevada", title: "Gryphon1", details: "Looks like we have some cleaning up to do..... can also type at 75wpm thanks to linus tech tips"}
  ];

  const allMarkers = [];

  function addMarker(lat, lng, title, details) {
  const marker = L.marker([lat, lng], { icon: osuIcon }).addTo(map);

  // Create a custom div popup without Leaflet default styling
  const popupContent = L.DomUtil.create('div', 'infoBox');
  popupContent.innerHTML = `
    <button class='closeBtn' onclick="this.parentElement.remove()">×</button>
    <h3>${title}</h3>
    <p>${details}</p>
  `;

  // Bind the popup using 'className' to avoid Leaflet wrapper styling
  marker.bindPopup(popupContent, {
    className: 'noLeafletPopup',
    closeButton: false,
    autoClose: false
  });

  allMarkers.push({ marker, title, details, lat, lng });
  return marker;
}

  async function geocodeAndAdd(location) {
    if (location.position) {
      addMarker(location.position[0], location.position[1], location.title, location.details);
    } else if (location.address) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.address)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          addMarker(parseFloat(lat), parseFloat(lon), location.title, location.details);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }
  }

  locations.forEach(loc => geocodeAndAdd(loc));

  // --- Submission Form ---
  const submitBtn = document.getElementById("submitButton");
  const form = document.getElementById("submitForm");

  submitBtn.addEventListener("click", () => {
    form.style.display = form.style.display === "block" ? "none" : "block";
  });

  document.getElementById("sendBtn").addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;

    try {
      const res = await fetch("https://discord-backend-production-71e5.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, description })
      });

      if ((await res.json()).success) alert("Submission sent!");
      else alert("Failed to send.");
    } catch (err) {
      console.error(err);
      alert("Error sending submission.");
    }

    document.getElementById("name").value = "";
    document.getElementById("location").value = "";
    document.getElementById("description").value = "";
    form.style.display = "none";
  });

  // --- Search bar ---
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    searchResults.innerHTML = "";
    if (!query) return;

    const matches = allMarkers.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.details.toLowerCase().includes(query)
    );

    matches.forEach(item => {
      const div = document.createElement("div");
      div.className = "resultItem";
      div.textContent = `${item.title}: ${item.details.substring(0, 40)}${item.details.length > 40 ? '...' : ''}`;
      div.addEventListener("click", () => {
        map.setView([item.lat, item.lng], 14);
        item.marker.openPopup();
      });
      searchResults.appendChild(div);
    });
  });
});
