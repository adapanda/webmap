
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

// University of Turku GeoServer
const geoserverUrl = 'https://geo-maa.utu.fi/geoserver'
const workspace = 'LasNinas_geoserver'
const wmsUrl = `${geoserverUrl}/${workspace}/wms`
const wfsUrl = `${geoserverUrl}/${workspace}/ows`

const projection = 'EPSG:3857'

// Create the application layout
document.querySelector('#app').innerHTML = `
  <div class="map-header">
    <h1>Explore Flood Risks Around Your School</h1>
    <p>
      Discover how rainfall, sea levels and climate change
      can influence flooding in Turku.
    </p>
  </div>

  <div class="map-container">
    <div id="map"></div>
    <div id="depth-tooltip"></div>

    <div class="map-instructions">
      <h3>Explore your surroundings</h3>
      <p>
        Select a school on the map or search for its name.
        Explore modelled flood risks within 1 km of the school.
      </p>
    </div>

    <div id="info">
  <h2>Explore flooding near your school</h2>
  <p>
    Choose a school to begin exploring the map.
  </p>
</div>

    <div class="map-controls">
      <label for="school-search">Find your school</label>
      <input
        id="school-search"
        type="text"
        list="school-list"
        placeholder="Search for a school..."
      >
      <datalist id="school-list"></datalist>

      <h3>Flood scenario</h3>
      <label>
        <input type="radio" name="scenario"
          value="moderate" checked>
        Moderate emissions
      </label>
      <label>
        <input type="radio" name="scenario"
          value="high">
        High emissions
      </label>

      <h3>Map layers</h3>
      <label>
        <input type="checkbox" id="toggle-flood" checked>
        Flood risk areas
      </label>
      <label>
        <input type="checkbox" id="toggle-schools" checked>
        Schools
      </label>
      <label>
        <input type="checkbox" id="toggle-buffer" checked>
        1 km school area
      </label>

      <button id="reset-map">Reset map</button>
    </div>

    <div class="map-legend">
      <h3>Legend</h3>
      <div class="legend-item">
        <span class="legend-school"></span>
        Schools
      </div>
      <div class="legend-item">
        <span class="legend-selected-school"></span>
        Selected school
      </div>
      <div class="legend-item">
        <span class="legend-buffer"></span>
        1 km school area
      </div>
      <div class="legend-depth">
        <div class="legend-depth-title">Flood depth (cm)</div>
        <div class="legend-depth-gradient"></div>
        <div class="legend-depth-labels">
          <span>10</span>
          <span>20</span>
          <span>30</span>
          <span>40</span>
          <span>50</span>
      </div>
      </div>
    </div>
  </div>

  

  <div class="learning-content">
    <h2>Learn about flooding</h2>

    <section class="learning-box">
      <h3>1. Why do cities flood?</h3>

      <h4>Pluvial flooding – when rainwater accumulates</h4>
      <p>
        During heavy rainfall, water flows over roads, roofs
        and other hard surfaces. If it cannot soak into the
        ground or drain away quickly enough, it can accumulate
        in streets and low-lying areas.
      </p>
      <p><strong>Key concept:</strong>
        Rainfall, runoff and urban surfaces.
      </p>

      <h4>Coastal flooding – when sea levels rise temporarily</h4>
      <p>
        Strong winds and weather conditions can temporarily
        raise sea levels along the coast. In Turku, this can
        affect low-lying waterfront areas and the lower reaches
        of the Aura River.
      </p>
      <p><strong>Key concept:</strong>
        Sea level and low-lying coastal areas.
      </p>

      <h4>Compound flooding – when the two interact</h4>
      <p>
        When sea levels are high, stormwater may have more
        difficulty draining into the sea or rivers. If heavy
        rainfall occurs at the same time, water can accumulate
        more easily in low-lying urban areas.
      </p>
      <p><strong>Key concept:</strong>
        Connected water systems.
      </p>
    </section>

    <section class="learning-box">
      <h3>2. When rain meets the sea</h3>
      <h4>What happens when heavy rain meets high sea levels?</h4>
      <p>
        Rainwater in cities often flows through drains and
        pipes into rivers or the sea. But what happens if
        the sea level is already unusually high?
      </p>
      <p>
        High sea levels can slow down the drainage of
        stormwater. When heavy rainfall occurs at the same
        time, water may accumulate more easily in streets
        and low-lying areas.
      </p>
      <p>
        This is one example of compound flooding: when
        different flood processes interact and may make
        flooding worse.
      </p>
      <strong>Explore the map</strong>
      <p>
        Can you find flood-prone areas near the Aura River
        or the coast? What might happen to stormwater
        drainage when the sea level rises?
      </p>
    </section>

    <section class="learning-box">
      <h3>3. How could climate change affect flooding?</h3>
      <p>
        As the climate warms, heavy rainfall may become
        more intense. Changes in sea levels can also
        influence coastal flooding.
      </p>
      <p>
        In Turku, this matters because the city is located
        on the coast, near the mouth of the Aura River,
        where coastal water levels and urban drainage
        can interact.
      </p>
      <strong>Explore the scenarios</strong>
      <ul>
        <li>Switch between moderate and high emissions.</li>
        <li>Where do you see differences in flood extent?</li>
        <li>Do areas with deeper water change?</li>
        <li>What might this mean for your school surroundings?</li>
      </ul>
    </section>

    <section class="learning-box">
      <h3>4. How can we adapt?</h3>
      <p>
        Green spaces, permeable surfaces, stormwater ponds
        and improved drainage systems can help cities
        manage heavy rainfall.
      </p>
      <p>
        Urban planning can also reduce risks by avoiding
        vulnerable locations when building new infrastructure.
      </p>
      <strong>Think about your surroundings</strong>
      <p>
        What could be done to reduce flood risks near your school?
      </p>
    </section>

    <section class="learning-box">
      <h3>Explore the map: questions to think about</h3>
      <ul>
        <li>Where are the nearest modelled flood-prone areas?</li>
        <li>Can you find areas with deeper water?</li>
        <li>Are they close to the coast, a river or somewhere else?</li>
        <li>How might buildings, asphalt and green spaces affect runoff?</li>
        <li>What could be done to reduce flood risks?</li>
      </ul>
    </section>

    <p class="map-note">
      The map displays combined modelled coastal and stormwater
      flood hazards. Individual flooded locations cannot be
      classified as exclusively coastal or pluvial based on
      this combined layer alone.
    </p>
  </div>
`

// Request GeoJSON data from GeoServer
async function fetchLayer(layerName) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: `${workspace}:${layerName}`,
    outputFormat: 'application/json',
    srsName: projection,
  })

  const response = await fetch(`${wfsUrl}?${params}`)

  if (!response.ok) {
    throw new Error(`Could not load ${layerName}`)
  }

  return response.json()
}

// Fix incorrectly encoded Finnish characters if necessary
function fixEncoding(text) {
  return (text || '')
    .replaceAll('Ã¤', 'ä')
    .replaceAll('Ã¶', 'ö')
    .replaceAll('Ã„', 'Ä')
    .replaceAll('Ã–', 'Ö')
    .replaceAll('Ã¥', 'å')
    .replaceAll('Ã…', 'Å')
}

// School point style
const schoolStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: '#1976D2' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
})

// Selected school style
const selectedSchoolStyle = new Style({
  image: new CircleStyle({
    radius: 11,
    fill: new Fill({ color: '#FFEB3B' }),
    stroke: new Stroke({ color: '#222222', width: 3 }),
  }),
})

// School layers
const schoolsSource = new VectorSource()

const schoolsLayer = new VectorLayer({
  source: schoolsSource,
  visible: true,
  style: schoolStyle,
})

const selectedSchoolSource = new VectorSource()

const selectedSchoolLayer = new VectorLayer({
  source: selectedSchoolSource,
  visible: true,
  style: selectedSchoolStyle,
})

// School buffer layer
const bufferSource = new VectorSource()

const bufferLayer = new VectorLayer({
  source: bufferSource,
  visible: false,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 193, 7, 0.10)',
    }),
    stroke: new Stroke({
      color: '#e53935',
      width: 2,
      lineDash: [8, 5],
    }),
  }),
})

// WMS flood layers
const moderateFloodLayer = new TileLayer({
  visible: true,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: `${workspace}:flood_depths_moderate`,
      TILED: true,
    },
    crossOrigin: 'anonymous',
  }),
})

const highFloodLayer = new TileLayer({
  visible: false,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: `${workspace}:flood_depths_high`,
      TILED: true,
    },
    crossOrigin: 'anonymous',
  }),
})

// Study area boundary
const studyAreaLayer = new TileLayer({
  visible: true,
  source: new TileWMS({
    url: wmsUrl,
    params: {
      LAYERS: `${workspace}:studyarea`,
      TILED: true,
    },
    crossOrigin: 'anonymous',
  }),
})

// Create the map
const initialCenter = [2485162, 8502291]
const initialZoom = 13

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    studyAreaLayer,
    moderateFloodLayer,
    highFloodLayer,
    bufferLayer,
    schoolsLayer,
    selectedSchoolLayer,
  ],
  view: new View({
    center: initialCenter,
    zoom: initialZoom,
  }),
})

// Active school buffer geometry
let activeBufferGeometry = null
let schoolFeatures = []
let bufferFeatures = []

// Clip WMS layers to the selected school buffer
function clipLayerToBuffer(layer) {
  layer.on('prerender', (event) => {
    if (!activeBufferGeometry || !event.context) return

    const context = event.context
    const geometryType = activeBufferGeometry.getType()
    const coordinates = activeBufferGeometry.getCoordinates()

    const polygons =
      geometryType === 'Polygon' ? [coordinates] : coordinates

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


// Show flood depth when hovering over the map
const depthTooltip = document.getElementById('depth-tooltip')

let hoverTimeout

map.on('pointermove', (event) => {
  if (event.dragging) {
    depthTooltip.style.display = 'none'
    return
  }

  if (!document.getElementById('toggle-flood').checked) {
    depthTooltip.style.display = 'none'
    return
  }

  clearTimeout(hoverTimeout)

  const pixel = event.pixel
  const coordinate = event.coordinate

  depthTooltip.style.display = 'none'

  hoverTimeout = setTimeout(async () => {
    const isHigh =
      document.querySelector('input[name="scenario"]:checked').value === 'high'

    const activeLayer = isHigh
      ? highFloodLayer
      : moderateFloodLayer

    const source = activeLayer.getSource()

    const url = source.getFeatureInfoUrl(
      coordinate,
      map.getView().getResolution(),
      map.getView().getProjection(),
      {
        INFO_FORMAT: 'application/json',
        FEATURE_COUNT: 1,
      }
    )

    if (!url) return

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties

        if (properties.DN !== undefined) {
          depthTooltip.textContent = `Flood depth: ${properties.DN} cm`

          depthTooltip.style.left = `${pixel[0] + 15}px`
          depthTooltip.style.top = `${pixel[1] + 15}px`
          depthTooltip.style.display = 'block'
        }
      }
    } catch (error) {
      console.error('Could not retrieve flood depth:', error)
    }
  }, 150)
})


clipLayerToBuffer(moderateFloodLayer)
clipLayerToBuffer(highFloodLayer)

// Select a school and its matching buffer
function selectSchool(school) {
  const schoolName = fixEncoding(school.get('kohteen_ni'))

  const matchingBuffer = bufferFeatures.find(
    (buffer) =>
      fixEncoding(buffer.get('kohteen_ni')) === schoolName
  )

  if (!matchingBuffer) {
    document.getElementById('info').innerHTML = `
      <h2>${schoolName}</h2>
      <p>Could not find a matching 1 km school area.</p>
    `
    return
  }

  selectedSchoolSource.clear()
  selectedSchoolSource.addFeature(school.clone())

  bufferSource.clear()
  bufferSource.addFeature(matchingBuffer)

  activeBufferGeometry = matchingBuffer.getGeometry()

  bufferLayer.setVisible(true)

  const extent = activeBufferGeometry.getExtent()

  map.getView().fit(extent, {
    padding: [60, 60, 60, 60],
    duration: 800,
    maxZoom: 16,
  })

  document.getElementById('info').innerHTML = `
  <h2>${schoolName}</h2>
  <p>
    Explore the modelled flood risks within 1 km
    of this school.
  </p>
`

  document.getElementById('toggle-buffer').checked = true

  map.render()
}

// Load school and buffer data
async function loadData() {
  try {
    const [schoolsData, buffersData] = await Promise.all([
      fetchLayer('turku_schools'),
      fetchLayer('schools_1km'),
    ])

    const format = new GeoJSON()

    schoolFeatures = format.readFeatures(schoolsData, {
      dataProjection: projection,
      featureProjection: projection,
    })

    bufferFeatures = format.readFeatures(buffersData, {
      dataProjection: projection,
      featureProjection: projection,
    })

    schoolsSource.addFeatures(schoolFeatures)

    // Add school names to the search list
    const schoolList = document.getElementById('school-list')

    schoolFeatures.forEach((school) => {
      const name = fixEncoding(school.get('kohteen_ni'))

      const option = document.createElement('option')
      option.value = name
      schoolList.appendChild(option)
    })

    console.log('Schools and school buffers loaded')
  } catch (error) {
    console.error('Error loading school data:', error)

    document.getElementById('info').innerHTML = `
      <h2>Data could not be loaded</h2>
      <p>
        Please check the GeoServer connection and try again.
      </p>
    `
  }
}

// Select school by clicking its marker
map.on('click', (event) => {
  const school = map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => feature,
    {
      layerFilter: (layer) => layer === schoolsLayer,
    }
  )

  if (school) {
    selectSchool(school)
  }
})

// Select school using the search field
document
  .getElementById('school-search')
  .addEventListener('change', (event) => {
    const searchName = event.target.value.trim().toLowerCase()

    const school = schoolFeatures.find(
      (feature) =>
        fixEncoding(feature.get('kohteen_ni')).toLowerCase() ===
        searchName
    )

    if (school) {
      selectSchool(school)
    } else {
      alert('School not found. Please select a school from the list.')
    }
  })

// Switch between flood scenarios
document
  .querySelectorAll('input[name="scenario"]')
  .forEach((input) => {
    input.addEventListener('change', (event) => {
      const isHigh = event.target.value === 'high'

      moderateFloodLayer.setVisible(!isHigh)
      highFloodLayer.setVisible(isHigh)
    })
  })

// Map layer controls
document.getElementById('toggle-flood').addEventListener('change', (event) => {
  moderateFloodLayer.setVisible(
    event.target.checked &&
    document.querySelector('input[name="scenario"]:checked').value === 'moderate'
  )

  highFloodLayer.setVisible(
    event.target.checked &&
    document.querySelector('input[name="scenario"]:checked').value === 'high'
  )
})

document.getElementById('toggle-schools').addEventListener('change', (event) => {
  schoolsLayer.setVisible(event.target.checked)
  selectedSchoolLayer.setVisible(event.target.checked)
})

document.getElementById('toggle-buffer').addEventListener('change', (event) => {
  bufferLayer.setVisible(
    event.target.checked && bufferSource.getFeatures().length > 0
  )
})


// Reset map
document.getElementById('reset-map').addEventListener('click', () => {
  selectedSchoolSource.clear()
  bufferSource.clear()

  activeBufferGeometry = null

  bufferLayer.setVisible(false)

  document.getElementById('info').innerHTML = `
    <h2>Explore flooding near your school</h2>
    <p>Choose a school to begin exploring the map.</p>
  `

  document.getElementById('school-search').value = ''

  map.getView().animate({
    center: initialCenter,
    zoom: initialZoom,
    duration: 500,
  })

  map.render()
})

// Start loading data
loadData()
