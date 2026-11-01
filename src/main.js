
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
import 'ol/ol.css'

document.querySelector('#app').innerHTML = `
  <div id="map"></div>
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

  style: new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'red',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
})

let bufferData = []

fetch(
  '/geoserver/floodmap/ows?' +
    'service=WFS&version=1.0.0&request=GetFeature&' +
    'typeName=floodmap:schools_5km_buffer&' +
    'outputFormat=application/json&' +
    'srsName=EPSG:3857'
)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Bufferien lataaminen epäonnistui')
    }

    return response.json()
  })
  .then((data) => {
    bufferData = data.features

    console.log('Buffereita fetchillä:', bufferData.length)

    console.log(
      'Ensimmäinen bufferi:',
      bufferData[0]?.properties
    )
  })
  .catch((error) => {
    console.log('FETCH VIRHE:', error)
  })

const selectedBufferSource = new VectorSource()

const selectedBufferLayer = new VectorLayer({
  source: selectedBufferSource,

  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.3)',
    }),

    stroke: new Stroke({
      color: '#ff0000',
      width: 5,
    }),
  }),
})

const selectedSchoolSource = new VectorSource()

const selectedSchoolLayer = new VectorLayer({
  source: selectedSchoolSource,

  style: new Style({
    image: new CircleStyle({
      radius: 12,

      fill: new Fill({
        color: 'yellow',
      }),

      stroke: new Stroke({
        color: 'black',
        width: 3,
      }),
    }),
  }),
})

schoolsLayer.getSource().on('featuresloadend', () => {
  console.log(
    'Kouluja ladattu:',
    schoolsLayer.getSource().getFeatures().length
  )
})

schoolsLayer.getSource().on('featuresloaderror', () => {
  console.log('KOULUJEN LATAUS VIRHE')
})

const map = new Map({
  target: 'map',

  layers: [
    new TileLayer({
      source: new OSM(),
    }),

    new TileLayer({
      source: new TileWMS({
        url: wmsUrl,
        params: {
          LAYERS: 'floodmap:aluerajaus',
        },
      }),
    }),

    new TileLayer({
      source: new TileWMS({
        url: wmsUrl,
        params: {
          LAYERS: 'floodmap:tulvariski_yhdistetty',
        },
      }),
    }),

    new TileLayer({
      source: new TileWMS({
        url: wmsUrl,
        params: {
          LAYERS: 'floodmap:Flood_risk_cycling_routes_5km_from_schools',
        },
      }),
    }),

    schoolsLayer,
    selectedSchoolLayer,
    selectedBufferLayer,
  ],

  view: new View({
    center: [2485162, 8502291],
    zoom: 13,
  }),
})

map.on('click', (event) => {
  const feature = map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => feature,
    {
      layerFilter: (layer) => layer === schoolsLayer,
    }
  )

  if (!feature) return

  if (bufferData.length === 0) {
    console.log('Bufferit eivät ole vielä latautuneet')
    return
  }

  selectedSchoolSource.clear()

  selectedSchoolSource.addFeature(feature.clone())

  const schoolFid = feature.get('fid')

  console.log('Koulun FID:', schoolFid)

  const schoolName = fixEncoding(feature.get('kohteen_ni'))

  const services = fixEncoding(feature.get('palvelut'))

  const address = fixEncoding(feature.get('osoite'))

  const matchingBuffer = bufferData.find(
    (buffer) =>
      fixEncoding(buffer.properties.kohteen_ni) === schoolName
  )

  console.log('Löydetty bufferi:', matchingBuffer)

  selectedBufferSource.clear()

  if (matchingBuffer) {
    const bufferFeature = new GeoJSON().readFeature(
      matchingBuffer,
      {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857',
      }
    )

    selectedBufferSource.addFeature(bufferFeature)

    map.getView().fit(
      bufferFeature.getGeometry().getExtent(),
      {
        padding: [50, 50, 50, 50],
        duration: 1000,
      }
    )

    console.log(
      'Geometry type:',
      bufferFeature.getGeometry().getType()
    )

    console.log(
      'Bufferin extent:',
      bufferFeature.getGeometry().getExtent()
    )

    console.log(
      'Buffereita kartalla:',
      selectedBufferSource.getFeatures().length
    )

    console.log('Bufferi lisätty kartalle')
  } else {
    console.log('Koululle ei löytynyt bufferia')
  }

  document.getElementById('info').innerHTML = `
    <h3>${schoolName}</h3>

    <p>
      <strong>Osoite:</strong><br>
      ${address || 'Ei tietoa'}
    </p>

    <p>
      <strong>Palvelut:</strong><br>
      ${services || 'Ei tietoa'}
    </p>
  `
})

