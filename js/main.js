// Various variable declaration
var d, m, y, date, type = '', distance,
    twokm, threekm, fourkm,
    region = '', prefecture = '', prefecture_select = '', sub_prefecture = '', 
    geoData = null, dataLayer = null, markerGroup = null, 
    guineaAdminLayer0, guineaAdminLayer1, guineaAdminLayer2,
    region_layer = null, prefecture_layer = null, sub_prefecture_layer = null, bufferLayer = null, substance_layer = null,
    GINLabels = [],
    within, within_fc, buffered = null,
    GINAdmin2 = false,
    googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']}),
    googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']}),
    osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18}),
    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicy1jaGFuZCIsImEiOiJjaXdmcmtnc2QwMDBhMnltczBldmc1MHZuIn0.eIdXZvG0VOOcZhhoHpUQYA')

//Initiating and declaring leaflet map object
var map = L.map('map', {
    center: [9.6, -12.6],
    zoom: 7,
    animation: true,
    zoomControl: false,
    layers: [osm]
    //minZoom: 6

});
map.options.minZoom = 7;

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
function adjustLayerbyZoom(zoomGIN) {

    if (zoomGIN > 11) {
        if (!GINAdmin2) {
            map.addLayer(guineaAdminLayer2)
                //Add labels to the Admin2
            for (var i = 0; i < GINLabels.length; i++) {
                GINLabels[i].addTo(map)

            }
            GINAdmin2 = true
        }
    } else {
        map.removeLayer(guineaAdminLayer2)
        for (var i = 0; i < GINLabels.length; i++) {
            map.removeLayer(GINLabels[i])

        }

        GINAdmin2 = false
    }

}

//This drives all the operation that will be rendering on the map
function triggerUiUpdate() {
    societe = $('#societe_scope').val()
    region = $('#state_scope').val()
    prefecture = $('#lga_scope').val()
    substance = $('#substance_type').val()
    console.log("All Seleceted: ", societe+"  "+region+"  "+prefecture+"  "+substance+"  "+date)
    var query = buildQuery(region, prefecture, sub_prefecture, date)
    getData(query)
    prefecture_select = $('#state_scope').val()
}


//Read data from carto and filter via selection from the interface
function buildQuery(type, region, prefecture, sub_prefecture) {
  var needsAnd = false;
    query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM mine_guinea';
    console.log("Date in Query: ",date)
   if (region.length > 0 || prefecture.length > 0 || societe.length > 0 || substance.length > 0 ){
       query = query.concat(' WHERE')
       if (region.length > 0){
      query = query.concat(" region = '".concat(region.concat("'")))
      needsAnd = true
    }


    if(prefecture.length > 0) {
      query = needsAnd  ? query.concat(" AND prefecture = '".concat(prefecture.concat("'"))) :  query.concat(" prefecture = '".concat(prefecture.concat("'")))
      needsAnd = true
    }

    if (societe.length > 0){
      query = needsAnd  ? query.concat(" AND societe = '".concat(societe.concat("'"))) :  query.concat(" societe = '".concat(societe.concat("'")))
      needsAnd = true
    }

    if(substance.length > 0) {
      query = needsAnd  ? query.concat(" AND substance = '".concat(substance.concat("'"))) :  query.concat(" substance = '".concat(substance.concat("'")))
      needsAnd = true
    }

//       if(date.length > 0) {
//      query = needsAnd  ? query.concat(" OR date = '".concat(date.concat("'"))) :  query.concat(" date = '".concat(date.concat("'")))
//      needsAnd = true
//    }

   }
     else query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM mine_guinea';
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

    var dolerite = L.icon({
        iconUrl: "image/dolerite.jpg",
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
            var marker = L.marker(latlng, {icon: dolerite})
                //markerGroup.addLayer(marker);
            return marker
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.cartodb_id) {
                //layer.bindPopup(buildPopupContent(feature));
                layer.on('click', function () {
                    displayInfo(feature)
                })
            }

        }

    })

    markerGroup.addLayer(dataLayer);
    map.fitBounds(dataLayer);
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
            },
            'sub_prefecture': {
                "clickable": true,
                "color": '#ff0000',
                "fillColor": '#80FFFFFF',
                "weight": 2.5,
                "opacity": 0.7,
                "fillOpacity": 0.05
            }
      }

    regionSelect = $('#state_scope').val()
    prefectureSelect = $('#lga_scope').val()
    guineaAdminLayer0 = L.geoJson(layers['guineaAdmin0'], {
        style: layerStyles['admin0']
    }).addTo(map)

    guineaAdminLayer2 = L.geoJson(layers['guineaAdmin2'], {
        style: layerStyles['region'],
        onEachFeature: function (feature, layer) {
            var labelIcon = L.divIcon({
                className: 'labelLga-icon',
                html: feature.properties.NAME_2
            })
            GINLabels.push(L.marker(layer.getBounds().getCenter(), {
                    icon: labelIcon
                }))

        }
    })

    //Zoom In to region level on selection
    if(region_layer != null)
      map.removeLayer(region_layer)

      region_layer = L.geoJson(layers['guineaAdmin1'], {
        filter: function(feature) {
          return feature.properties.NAME_1 === regionSelect
      },
      style: layerStyles['region'],
      }).addTo(map)
    map.fitBounds(region_layer)

    //Zoom In to Prefecture Level on selection

    if(prefecture_layer != null)
      map.removeLayer(prefecture_layer)

      prefecture_layer = L.geoJson(layers['guineaAdmin2'], {
        filter: function(feature) {
          return feature.properties.NAME_2 === prefectureSelect
      },
      style: layerStyles['region'],
      }).addTo(map)
    map.fitBounds(prefecture_layer)
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
    var propertyNames = ['date', 'region', 'prefecture', 'sous_prefecture', 'prenoms_et_nom', 'fonction', 'societe', 'prenom_directeur', 'prenom_nom_directeur', 'sexe_directeur', 'adresse_email', 'numero_telephone']
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
     $.get('resources/GIN_Admin0.json', function (guinea_admin0) {
        adminLayers['guineaAdmin0'] = guinea_admin0
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })

     $.get('resources/GIN_Admin1.json', function (guinea_admin1) {
        adminLayers['guineaAdmin1']= guinea_admin1
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })


     $.get('resources/GIN_Admin2.json', function (guinea_admin2) {
        adminLayers['guineaAdmin2'] = guinea_admin2
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })


}

function logError(error) {
    console.log("error!")
}


//
//function showPrefecture() {
//    prefecture_show = document.getElementById("prefecture_id");
//    prefecture_show1 = document.getElementById("prefecture_id1");
//    console.log("Show: ", prefecture_show);
//    console.log("Show1: ", prefecture_show1);
//    if(prefecture_select != "") {
//         prefecture_show.style.visibility = "true"
//         prefecture_show1.style.visibility = "true"
//    }
//
//    else{
//        prefecture_show.style.visibility = "hidden"
//        prefecture_show1.style.visibility = "hidden"
//    }
//
//}



getAdminLayers()
hideLoader()
/*triggerUiUpdate()*/

//Populating LGAs by State
var lgasbystate = {
    Abuja: [" ","Gwagwalada", "Kuje", "Abaji", "Abuja Municipal", "Bwari", "Kwali"],
    Abia: [" ","Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala-Ngwa North", "Isiala-Ngwa South", "Isuikwato", "Obi Nwa", "Ohafia", "Osisioma", "Ngwa", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu-Neochi"],
    Adamawa: [" ","Demsa", "Fufore", "Ganaye", "Gireri", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo-Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
    AkwaIbom: [" ","Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat Enin", "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
    Anambra: [" ","Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili south", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
    Bauchi: [" ","Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa-Balewa", "Toro", "Warji", "Zaki"],
    Bayelsa: [" ","Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Jaw", "Yenegoa"],
    Benue: [" ","Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Oju", "Okpokwu", "Ohimini", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
    Borno: [" ","Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "KwayaKusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
    CrossRiver: [" ","Akpabuyo", "Odukpani", "Akamkpa", "Biase", "Abi", "Ikom", "Yarkur", "Odubra", "Boki", "Ogoja", "Yala", "Obanliku", "Obudu", "Calabar South", "Etung", "Bekwara", "Bakassi", "Calabar Municipality"],
    Delta: [" ","Oshimili ", "Aniocha", "Aniocha South", "Ika South", "Ika North-East", "Ndokwa West", "Ndokwa East", "Isoko south", "Isoko North", "Bomadi", "Burutu", "Ughelli South", "Ughelli North", "Ethiope West", "Ethiope East", "Sapele", "Okpe", "Warri North", "Warri South", "Uvwie", "Udu", "Warri Central", "Ukwani", "Oshimili North", "Patani"],
    Ebonyi: [" ","Afikpo South", "Afikpo North", "Onicha", "Ohaozara", "Abakaliki", "Ishielu", "lkwo", "Ezza", "Ezza South", "Ohaukwu", "Ebonyi", "Ivo"],
    Edo: [" ", "Esan North-East", "Esan Central", "Esan West", "Egor", "Ukpoba", "Central", "Etsako Central", "Igueben", "Oredo", "Ovia SouthWest", "Ovia South-East", "Orhionwon", "Uhunmwonde", "Etsako East", "Esan South-East"],
    Ekiti: [" ", "Ado", "Ekiti-East", "Ekiti-West", "Emure/Ise/Orun", "Ekiti South-West", "Ikare", "Irepodun", "Ijero", "Ido/Osi", "Oye", "Ikole", "Moba", "Gbonyin", "Efon", "Ise/Orun", "Ilejemeje"],
    Enugu: [" ", "Enugu South", "Igbo-Eze South", "Enugu North", "Nkanu", "Udi Agwu", "Oji-River", "Ezeagu", "IgboEze North", "Isi-Uzo", "Nsukka", "Igbo-Ekiti", "Uzo-Uwani", "Enugu East", "Aninri", "Nkanu East", "Udenu"],
    Gombe: [" ", "Akko", "Balanga", "Billiri", "Dukku", "Kaltungo", "Kwami", "Shomgom", "Funakaye", "Gombe", "Nafada/Bajoga", "Yamaltu/Delta"],
    Imo: [" ", "Aboh-Mbaise", "Ahiazu-Mbaise", "Ehime-Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor-Okpala", "Njaba", "Nwangele", "Nkwerre", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri-Municipal", "Owerri North", "Owerri West"],
    Jigawa: [" ", "Auyo", "Babura", "Birni Kudu", "Biriniwa", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama Kazaure", "Kiri Kasamma", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule-Tankarkar", "Taura", "Yankwashi"],
    Kaduna: [" ", "Birni-Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon-Gari", "Sanga", "Soba", "Zango-Kataf", "Zaria"],
    Kano: [],
    Katsina: [],
    Kebbi: [],
    Kogi: [],
    Kwara: [],
    Lagos: [],
    Nassarawa: [],
    Niger: [],
    Ogun: [],
    Ondo: [],
    Osun: [],
    Oyo: [],
    Plateau: [],
    Rivers: [],
    Sokoto: [],
    Taraba: [],
    Yobe: [],
    Zamfara: []
}

function changecat(value) {
        if (value.length == 0) document.getElementById("lga_scope").innerHTML = "<option></option>";
        else {
            var catOptions = "";
            for (categoryId in lgasbystate[value]) {
                catOptions += "<option>" + lgasbystate[value][categoryId] + "</option>";
            }
            document.getElementById("lga_scope").innerHTML = catOptions;
        }
}
