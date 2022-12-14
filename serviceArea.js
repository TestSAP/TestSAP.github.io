(function () {
    let template = document.createElement("template");
    var APIKEY;
    
    template.innerHTML = `
    <style>
        html, body, #viewDiv {
        padding: 0;
        margin: 0;
        height: 100%;
        width: 100%;
        }
    </style>
    <link rel="stylesheet" href="https://js.arcgis.com/4.25/esri/themes/light/main.css">
    <script src="https://js.arcgis.com/4.25/"></script>

    <body>
        <div id="viewDiv"></div>
    </body>
    `;

    function mainMap()
    {
      require([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/rest/serviceArea",
        "esri/rest/support/ServiceAreaParameters",
        "esri/rest/support/FeatureSet",
        "esri/Graphic"
      ], function(esriConfig, Map, MapView, serviceArea, ServiceAreaParams, FeatureSet, Graphic) {
  
        esriConfig.apiKey = APIKEY;
  
        const map = new Map({
          basemap: "arcgis-navigation"
        });
  
        const view = new MapView({
          container: "viewDiv",
          map: map,
          center: [135.5023,34.6937], //Longitude, latitude
          zoom: 11
        });
  
        const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";
  
        view.on("click", function(event){
  
          const locationGraphic = createGraphic(event.mapPoint);
  
          const driveTimeCutoffs = [5,10,15]; // Minutes
          const serviceAreaParams = createServiceAreaParams(locationGraphic, driveTimeCutoffs, view.spatialReference);
  
          solveServiceArea(serviceAreaUrl, serviceAreaParams);
  
        });
  
        // Create the location graphic
        function createGraphic(point) {
          view.graphics.removeAll();
          const graphic = new Graphic({
            geometry: point,
            symbol: {
              type: "simple-marker",
              color: "white",
              size: 8
            }
          });
  
          view.graphics.add(graphic);
          return graphic;
        }
  
        function createServiceAreaParams(locationGraphic, driveTimeCutoffs, outSpatialReference) {
  
          // Create one or more locations (facilities) to solve for
          const featureSet = new FeatureSet({
            features: [locationGraphic]
          });
  
          // Set all of the input parameters for the service
          const taskParameters = new ServiceAreaParams({
            facilities: featureSet,
            defaultBreaks: driveTimeCutoffs,
            trimOuterPolygon: true,
            outSpatialReference: outSpatialReference
          });
          return taskParameters;
  
        }
  
        function solveServiceArea(url, serviceAreaParams) {
  
          return serviceArea.solve(url, serviceAreaParams)
            .then(function(result){
              if (result.serviceAreaPolygons.length) {
                // Draw each service area polygon
                result.serviceAreaPolygons.forEach(function(graphic){
                  graphic.symbol = {
                    type: "simple-fill",
                    color: "rgba(255,50,50,.25)"
                  }
                  view.graphics.add(graphic,0);
                });
              }
            }, function(error){
              console.log(error);
            });
  
        }
  
      });
    }

        class Map extends HTMLElement
        {
            constructor() {
                super();

                this.appendChild(template.content.cloneNode(true));
                this._props = {};
                let that = this;

                mainMap();

            } //end of constructor

            onCustomWidgetBeforeUpdate(oChangedProperties) {
              if(!(APIKEY == null))
              {
                mainMap();
              }
            }

            onCustomWidgetAfterUpdate(oChangedProperties) {
              if ('apikey' in oChangedProperties) {
                this.$apikey = oChangedProperties['apikey'];
              }
              APIKEY = this.$apikey;
            }
        } //end of class

        let scriptSrc = "https://js.arcgis.com/4.18/"
        let onScriptLoaded = function() {
            customElements.define("com-sap-custom-geomap", Map);
        }

        //SHARED FUNCTION: reuse between widgets
        //function(src, callback) {
        let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
        let scriptStatus = customElementScripts.find(function(element) {
            return element.src == scriptSrc;
        });

        if (scriptStatus) {
            if(scriptStatus.status == "ready") {
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
            script.onload = function(){
                scriptObject.status = "ready";
                scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
            };
            document.head.appendChild(script);
        }

//END SHARED FUNCTION
})();
