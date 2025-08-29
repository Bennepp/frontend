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
    { position: [40.73061, -73.935242], title: "Brooklyn", details: "Example details" }
  ];

  const allMarkers = [];

  function addMarker(lat, lng, title, details) {
    const marker = L.marker([lat, lng], { icon: osuIcon }).addTo(map);
    const popupContent = `
      <div class='infoBox'>
        <button class='closeBtn' onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        <h3>${title}</h3>
        <p>${details}</p>
      </div>
    `;
    marker.bindPopup(popupContent);
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

  const blacklist = ["testterm", "@everyone", "spam"]; // Frontend blacklist

  document.getElementById("sendBtn").addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();

    // Check blacklist before sending
    const foundTerm = blacklist.find(term =>
      [name, location, description].some(field => field.toLowerCase().includes(term))
    );

    if (foundTerm) {
      alert(`Submission blocked! Contains blacklisted term: "${foundTerm}"`);
      return; // stop here, never send to backend
    }

    try {
      const res = await fetch("https://discord-backend-production-71e5.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, description })
      });

      const result = await res.json();
      if (result.success) alert("Submission sent!");
      else alert(`Failed to send: ${result.message || "Unknown error"}`);
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
