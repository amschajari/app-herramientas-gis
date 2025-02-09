// Inicialización del mapa
const map = L.map('map').setView([40.4165, -3.7026], 5); // Centrar en Madrid, España

// Capas base
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
});

const baseLayers = {
  "OpenStreetMap": osm,
  "Esri Satélite": esri
};

L.control.layers(baseLayers).addTo(map);

// Herramientas de dibujo
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polygon: true, polyline: true, marker: true, rectangle: false, circle: false }
});
map.addControl(drawControl);

// Evento al terminar de dibujar
map.on(L.Draw.Event.CREATED, function (event) {
  const layer = event.layer;
  drawnItems.addLayer(layer);

  if (layer instanceof L.Polygon) {
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    layer.bindPopup(`Área: ${area.toFixed(2)} m²`).openPopup();
  } else if (layer instanceof L.Polyline) {
    const distance = L.GeometryUtil.length(layer.getLatLngs());
    layer.bindPopup(`Distancia: ${distance.toFixed(2)} m`).openPopup();
  } else if (layer instanceof L.Marker) {
    const latLng = layer.getLatLng();
    layer.bindPopup(`Coordenadas: ${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`).openPopup();
  }
});

// Botón "Calcular área"
document.getElementById('calculate-area').addEventListener('click', function () {
  const drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { polygon: true, polyline: false, marker: false, rectangle: false, circle: false }
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);

    if (layer instanceof L.Polygon) {
      const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      layer.bindPopup(`Área: ${area.toFixed(2)} m²`).openPopup();
    }
  });
});

// Botón "Calcular distancia"
document.getElementById('calculate-distance').addEventListener('click', function () {
  const drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { polyline: true, polygon: false, marker: false, rectangle: false, circle: false }
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);

    if (layer instanceof L.Polyline) {
      const distance = L.GeometryUtil.length(layer.getLatLngs());
      layer.bindPopup(`Distancia: ${distance.toFixed(2)} m`).openPopup();
    }
  });
});

// Botón "Calcular coordenadas"
document.getElementById('calculate-coordinates').addEventListener('click', function () {
  const drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { marker: true, polyline: false, polygon: false, rectangle: false, circle: false }
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);

    if (layer instanceof L.Marker) {
      const latLng = layer.getLatLng();
      layer.bindPopup(`Coordenadas: ${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`).openPopup();
    }
  });
});

// Exportar coordenadas
document.getElementById('export-btn').addEventListener('click', function () {
  const tableBody = document.querySelector('#coordinates-table tbody');
  tableBody.innerHTML = '';

  drawnItems.eachLayer(layer => {
    let row = `<tr>`;
    if (layer instanceof L.Marker) {
      const latLng = layer.getLatLng();
      row += `<td>Marcador</td><td>${latLng.lat.toFixed(6)}</td><td>${latLng.lng.toFixed(6)}</td><td>N/A</td><td>N/A</td><td>N/A</td>`;
    } else if (layer instanceof L.Polyline) {
      const distance = L.GeometryUtil.length(layer.getLatLngs());
      row += `<td>Polilínea</td><td>N/A</td><td>N/A</td><td>N/A</td><td>${distance.toFixed(2)}</td><td>N/A</td>`;
    } else if (layer instanceof L.Polygon) {
      const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      row += `<td>Polígono</td><td>N/A</td><td>N/A</td><td>N/A</td><td>N/A</td><td>${area.toFixed(2)}</td>`;
    }
    row += `</tr>`;
    tableBody.innerHTML += row;
  });

  document.getElementById('modal').style.display = 'block';
});

// Descargar CSV
document.getElementById('download-csv').addEventListener('click', function () {
  const rows = [];
  rows.push(['Tipo', 'Latitud', 'Longitud', 'Elevación', 'Distancia (m)', 'Área (m²)']);

  drawnItems.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      const latLng = layer.getLatLng();
      rows.push(['Marcador', latLng.lat.toFixed(6), latLng.lng.toFixed(6), 'N/A', 'N/A', 'N/A']);
    } else if (layer instanceof L.Polyline) {
      const distance = L.GeometryUtil.length(layer.getLatLngs());
      rows.push(['Polilínea', 'N/A', 'N/A', 'N/A', distance.toFixed(2), 'N/A']);
    } else if (layer instanceof L.Polygon) {
      const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      rows.push(['Polígono', 'N/A', 'N/A', 'N/A', 'N/A', area.toFixed(2)]);
    }
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(row => row.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "coordenadas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Generar y descargar KML
document.getElementById('download-kml').addEventListener('click', function () {
  const kml = generateKml();
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "coordenadas.kml";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function generateKml() {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>\n`;

  drawnItems.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      const latLng = layer.getLatLng();
      kml += `
      <Placemark>
        <name>Marcador</name>
        <Point>
          <coordinates>${latLng.lng},${latLng.lat},0</coordinates>
        </Point>
      </Placemark>`;
    } else if (layer instanceof L.Polyline) {
      const points = layer.getLatLngs().map(latLng => `${latLng.lng},${latLng.lat},0`).join(' ');
      kml += `
      <Placemark>
        <name>Polilínea</name>
        <LineString>
          <coordinates>${points}</coordinates>
        </LineString>
      </Placemark>`;
    } else if (layer instanceof L.Polygon) {
      const points = layer.getLatLngs()[0].map(latLng => `${latLng.lng},${latLng.lat},0`).join(' ');
      kml += `
      <Placemark>
        <name>Polígono</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${points}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>`;
    }
  });

  kml += `
  </Document>
</kml>`;
  return kml;
}

// Cerrar modal
document.querySelector('.close').addEventListener('click', function () {
  document.getElementById('modal').style.display = 'none';
});