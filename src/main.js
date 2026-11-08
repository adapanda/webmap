
import './style.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import { getRenderPixel } from 'ol/render.js'
import 'ol/ol.css'

document.querySelector('#app').innerHTML = `
  <div class="map-header">
    <h1>The impact of flood risks on cycling routes and access to schools in Turku</h1>
    <p>
      Visualizing flood risks on cycling routes around schools in Turku
    </p>
  </div>

  <div class="map-container">
    <div id="map"></div>

    <div id="map-instructions" class="map-instructions">
      <h3>Explore flood risks around schools</h3>
      <p>
        Select a school on the map to view its 5 km surrounding area,
        cycling routes and flood risk zones.
      </p>
    </div>

    <button id="reset-map" class="reset-map">
      Reset map
    </button>

    <div id="map-legend" class="map-legend">
      <h3>Legend</h3>

      <div class="legend-item">
        <span class="legend-school"></span>
        <span>Schools</span>
      </div>

      <div class="legend-item">
        <span class="legend-selected-school"></span>
        <span>Selected school</span>
      </div>

      <div class="legend-item">
        <span class="legend-route"></span>
        <span>Regular cycling routes</span>
      </div>

      <div class="legend-item">
        <span class="legend-flood-route"></span>
        <span>Flood-exposed cycling routes</span>
      </div>

      <div class="legend-item">
        <span class="legend-flood-area"></span>
        <span>Flood risk areas</span>
      </div>

      <div class="legend-item">
        <span class="legend-buffer"></span>
        <span>5 km school buffer</span>
      </div>
    </div>

    <div id="layer-control" class="layer-control">
      <h3>Map layers</h3>

      <label>
        <input type="checkbox" id="toggle-schools" checked>
        Schools
      </label>

      <label>
        <input type="checkbox" id="toggle-flood">
        Flood risk areas
      </label>

      <label>
        <input type="checkbox" id="toggle-cycling">
        Regular cycling routes
      </label>

      <label>
        <input type="checkbox" id="toggle-flood-cycling">
        Flood-exposed cycling routes
      </label>

      <label>
        <input type="checkbox" id="toggle-buffer">
        5 km school buffer
      </label>

      <label>
        <input type="checkbox" id="toggle-study-area" checked>
        Study area boundary
      </label>
    </div>
  </div>

  <div id="info"></div>
`

const wmsUrl = '/geoserver/floodmap/wms'

function fixEncoding(text) {
  return (text || '')
    .replaceAll('Ã¤', 'ä')
    .replaceAll('Ã¶', 'ö')
    .replaceAll('Ã„', 'Ä')
    .replaceAll('Ã–', 'Ö')
    .replaceAll('Ã¥', 'å')
    .replaceAll('Ã…', 'Å')
}

const schoolsLayer = new VectorLayer({
  source: new VectorSource({
    url:
      '/geoserver/floodmap/ows?' +
      'service=WFS&version=1.0.0&request=GetFeature&' +
      'typeName=floodmap:schools_in_turku&' +
      'outputFormat=application/json&' +
      'srsName=EPSG:3857',
    format: new GeoJSON(),
  }),
  visible: true,
  style: new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: '#1976D2',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
})

const bufferDataPromise = fetch(
  '/geoserver/floodmap/ows?' +
    'service=WFS&version=1.0.0&request=GetFeature&' +
    'typeName=floodmap:schools_5km_buffer&' +
    'outputFormat=application/json&' +
    'srsName=EPSG:3857'
)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to load school buffers')
    }

    return response.json()
  })
  .then((data) => data.features)
  .catch(() => [])

const bufferSource = new VectorSource()

const selectedBufferLayer = new VectorLayer({
  source: bufferSource,
  visible: false,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0)',
    }),
    stroke: new Stroke({
      color: '#e53935',
      width: 2,
      lineDash: [8, 5],
    }),
  }),
})

const selectedSchoolSource = new VectorSource()

const selectedSchoolLayer = new VectorLayer({
  source: selectedSchoolSource,
  visible: true,
  style: new Style({
    image: new CircleStyle({
      radius: 11,
      fill: new Fill({
        color: '#FFEB3B',
      }),
      stroke: new Stroke({
        color: '#222222',
        width: 3,
      }),
    }),
  }),
})

const floodRiskLayer = new TileLayer({
  visible: false,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: 'floodmap:tulvariski_yhdistetty',
    },
  }),
})

const cyclingNetworkLayer = new TileLayer({
  visible: false,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: 'floodmap:cycling_network',
    },
  }),
})

const floodCyclingRoutesLayer = new TileLayer({
  visible: false,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: 'floodmap:Flood_risk_cycling_routes_5km_from_schools_right',
    },
  }),
})

const studyAreaLayer = new TileLayer({
  visible: true,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: 'floodmap:aluerajaus',
    },
  }),
})

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    studyAreaLayer,
    selectedBufferLayer,
    floodRiskLayer,
    cyclingNetworkLayer,
    floodCyclingRoutesLayer,
    schoolsLayer,
    selectedSchoolLayer,
  ],
  view: new View({
    center: [2485162, 8502291],
    zoom: 13,
  }),
})

let activeBufferGeometry = null

function clipLayerToBuffer(layer) {
  layer.on('prerender', (event) => {
    if (!activeBufferGeometry || !event.context) return

    const context = event.context
    const geometryType = activeBufferGeometry.getType()
    const coordinates = activeBufferGeometry.getCoordinates()

    const polygons =
      geometryType === 'Polygon'
        ? [coordinates]
        : coordinates

    context.save()
    context.beginPath()

    polygons.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((coordinate, index) => {
          const pixel = getRenderPixel(
            event,
            map.getPixelFromCoordinate(coordinate)
          )

          if (index === 0) {
            context.moveTo(pixel[0], pixel[1])
          } else {
            context.lineTo(pixel[0], pixel[1])
          }
        })

        context.closePath()
      })
    })

    context.clip('evenodd')
  })

  layer.on('postrender', (event) => {
    if (event.context && activeBufferGeometry) {
      event.context.restore()
    }
  })
}

clipLayerToBuffer(floodRiskLayer)
clipLayerToBuffer(cyclingNetworkLayer)
clipLayerToBuffer(floodCyclingRoutesLayer)

function updateLayerCheckboxes() {
  document.getElementById('toggle-schools').checked =
    schoolsLayer.getVisible()

  document.getElementById('toggle-flood').checked =
    floodRiskLayer.getVisible()

  document.getElementById('toggle-cycling').checked =
    cyclingNetworkLayer.getVisible()

  document.getElementById('toggle-flood-cycling').checked =
    floodCyclingRoutesLayer.getVisible()

  document.getElementById('toggle-buffer').checked =
    selectedBufferLayer.getVisible()

  document.getElementById('toggle-study-area').checked =
    studyAreaLayer.getVisible()
}

document.getElementById('toggle-schools').addEventListener('change', (event) => {
  schoolsLayer.setVisible(event.target.checked)
  selectedSchoolLayer.setVisible(event.target.checked)
})

document.getElementById('toggle-flood').addEventListener('change', (event) => {
  floodRiskLayer.setVisible(event.target.checked)
})

document.getElementById('toggle-cycling').addEventListener('change', (event) => {
  cyclingNetworkLayer.setVisible(event.target.checked)
})

document.getElementById('toggle-flood-cycling').addEventListener('change', (event) => {
  floodCyclingRoutesLayer.setVisible(event.target.checked)
})

document.getElementById('toggle-buffer').addEventListener('change', (event) => {
  selectedBufferLayer.setVisible(
    event.target.checked && bufferSource.getFeatures().length > 0
  )
})

document.getElementById('toggle-study-area').addEventListener('change', (event) => {
  studyAreaLayer.setVisible(event.target.checked)
})

map.on('click', async (event) => {
  const feature = map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => feature,
    {
      layerFilter: (layer) => layer === schoolsLayer,
    }
  )

  if (!feature) return

  const schoolName = fixEncoding(feature.get('kohteen_ni'))
  const address = fixEncoding(feature.get('osoite'))
  const services = fixEncoding(feature.get('palvelut'))

  selectedSchoolSource.clear()
  selectedSchoolSource.addFeature(feature.clone())
  document.getElementById('map-instructions').style.display = 'none'

  const bufferData = await bufferDataPromise

  const matchingBuffer = bufferData.find(
    (buffer) =>
      fixEncoding(buffer.properties.kohteen_ni) === schoolName
  )

  bufferSource.clear()
  activeBufferGeometry = null

  if (matchingBuffer) {
    const bufferFeature = new GeoJSON().readFeature(
      matchingBuffer,
      {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857',
      }
    )

    bufferSource.addFeature(bufferFeature)
    activeBufferGeometry = bufferFeature.getGeometry()

    selectedBufferLayer.setVisible(true)
    floodRiskLayer.setVisible(true)
    cyclingNetworkLayer.setVisible(true)
    floodCyclingRoutesLayer.setVisible(true)
  } else {
    selectedBufferLayer.setVisible(false)
    floodRiskLayer.setVisible(false)
    cyclingNetworkLayer.setVisible(false)
    floodCyclingRoutesLayer.setVisible(false)
  }

  updateLayerCheckboxes()

  if (matchingBuffer) {
    map.getView().fit(
      activeBufferGeometry.getExtent(),
      {
        padding: [50, 50, 50, 50],
        duration: 1000,
      }
    )
  }

  document.getElementById('info').innerHTML = `
    <h3>${schoolName}</h3>

    <p>
      <strong>Address:</strong><br>
      ${address || 'No address information available'}
    </p>

    <p>
      <strong>Services:</strong><br>
      ${services || 'No service information available'}
    </p>
  `

  map.render()
})

const initialCenter = [2485162, 8502291]
const initialZoom = 13

document.getElementById('reset-map').addEventListener('click', () => {
  selectedSchoolSource.clear()
  bufferSource.clear()

  activeBufferGeometry = null

  floodRiskLayer.setVisible(false)
  cyclingNetworkLayer.setVisible(false)
  floodCyclingRoutesLayer.setVisible(false)
  selectedBufferLayer.setVisible(false)

  schoolsLayer.setVisible(true)
  selectedSchoolLayer.setVisible(true)
  studyAreaLayer.setVisible(true)

  document.getElementById('info').innerHTML = ''
  document.getElementById('map-instructions').style.display = 'block'

  updateLayerCheckboxes()

  map.getView().animate({
    center: initialCenter,
    zoom: initialZoom,
    duration: 500,
  })

  map.render()
})

