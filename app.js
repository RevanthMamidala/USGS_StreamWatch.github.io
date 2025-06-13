// Station data
const stationsData = {
  "stations": [
    {
      "station_id": "05482000",
      "name": "Des Moines River at 2nd Avenue at Des Moines, IA",
      "lat": 41.61194444,
      "lon": -93.6197222,
      "drainage_area": 6245,
      "typical_nitrate": 8.5,
      "nitrate_loading_lbs_per_day": 143164,
      "huc8": "07100004",
      "description": "Major monitoring point below Saylorville Reservoir"
    },
    {
      "station_id": "05485500", 
      "name": "Des Moines River below Raccoon River at Des Moines, IA",
      "lat": 41.5785833,
      "lon": -93.6056111,
      "drainage_area": 9879,
      "typical_nitrate": 9.2,
      "nitrate_loading_lbs_per_day": 245122,
      "huc8": "07100008",
      "description": "Downstream of Raccoon River confluence"
    },
    {
      "station_id": "05476750",
      "name": "Des Moines River at Humboldt, IA",
      "lat": 42.71944444,
      "lon": -94.2202778,
      "drainage_area": 2256,
      "typical_nitrate": 6.8,
      "nitrate_loading_lbs_per_day": 41374,
      "huc8": "07100002",
      "description": "Upper Des Moines River watershed"
    },
    {
      "station_id": "05479000",
      "name": "East Fork Des Moines River at Dakota City, IA",
      "lat": 42.7236111,
      "lon": -94.19333333,
      "drainage_area": 1308,
      "typical_nitrate": 7.1,
      "nitrate_loading_lbs_per_day": 25047,
      "huc8": "07100003",
      "description": "East Fork before confluence with main stem"
    },
    {
      "station_id": "05480500",
      "name": "Des Moines River at Fort Dodge, IA",
      "lat": 42.5061111,
      "lon": -94.20111111,
      "drainage_area": 4190,
      "typical_nitrate": 7.5,
      "nitrate_loading_lbs_per_day": 84753,
      "huc8": "07100004",
      "description": "Middle Des Moines River watershed"
    },
    {
      "station_id": "05482300",
      "name": "North Raccoon River near Sac City, IA",
      "lat": 42.35455556,
      "lon": -94.9910278,
      "drainage_area": 700,
      "typical_nitrate": 5.2,
      "nitrate_loading_lbs_per_day": 9817,
      "huc8": "07100006", 
      "description": "North Raccoon River tributary"
    },
    {
      "station_id": "05481000",
      "name": "Boone River near Webster City, IA",
      "lat": 42.43277778,
      "lon": -93.80555556,
      "drainage_area": 844,
      "typical_nitrate": 6.3,
      "nitrate_loading_lbs_per_day": 14341,
      "huc8": "07100005",
      "description": "Boone River tributary watershed"
    },
    {
      "station_id": "05483450",
      "name": "Middle Raccoon River at Panora, IA",
      "lat": 41.6900,
      "lon": -94.3625,
      "drainage_area": 440,
      "typical_nitrate": 4.8,
      "nitrate_loading_lbs_per_day": 5696,
      "huc8": "07100007",
      "description": "South Raccoon River tributary"
    }
  ]
};

// Global variables
let map;
let markers = [];
let currentSelectedStation = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeMap();
  populateStationsTable();
  setupTableSorting();
});

// Initialize the Leaflet map
function initializeMap() {
  // Calculate bounds for all stations
  const lats = stationsData.stations.map(s => s.lat);
  const lons = stationsData.stations.map(s => s.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  
  // Calculate center point
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Create map centered to show all stations
  map = L.map('map').setView([centerLat, centerLon], 9);

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // Add station markers
  addStationMarkers();
  
  // Fit bounds to show all markers with padding
  const bounds = L.latLngBounds(stationsData.stations.map(s => [s.lat, s.lon]));
  map.fitBounds(bounds, { padding: [20, 20] });
}

// Get color based on nitrate concentration
function getNitrateColor(nitrate) {
  if (nitrate < 5.0) return '#22c55e'; // Green
  if (nitrate >= 5.0 && nitrate < 7.0) return '#f97316'; // Orange
  if (nitrate >= 7.0 && nitrate < 9.0) return '#ef4444'; // Red
  return '#dc2626'; // Dark Red
}

// Get marker size based on loading rate
function getMarkerSize(loading) {
  const minSize = 10;
  const maxSize = 20;
  const minLoading = Math.min(...stationsData.stations.map(s => s.nitrate_loading_lbs_per_day));
  const maxLoading = Math.max(...stationsData.stations.map(s => s.nitrate_loading_lbs_per_day));
  
  // Normalize loading to size range
  const normalized = (loading - minLoading) / (maxLoading - minLoading);
  return minSize + (normalized * (maxSize - minSize));
}

// Add station markers to the map
function addStationMarkers() {
  stationsData.stations.forEach(station => {
    const color = getNitrateColor(station.typical_nitrate);
    const size = getMarkerSize(station.nitrate_loading_lbs_per_day);
    
    // Create circle marker
    const marker = L.circleMarker([station.lat, station.lon], {
      radius: size,
      fillColor: color,
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8
    });

    // Create popup content
    const popupContent = createPopupContent(station);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    // Add click event to highlight table row
    marker.on('click', function() {
      highlightTableRow(station.station_id);
    });

    // Add marker to map and store reference
    marker.addTo(map);
    markers.push({
      marker: marker,
      station: station
    });
  });
}

// Create popup content for station
function createPopupContent(station) {
  const isHighNitrate = station.typical_nitrate > 7.0;
  const nitrateClass = isHighNitrate ? 'high-nitrate' : '';
  
  return `
    <div class="popup-content">
      <div class="popup-title">${station.name}</div>
      <div class="popup-details">
        <div class="popup-detail">
          <span class="popup-label">Station ID:</span>
          <span class="popup-value">${station.station_id}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-label">Nitrate Concentration:</span>
          <span class="popup-value ${nitrateClass}">${station.typical_nitrate} mg/L</span>
        </div>
        <div class="popup-detail">
          <span class="popup-label">Loading Rate:</span>
          <span class="popup-value">${station.nitrate_loading_lbs_per_day.toLocaleString()} lbs/day</span>
        </div>
        <div class="popup-detail">
          <span class="popup-label">Drainage Area:</span>
          <span class="popup-value">${station.drainage_area.toLocaleString()} mi²</span>
        </div>
        <div class="popup-detail">
          <span class="popup-label">HUC8:</span>
          <span class="popup-value">${station.huc8}</span>
        </div>
        <div class="popup-detail" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border);">
          <span class="popup-label" style="font-size: 12px; font-style: italic;">${station.description}</span>
        </div>
      </div>
    </div>
  `;
}

// Populate the stations data table
function populateStationsTable() {
  const tbody = document.getElementById('stations-tbody');
  tbody.innerHTML = '';

  stationsData.stations.forEach(station => {
    const row = document.createElement('tr');
    const isHighNitrate = station.typical_nitrate > 7.0;
    
    if (isHighNitrate) {
      row.classList.add('high-nitrate');
    }
    
    row.innerHTML = `
      <td>${station.station_id}</td>
      <td title="${station.name}">${truncateText(station.name, 30)}</td>
      <td>${station.typical_nitrate}</td>
      <td>${station.nitrate_loading_lbs_per_day.toLocaleString()}</td>
      <td>${station.drainage_area.toLocaleString()}</td>
    `;
    
    // Add click event to highlight map marker
    row.addEventListener('click', function() {
      highlightMapMarker(station.station_id);
      highlightTableRow(station.station_id);
    });
    
    // Store station ID for reference
    row.dataset.stationId = station.station_id;
    
    tbody.appendChild(row);
  });
}

// Truncate text for table display
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Highlight table row
function highlightTableRow(stationId) {
  // Remove previous selection
  const previousSelected = document.querySelector('#stations-tbody tr.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }
  
  // Add selection to current row
  const currentRow = document.querySelector(`#stations-tbody tr[data-station-id="${stationId}"]`);
  if (currentRow) {
    currentRow.classList.add('selected');
    currentRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  currentSelectedStation = stationId;
}

// Highlight map marker
function highlightMapMarker(stationId) {
  const markerData = markers.find(m => m.station.station_id === stationId);
  if (markerData) {
    // Open popup
    markerData.marker.openPopup();
    
    // Pan to marker with zoom
    map.setView([markerData.station.lat, markerData.station.lon], Math.max(map.getZoom(), 10));
  }
}

// Setup table sorting functionality
function setupTableSorting() {
  const headers = document.querySelectorAll('#stations-table th[data-sort]');
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.dataset.sort;
      const currentSort = this.classList.contains('sort-asc') ? 'asc' : 
                         this.classList.contains('sort-desc') ? 'desc' : 'none';
      
      // Remove sort classes from all headers
      headers.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      // Determine new sort direction
      let newSort;
      if (currentSort === 'none' || currentSort === 'desc') {
        newSort = 'asc';
      } else {
        newSort = 'desc';
      }
      
      // Add new sort class
      this.classList.add(`sort-${newSort}`);
      
      // Sort the data
      sortTable(sortKey, newSort);
    });
  });
}

// Sort table data
function sortTable(sortKey, direction) {
  const sortedStations = [...stationsData.stations].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    
    // Handle string sorting
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
  
  // Repopulate table with sorted data
  const tbody = document.getElementById('stations-tbody');
  tbody.innerHTML = '';
  
  sortedStations.forEach(station => {
    const row = document.createElement('tr');
    const isHighNitrate = station.typical_nitrate > 7.0;
    
    if (isHighNitrate) {
      row.classList.add('high-nitrate');
    }
    
    // Restore selection if this was the selected station
    if (currentSelectedStation === station.station_id) {
      row.classList.add('selected');
    }
    
    row.innerHTML = `
      <td>${station.station_id}</td>
      <td title="${station.name}">${truncateText(station.name, 30)}</td>
      <td>${station.typical_nitrate}</td>
      <td>${station.nitrate_loading_lbs_per_day.toLocaleString()}</td>
      <td>${station.drainage_area.toLocaleString()}</td>
    `;
    
    // Add click event
    row.addEventListener('click', function() {
      highlightMapMarker(station.station_id);
      highlightTableRow(station.station_id);
    });
    
    row.dataset.stationId = station.station_id;
    tbody.appendChild(row);
  });
}