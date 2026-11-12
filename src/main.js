
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
import Icon from 'ol/style/Icon'
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
    <h1>Flood explorer - Investigate flooding around your school</h1>

    <h2>
      Find your school on the map or search for its name.
      Discover where flooding could happen within 1 km of your school,
      how deep the water could get, and what causes urban flooding.
    </h2>

    <a href="#why-flooding" class="scroll-prompt">
  <span class="scroll-arrow">↓</span>
  <span>SCROLL DOWN TO EXPLORE WHY FLOODING HAPPENS IN TURKU AND BECOME A FLOOD EXPLORER</span>
  <span class="scroll-arrow">↓</span>
</a>

  </div>

  <div class="map-container">
    <div id="map"></div>

<div class="data-info">
  <details class="data-info-details">
    <summary title="Data sources">i</summary>

    <div class="data-info-content">
      <strong>Data sources</strong>

      <p>
        OpenStreetMap contributors. Accessed 21.10.2026.
        <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>
      </p>

      <p>
        Tulvaveden syvyys 1/100v hule- ja merivesitulva kohtalaisten
        päästöjen skenaario (RCP4,5). Turun ammattikorkeakoulu,
        Vesien ja ympäristönsuojelun tutkimusryhmä (2026).
        Ilmastonkestävät investointihankkeet (IKI) – Alueellisiin
        ilmastoriskeihin varautuminen kaupungin kaavoituksessa ja
        suunnittelussa -hankkeen kartta-aineistot.
        <a href="https://karttapalvelu.lounaistieto.fi/" target="_blank" rel="noopener noreferrer">
          Lounaistieto
        </a>
      </p>

      <p>
        Tulvaveden syvyys 1/100v hule- ja merivesitulva korkeiden
        päästöjen skenaario (RCP8,5). Turun ammattikorkeakoulu,
        Vesien ja ympäristönsuojelun tutkimusryhmä (2026).
        Ilmastonkestävät investointihankkeet (IKI) – Alueellisiin
        ilmastoriskeihin varautuminen kaupungin kaavoituksessa ja
        suunnittelussa -hankkeen kartta-aineistot.
        <a href="https://karttapalvelu.lounaistieto.fi/" target="_blank" rel="noopener noreferrer">
          Lounaistieto
        </a>
      </p>

      <p>
        Varsinais-Suomen ja Satakunnan palvelupisteet (2025).
        OpenStreetMap &amp; Palvelutietovaranto.
        <a href="https://avoindata.suomi.fi/data/fi/dataset/varsinais-suomen-ja-satakunnan-palvelupisteet"
           target="_blank" rel="noopener noreferrer">
          Avoindata.fi
        </a>
      </p>
    </div>
  </details>
</div>


  

    <div class="map-controls">

     <div id="info">
  <h2>Explore flooding near your school</h2>
  <p>
    Choose a school to begin exploring the map.
  </p>
</div>

      <label for="school-search">Find your school</label>
      <input
        id="school-search"
        type="text"
        list="school-list"
        placeholder="Search for a school..."
      >
      <datalist id="school-list"></datalist>

    <div class="scenario-heading">
      <h3>Flood scenario</h3>

      <details class="scenario-info">
    <summary title="About flood scenarios">i</summary>

    <div class="scenario-info-content">
      <strong>How could climate change affect flooding in Turku?</strong>

      <p>
        As the climate warms, heavy rainfall may become more intense and snowfall and snowmelt cycles change. Sea-level change and more frequent and intense storms can also make coastal flooding more common.
      </p>

      <p>
        This map shows two future climate scenarios: 
        <ul>
          <li>Moderate (RCP 4.5): Greenhouse gas emissions increase before declining later this century. 
          <li>High (RCP 8.5): Greenhouse gas emissions remain very high, leading to stronger warming.
      </ul>
    </div>
  </details>
</div>


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
        1 km from school
      </label>

      <button id="reset-map">Reset map</button>
    </div>

  <div class="map-legend">
  <h3>Legend</h3>

  <div class="legend-item">
    <svg width="20" height="20" viewBox="0 0 40 40">
      <path d="M5 17 L20 5 L35 17 V34 H5 Z"
        fill="#F4C542"
        stroke="#ffffff"
        stroke-width="2.5"
        stroke-linejoin="round"/>
    </svg>
    Schools
  </div>

  <div class="legend-item">
    <svg width="20" height="20" viewBox="0 0 40 40">
      <path d="M5 17 L20 5 L35 17 V34 H5 Z"
        fill="#F28C28"
        stroke="#222222"
        stroke-width="2.5"
        stroke-linejoin="round"/>
    </svg>
    Selected school
  </div>

  <div class="legend-item">
    <span class="legend-buffer"></span>
    1 km from school
  </div>

  <div class="legend-depth">
    <div class="legend-depth-title">Flood depth (cm)</div>

    <div class="legend-depth-classes">
      <div class="legend-depth-class">
        <span style="background: #cfe7ff"></span>
        <small>10-20</small>
      </div>
      <div class="legend-depth-class">
        <span style="background: #9ccfff"></span>
        <small>20-30</small>
      </div>
      <div class="legend-depth-class">
        <span style="background: #5aa1d9"></span>
        <small>30-40</small>
      </div>
      <div class="legend-depth-class">
        <span style="background: #25539b"></span>
        <small>40-50</small>
      </div>
      <div class="legend-depth-class">
        <span style="background-color: #00105b"></span>
        <small>50+</small>
      </div>
    </div>
  </div>
</div>
  
</div> <!-- End of map-container -->
  <div class="learning-content">
  <section id="why-flooding">
  <h2>Why does flooding happen in Turku?</h2>
  <section class="learning-box">
    <h3>1. Where does rainwater go? </h3>
    <p>
      When it rains, some water soaks into the ground. But in cities, hard surfaces like roads, rooftops and asphalt prevent water from soaking in. Instead, rainwater flows along streets and into storm drains. During heavy rainfall or rapid snowmelt, water can collect faster than drainage systems can carry it away, causing stormwater flooding.
    </p>
    <h3>2. Can the sea flood a city? </h3>
    <p>
      Yes! Strong winds and changes in weather conditions can temporarily raise sea levels. When the water rises high enough, it can flood low-lying coastal areas and riverbanks. This is called coastal flooding. 
    </p>
    <h3>3. What happens when heavy rain meets a high sea level? </h3>
    <p>
      In a coastal city like Turku, stormwater and coastal flooding can happen together. When the sea level is unusually high, rainwater may have difficulty draining into the sea. This can make flooding worse in low-lying areas.  
    </p>
    <h3>4. How can climate change affect flooding? </h3>
    <p>
      As the climate warms, heavy rainfall can become more intense. Sea levels are also rising as ocean water warms and land ice melts. Scientists use different climate scenarios to explore possible futures. Both can increase flooding in cities like Turku. 
    </p>
    <h3>5. What does this map show?</h3>
    <p>
    This map shows where flooding could happen in Turku in the year 2100 and how deep the water might be. You can compare two possible climate futures: one with moderate greenhouse gas emissions and moderate warming and one with stronger warming. 

    The map shows a rare flood scenario, based on a flood with a 1 in 100 chance of happening in any year. The colours show the modelled water depth, not real-time flooding. 
    </p>  
  </section>
  </section>


<h2>Become a Flood Explorer!</h2>

<section class="learning-box">

  <div class="mission-progress">
    <p id="mission-count">0/5 missions completed</p>
    <div class="progress-bar">
      <div id="progress-fill"></div>
    </div>
  </div>

  <div class="mission">
    <h3>
      <label>
        <input type="checkbox" class="mission-checkbox">
        Mission 1: Explore your school's surroundings
      </label>
    </h3>
    <p>
      Find your school on the map. Where are the nearest areas that could flood? Are they near streets, buildings or parks?
    </p>
  </div>

  <div class="mission">
    <h3>
      <label>
        <input type="checkbox" class="mission-checkbox">
        Mission 2: Where could the water be deepest?
      </label>
    </h3>
    <p>
      Look at the different floodwater depth colours. Find an area with deeper modelled flooding near your school.
      Why might water collect here? Does the area appear low-lying, or is it surrounded by hard surfaces?
    </p>
  </div>

  <div class="mission">
    <h3>
      <label>
        <input type="checkbox" class="mission-checkbox">
        Mission 3: City or nature?
      </label>
    </h3>
    <p>
      Compare a built-up area with a green area near your school. Where can rainwater soak into the ground more easily? How might trees, grass and other vegetation help reduce stormwater flooding?
    </p>
  </div>

  <div class="mission">
    <h3>
      <label>
        <input type="checkbox" class="mission-checkbox">
        Mission 4: Two possible futures
      </label>
    </h3>
    <p>
      Switch between the moderate and high scenarios.
      Investigate: Where does the modelled flooding change? Can you find an area where the flood depth increases? Are there also places where it stays similar?
    </p>
  </div>

  <div class="mission">
    <h3>
      <label>
        <input type="checkbox" class="mission-checkbox">
        Mission 5: Become a city planner!
      </label>
    </h3>
    <p>
      Imagine you're planning improvements to the area around your school. Where would you add more green spaces, such as parks and greenery, or other solutions to help manage rainwater? Why?
      Would the same solutions work for coastal flooding? What else might be needed?
    </p>
  </div>

  <p id="mission-complete-message"></p>

</section>
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

// School icons

// Normal school - yellow
const schoolIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <path d="M5 17 L20 5 L35 17 V34 H5 Z"
      fill="#F4C542"
      stroke="#ffffff"
      stroke-width="2.5"
      stroke-linejoin="round"/>
  </svg>
`

// Selected school - orange
const selectedSchoolIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <path d="M5 17 L20 5 L35 17 V34 H5 Z"
      fill="#F28C28"
      stroke="#222222"
      stroke-width="2.5"
      stroke-linejoin="round"/>
  </svg>
`

// Normal school style
const schoolStyle = new Style({
  image: new Icon({
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(schoolIconSvg)}`,
    anchor: [0.5, 0.5],
    scale: 0.85,
  }),
})

// Selected school style
const selectedSchoolStyle = new Style({
  image: new Icon({
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(selectedSchoolIconSvg)}`,
    anchor: [0.5, 0.5],
    scale: 0.9,
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
      color: 'rgba(255, 193, 7, 0)',
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
      <p>Could not find a matching 1 km from school.</p>
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


const missionCheckboxes = document.querySelectorAll(".mission-checkbox");
const missionCount = document.getElementById("mission-count");
const progressFill = document.getElementById("progress-fill");
const completeMessage = document.getElementById("mission-complete-message");

missionCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const completed = document.querySelectorAll(
      ".mission-checkbox:checked"
    ).length;

    const total = missionCheckboxes.length;
    const percentage = (completed / total) * 100;

    missionCount.textContent = `${completed}/${total} missions completed`;
    progressFill.style.width = `${percentage}%`;

    if (completed === total) {
      completeMessage.textContent = "Congratulations! You completed all missions!";
    } else {
      completeMessage.textContent = "";
    }
  });
});