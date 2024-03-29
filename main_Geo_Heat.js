var getScriptPromisify = (src) => {
    return new Promise((resolve) => {
        $.getScript(src, resolve);
    });
};
(function () {
    let template = document.createElement("template");
    var gLayerURL;
    var gdegrees;
    var gcenter;
    var gzoom;
    var locationData; // holds up each beacons data
    var geojsonlayer;
    var url;
    var blob;
    var map;
    var templates;
    var renderer;
    var iniValue = 0;
    var pointArrFeatureCollection;
    var gPortalID;
    var gBeaconColor;
    var gBOColor;
    var gBstartSize;
    var gBStopSize;
    var glayerOption = "off";
    var mapValue = 0;


    template.innerHTML = `
      <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
      <title>Compass widget | Sample | ArcGIS Maps SDK for JavaScript 4.27</title>
  
      <style>
        html,
        body,
        #viewDiv {
          padding: 0;
          margin: 0;
          height: 100%;
          width: 100%;
        }
      </style>
  
      <link rel="stylesheet" href="https://js.arcgis.com/4.27/esri/themes/light/main.css" />
      <script src="https://js.arcgis.com/4.27/"></script>
  
  
    </head>
    <body>
      <div id="viewDiv"></div>
    </body>
  
      `;

    // Convert string coordinate from geojson file to array of cooor
    function removeString(stringCoor) {
        var LatLng = stringCoor.replace('[', '').replace(']', '').split(',')
        var Lat = parseFloat(LatLng[0]);
        var Lng = parseFloat(LatLng[1]);
        return [Lng, Lat]
    }

    // function to convert array to geojson format
    function j2gConvert(jsonObject) {
        const geoJSONPointArr = jsonObject.map((row) => {
            return {
                type: 'Feature',
                geometry: {
                    type: row.Geometry_Type,
                    coordinates: removeString(row.Geometry_coordinates)
                },
                properties: {
                    beaconId: row.beaconID,
                    aisle_name: row.beaconName,
                    units_sold: row.Units_Sold
                },
                id: parseFloat(row.beaconID),
            };
        });

        return geoJSONPointArr;
    }

    function mainMap() {
        require(["esri/Map", "esri/views/MapView", "esri/widgets/Compass", "esri/layers/FeatureLayer"],
            (Map, MapView, Compass, FeatureLayer) => {

                mapValue = 1;

                map = new Map({
                    basemap: "streets-vector"
                });

                gLayerURL.forEach(i => {
                    const featureLayer = new FeatureLayer({
                        url: i
                    });
                    map.add(featureLayer);
                });

                const view = new MapView({
                    container: "viewDiv",
                    scale: 500000,
                    map: map,
                    zoom: gzoom,
                    center: gcenter,
                });

                /********************************
                 * Create a compass widget object.
                 *********************************/

                const compassWidget = new Compass({
                    view: view
                });

                // Add the Compass widget to the top left corner of the view
                view.ui.add(compassWidget, "top-left");
                view.rotation = gdegrees;

                // template to display additional details for the beacon when selected
                templates = {
                    title: 'Beacon Detail',
                    content: 'Beacon ID:{beaconId} \n Aisle assigned to:{aisle_name}',
                };

                // information on how to display the beacons(point format)
                renderer = {
                    type: "heatmap",
                    //field: "units_sold",
                    colorStops: [
                        { color: "rgba(63, 40, 102, 0)", ratio: 0 },
                        { color: "#472b77", ratio: 0.083 },
                        { color: "#4e2d87", ratio: 0.166 },
                        { color: "#563098", ratio: 0.249 },
                        { color: "#5d32a8", ratio: 0.332 },
                        { color: "#6735be", ratio: 0.415 },
                        { color: "#7139d4", ratio: 0.498 },
                        { color: "#7b3ce9", ratio: 0.581 },
                        { color: "#853fff", ratio: 0.664 },
                        { color: "#a46fbf", ratio: 0.747 },
                        { color: "#c29f80", ratio: 0.83 },
                        { color: "#e0cf40", ratio: 0.913 },
                        { color: "#ffff00", ratio: 1 }
                    ],
                    maxDensity: 1,
                    minDensity: 0
                    // radius: 10;
                };
            });
    }

    // function inside class to create geojson beacons
    function processbeacons() {
        require(
            [
                'esri/layers/GeoJSONLayer',
            ],
            (GeoJSONLayer) => {
                console.log(locationData)
                pointArrFeatureCollection = {};
                pointArrFeatureCollection = {
                    type: 'FeatureCollection',
                    features: j2gConvert(locationData),
                    bbox: [
                        -179.9997, -61.6995, -3.5699999332428, 179.9142, 82.9995, 629.17
                    ],
                };

                // create a new blob from geojson featurecollection
                blob = new Blob([JSON.stringify(pointArrFeatureCollection)], {
                    type: 'application/json',
                });

                // URL reference to the blob
                url = URL.createObjectURL(blob);

                // create a layer to hold the beacon coordinates
                geojsonlayer = new GeoJSONLayer({
                    url,
                    popupTemplate: templates,
                    renderer: renderer
                });

                if (glayerOption == "on") {
                    // add the beacons to the webscene
                    map.add(geojsonlayer);
                    iniValue = 1;
                }

            });
    } // end of function bracket

    class CustomMap extends HTMLElement {
        constructor() {
            super();

            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(prepared.content.cloneNode(true));

            this._root = this._shadowRoot.getElementById("root");

            this._props = {};

            this.render();


        } //end of constructor

        onCustomWidgetResize(width, height) {
            this.onScriptLoaded();
          }
      
          set myDataSource(dataBinding) {
            this._myDataSource = dataBinding;
            this.onScriptLoaded();
          }







    } //end of class

    let scriptSrc = "https://js.arcgis.com/4.18/"
    let onScriptLoaded = function () {
        customElements.define("com-sap-custom-geomap", CustomMap);
    }

    //SHARED FUNCTION: reuse between widgets
    //function(src, callback) {
    let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
    let scriptStatus = customElementScripts.find(function (element) {
        return element.src == scriptSrc;
    });

    if (scriptStatus) {
        if (scriptStatus.status == "ready") {
            onScriptLoaded();
        } else {
            scriptStatus.callbacks.push(onScriptLoaded);
        }
    } else {
        let scriptObject = {
            "src": scriptSrc,
            "status": "loading",
            "callbacks": [onScriptLoaded]
        }
        customElementScripts.push(scriptObject);
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptSrc;
        script.onload = function () {
            scriptObject.status = "ready";
            scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
        };
        document.head.appendChild(script);
    }

    //END SHARED FUNCTION
})();
