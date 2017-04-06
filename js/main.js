// Various variable declaration
var d, m, y, date, type = '', distance, state,
    twokm, threekm, fourkm,
    region = '', prefecture = '', prefecture_select = '', sub_prefecture = '', 
    geoData = null, dataLayer = null, markerGroup = null, 
    nigeriaAdminLayer0, nigeriaAdminLayer1, nigeriaAdminLayer2,
    country_layer = null, state_layer = null, lga_layer = null, ward_layer = null, bufferLayer = null, substance_layer = null,
    NGRLabels = [],
    within, within_fc, buffered = null,
    NGRAdmin2 = false,
    googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']}),
    googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']}),
    osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18}),
    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicy1jaGFuZCIsImEiOiJjaXdmcmtnc2QwMDBhMnltczBldmc1MHZuIn0.eIdXZvG0VOOcZhhoHpUQYA')

//Initiating and declaring leaflet map object
var map = L.map('map', {
    center: [10, 8],
    zoom: 6,
    animation: true,
    zoomControl: false,
    layers: [osm]
//    minZoom: 6

});
map.options.minZoom = 5;

var baseMaps = {
    "Google Satelite": googleSat,
    "OSM": osm,
    "Google Street": googleStreets,
    "Map Box": mapbox
};

map.on('zoomend', function () {
    adjustLayerbyZoom(map.getZoom())

})


new L.Control.Zoom({
    position: 'topright'
}).addTo(map);

L.control.layers(baseMaps).addTo(map);

L.control.scale({
    position: 'bottomright',
    maxWidth: 100,
    metric: true,
    updateWhenIdle: true
}).addTo(map);

//Helps add label to the polygons for admin boundary at zoom level greater than 9
function adjustLayerbyZoom(zoomNigeria) {

    if (zoomNigeria > 10) {
        if (!NGRAdmin2) {
            map.addLayer(nigeriaAdminLayer2)
                //Add labels to the Admin2
            for (var i = 0; i < NGRLabels.length; i++) {
                NGRLabels[i].addTo(map)

            }
            NGRAdmin2 = true
        }
    } else {
        map.removeLayer(nigeriaAdminLayer2)
        for (var i = 0; i < NGRLabels.length; i++) {
            map.removeLayer(NGRLabels[i])

        }

        NGRAdmin2 = false
    }

}

//This drives all the operation that will be rendering on the map
function triggerUiUpdate() {
    statecode = $('#state_scope').val()
    if (statecode.length > 0 && statecode == 'Lagos'){
        state = 'LA';
    }
    if (statecode.length > 0 && statecode == 'Ogun'){
        state = 'OG';
    }
    lga = $('#lga_scope').val()
    bank = $('#bank_scope').val()
    console.log("All Seleceted: ", state+"  "+lga+"  "+bank)
    var query = buildQuery(state, lga, bank)
    getData(query)
    console.log("QUERY:  ", query)
    prefecture_select = $('#state_scope').val()
}


//Read data from carto and filter via selection from the interface
function buildQuery(state, lga, bank) {
  var needsAnd = false;
    query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM datapro_visualization';
//    console.log("Date in Query: ",date)
   if (state.length > 0 || lga.length > 0 || bank.length > 0 ){
       query = query.concat(' WHERE')
       if (state.length > 0){
      query = query.concat(" state = '".concat(state.concat("'")))
      needsAnd = true
    }


    if(lga.length > 0) {
      query = needsAnd  ? query.concat(" AND lga = '".concat(lga.concat("'"))) :  query.concat(" lga = '".concat(lga.concat("'")))
      needsAnd = true
    }

    if (bank.length > 0){
      query = needsAnd  ? query.concat(" AND bank = '".concat(bank.concat("'"))) :  query.concat(" bank = '".concat(bank.concat("'")))
      needsAnd = true
    }

}
     else query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM datapro_visualization';
  return query

}


//Helps add data to the marker cluster and cluster to the map with icons
function addDataToMap(geoData) {
    // adjustLayerbyZoom(map.getZoom())
    //remove all layers first

    if (dataLayer != null)
        map.removeLayer(dataLayer)

    if (markerGroup != null)
        map.removeLayer(markerGroup)

    var _radius = 8
    var _outColor = "#fff"
    var _weight = 2
    var _opacity = 2
    var _fillOpacity = 2.0

    var customer = L.icon({
        iconUrl: "image/user1.jpg",
        iconSize: [20, 20],
        iconAnchor: [25, 25]
    });



    $('#projectCount').text(geoData.features.length)

    markerGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true
        })
        dataLayer = L.geoJson(geoData, {
        pointToLayer: function (feature, latlng) {
            var marker = L.marker(latlng, {icon: customer})
            return marker
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.cartodb_id) {
                layer.on('click', function () {
                    displayInfo(feature)
                })
            }

        }

    })

    markerGroup.addLayer(dataLayer);
//    map.fitBounds(dataLayer);
    map.addLayer(markerGroup);
}


//Add administrative boundaries to the map and symbolizes them
function addAdminLayersToMap(layers) {
    var layerStyles = {
            'admin0': {
                "clickable": true,
                "color": '#B81609',
                "fillColor": '#ffffff',
                "weight": 2.0,
                "opacity": 1,
                "fillOpacity": 0.05
            },
            'admin2': {
                "clickable": true,
                "color": '#412406',
                "fillColor": '#80FFFFFF',
                "weight": 1.5,
                "opacity": 0.5,
                "fillOpacity": 0.05
            },
            'region': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#80FFFFFF',
                "weight": 2.0,
                "opacity": 0.7,
                "fillOpacity": 0.05
            },
            'prefecture': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#80FFFFFF',
                "weight": 2.5,
                "opacity": 0.7,
                "fillOpacity": 0.05
            }
      }

    stateSelect = $('#state_scope').val()
    lgaSelect = $('#lga_scope').val()
    console.log("State_LGA: ", stateSelect+"  "+lgaSelect)
    nigeriaAdminLayer0 = L.geoJson(layers['nigeriaAdmin0'], {
        style: layerStyles['admin0']
    }).addTo(map)

    nigeriaAdminLayer2 = L.geoJson(layers['nigeriaAdmin2'], {
        style: layerStyles['region'],
        onEachFeature: function (feature, layer) {
            var labelIcon = L.divIcon({
                className: 'labelLga-icon',
                html: feature.properties.LGAName
            })
            NGRLabels.push(L.marker(layer.getBounds().getCenter(), {
                    icon: labelIcon
                }))

        }
    })

    //Zoom In to state level on selection
    if(state_layer != null)
             map.removeLayer(state_layer)

      state_layer = L.geoJson(layers['nigeriaAdmin1'], {
        filter: function(feature) {
          return feature.properties.StateName === stateSelect
      },
      style: layerStyles['region'],
      }).addTo(map)
    map.fitBounds(state_layer)

    //Zoom In to LGA Level on selection

    if(lga_layer != null)
      map.removeLayer(lga_layer)

      lga_layer = L.geoJson(layers['nigeriaAdmin2'], {
        filter: function(feature) {
          return feature.properties.LGAName === lgaSelect
      },
      style: layerStyles['region'],
      }).addTo(map)
    map.fitBounds(lga_layer)
    console.log("Zoom Level ",map.getZoom());
}

//Help attached counts of verious multiselection via query to the interface
function displayInfo(feature) {
    var infoContent = buildPopupContent(feature)
    $('#infoContent').html(infoContent)
}


//Normalizaes the data pull from carto by removing unwanted spaces and charater
function normalizeName(source) {
    source = source.replace("_", " ").replace('of_', ' of ')
    source = source.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    return source
}

//Help with popup information
function buildPopupContent(feature) {
    var subcontent = ''
    var propertyNames = ['bank', 'customer_name', 'risk_score', 'lga', 'ref_no', 'address', 'nearest_bustop', 'type_of_structure', 'landmark', 'name_of_landmark', 'customer_status', 'client', 'contact_name', 'convinction', 'visiting_officer_name', 'verification_status']
    for (var i = 0; i < propertyNames.length; i++) {
        subcontent = subcontent.concat('<p><strong>' + normalizeName(propertyNames[i]) + ': </strong>' + feature.properties[propertyNames[i]] + '</p>')

    }
    return subcontent;
}

function showLoader() {
    $('.fa-spinner').addClass('fa-spin')
    $('.fa-spinner').show()
}

function hideLoader() {
    $('.fa-spinner').removeClass('fa-spin')
    $('.fa-spinner').hide()
}


function getData(queryUrl) {
    showLoader()
    $.post(queryUrl, function (data) {
        hideLoader()
        addDataToMap(data)
        console.log('Data-Geo::  ', data);
    }).fail(function () {
        console.log("error!")
    });
}

function getAdminLayers() {
//    showLoader()
    var adminLayers = {}

    //Add Admin Layers to Map
     $.get('resources/NGR_Admin0.json', function (nigeria_admin0) {
        adminLayers['nigeriaAdmin0'] = nigeria_admin0
        $.get('resources/NGR_Admin1.json', function (nigeria_admin1) {
            adminLayers['nigeriaAdmin1']= nigeria_admin1
                $.get('resources/NGR_Admin2.json', function (nigeria_admin2) {
                    adminLayers['nigeriaAdmin2'] = nigeria_admin2
                    addAdminLayersToMap(adminLayers)
		              }).fail(function () {
                    logError(null)
                })
        }).fail(function () {
            logError(null)
            })
     }).fail(function () {
            logError(null)
        })

}

function logError(error) {
    console.log("error!")
}
getAdminLayers()
hideLoader()
/*triggerUiUpdate()*/
