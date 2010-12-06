(function($) {

    $.widget("ui.bingmaps", {
        options: {
            height: "300px",
            width: "500px",
            defaultLat: 38.539438402158495, 	/* default to UC Davis */
            defaultLng: -121.75701141357422, 	/* default to UC Davis */
            defaultZoom: 14, 					/* zoom shows entire campus */
            defaultMapStyle: VEMapStyle.Road, 	/* default to road style */
            enableRouting: true, 				/* enable routing or not, if enabled only 2 points can be selected */
            routeMode: VERouteMode.Walking, 	/* default to walking routing */
            autoRoute: true, 					/* whether or not to auto route location between two points */
            displayCurrentLocation: true, 		/* flag to draw crosshair and current location */
            displayLatitudeControl: undefined,  /* control to set latitude if you have a specific control to put the coordinate in */
            displayLongitudeControl: undefined, /* control to set longitude if you have a specific control to put the coordinate in */
            crosshairLocation: "crosshair.gif", /* location of the crosshair image file */
            displayZoom: false,                 /* displays the current zoom level */
            displayZoomControl: undefined,      /* control to set zoom if you have a specific control to put the zoom level in */
            displaySearch: false, 				/* displays search controls */
            locationTitle: "Current Location",
            searchTitle: "Search",
            coordinateTitle: "Locations",
			loadAllPins: false,					/* initially load all pins */
			hideCoordinates: false,				/* hides all the coordinates */
			usePushPins: true,					/* default shapes are push pins */
			customShape: ""						/* default custom shape */
        },
        _create: function() {
            this.id = this.element.attr("id");
            this.container = this.element;
			this.shapes = new Array();
			
            this.coordinates = this._formatCoordinates(this.container.children("div"));
            this.coordinatesTitle = $("<div>").addClass("coordinate-title").html(this.options.coordinateTitle).prependTo(this.coordinates);
            this.mapContainer = $("<div>").attr("id", this._randomId()).addClass("map-container").prependTo(this.container);
            this.map = $("<div>").attr("id", this._randomId()).css("position", "relative").css("width", this.options.width).css("height", this.options.height).addClass("map").appendTo(this.mapContainer);


            this._initializeMap();
            // registers button events for predefined locations
            this._registerMapButtonClick();
            // register event for map to show current location/zoom
            if (this.options.displayCurrentLocation || this.options.displayZoom) {

                if (this.options.displayLatitudeControl == undefined && this.options.displayLongitudeControl == undefined) {
                    this.locationContainer = $("<div>").addClass("location-container").appendTo(this.container);
                    this.locationTitle = $("<div>").addClass("location-title").prependTo(this.locationContainer);
                    this.location = $("<div>").addClass("location").appendTo(this.locationContainer);
                }

                this._registerMapChange();
            }
            // register event for allowing search
            if (this.options.displaySearch) {
                this.searchContainer = $("<div>").addClass("search-container").appendTo(this.container);
                this.searchTitle = $("<div>").addClass("search-title").prependTo(this.searchContainer);
                this.searchBox = $("<input>").attr("type", "text").appendTo(this.searchContainer);
                this.searchButton = $("<input>").attr("type", "button").val("Search").appendTo(this.searchContainer);

                this._registerSearch();
            }
			
			if (this.options.hideCoordinates)
			{
				this.coordinates.hide();
			}
        },
        _formatCoordinates: function($coordinateContainer /* div holding dl */) {
            $coordinateContainer.addClass("coordinate-container");
            $coordinateContainer.find("div").addClass("map-button");

            return $coordinateContainer;
        },
        _initializeMap: function() {
            var mapId = this.map.attr("id");

            var veMap = new VEMap(mapId);
            veMap.LoadMap(new VELatLong(this.options.defaultLat, this.options.defaultLng), this.options.defaultZoom, 'h', false);
            veMap.SetMapStyle(this.options.defaultMapStyle);

            this.veMap = veMap;

			
            // set the default load pins
			if (this.options.loadAllPins)
			{
				var locations = this.coordinates.find("div.map-button");
				var that = this;
				$.each(locations, function(index, item){ that._addPushPin($(item)); });
			}
			else // load single default location if there is one
			{
				var defaultCoordinate = this.coordinates.find("div.default-location");
				if (defaultCoordinate.length > 0) {
					this._addPushPin(defaultCoordinate);
				}
			}
        },
        _addPushPin: function($button) {
            // prepare a pin to be added to the map
            var pushPinId = this._randomId();
            var veLocation = this._readLatLng($button);
            var title = $button.find("dt").html();
            var description = $button.find("dd").html();
			
			var veShape = new VEShape(VEShapeType.Pushpin, veLocation);
			veShape.SetTitle(title);
			veShape.SetDescription(description);			

			if (!this.options.usePushPins)
			{
				//var icon = this.options.customShape;		
				//icon = this.options.customShape.replace("title", title);
				veShape.SetCustomIcon(this.options.customShape.replace(/title/i, title));
			}
			
            // determine what to do with the map, whether routing or not
            var addPin = true;

            if (this.options.enableRouting) {
                addPin = this._handleRouting($button, veLocation, veShape);
            }
            else {
                $button.addClass("selected");
            }

            if (addPin) {
                //this.veMap.AddPushpin(vePin);
				this.veMap.AddShape(veShape);
				this.shapes.push(veShape);
                $button.attr("pinId", veShape.GetID());
            }
			
			if (!this.options.enableRouting)
			{
				this._handleShowBestFit();
			}		
        },
        _handleRouting: function($button, veLocation, vePin) {
            var src = this.coordinates.find("div.src");
            var dest = this.coordinates.find("div.dest");

            // add classes to appropriate buttons
            if (src.length == 0) {
                $button.addClass("src");
                this.veMap.SetCenterAndZoom(veLocation, 16);

                src = $button;
            }
            else if (dest.length == 0) {
                $button.addClass("dest");

                dest = $button;
            }
            else {
                alert("Source and destination have already been selected.");
                return false;
            }

            if (src.length > 0 && dest.length > 0) {
                var start = new VELatLong(src.attr("lat"), src.attr("lng"));
                var end = new VELatLong(dest.attr("lat"), dest.attr("lng"));
                this._route(start, end);
            }

            return true;
        },
        _registerMapButtonClick: function() {
            var that = this;
            this.coordinates.find("div.map-button").click(function() {
                if (!$(this).hasClass("src") && !$(this).hasClass("dest") && !$(this).hasClass("selected")) {
                    that._addPushPin($(this));
                }
                else {
					var veShape = that.veMap.GetShapeByID($(this).attr("pinId"));
					that.veMap.DeleteShape(veShape);
                    $(this).removeAttr("pinId");
                    $(this).removeClass("src dest selected");
                    that.veMap.DeleteRoute();
                }
            });
        },
        _registerMapChange: function() {
            var that = this;

            if (this.locationTitle != undefined) this.locationTitle.html(this.options.locationTitle);

            this.veMap.AttachEvent("onchangeview", function() {
                var displayInformation = "";

                if (that.options.displayCurrentLocation) {
                    var center = that.veMap.GetCenter();
                    displayInformation = "Coordinates: " + center.Latitude + ", " + center.Longitude;

                    if (that.options.displayLongitudeControl != undefined && that.options.displayLatitudeControl != undefined) {

                        that.options.displayLongitudeControl.val(center.Longitude);
                        that.options.displayLatitudeControl.val(center.Latitude);

                        displayInformation = "";
                    }
                }

                if (that.options.displayZoom) {
                    var zoom = that.veMap.GetZoomLevel();

                    if (that.options.displayZoomControl != undefined) {
                        $("#" + that.options.displayZoomControl).val(zoom);
                    }
                    else {
                        displayInformation = displayInformation + "<br/>Zoom: " + zoom;
                    }
                }

                if (displayInformation != "") that.location.html(displayInformation);
            });

            // draw crosshairs
            var crosshair = $("<img>").attr("src", this.options.crosshairLocation).addClass("crosshair");

            $("div#" + this.veMap.ID).append(crosshair);
        },
        _registerSearch: function() {
            var that = this;
            this.searchTitle.html(this.options.searchTitle);
            this.searchButton.click(function() {
                try {
                    that.veMap.Find(null, that.searchBox.val());
                } catch (e) { alert(e); }
            });
        },
        _route: function(start, end) {
            var options = new VERouteOptions();
            options.RouteMode = this.options.routeMode;
            this.veMap.GetDirections([start, end], options);
        },
		_handleShowBestFit: function(){				
			var locations = new Array();
			var selected = this.coordinates.find("div.src,div.dest,div.selected");
			var that = this;
			$.each(selected, function(index,item){ locations.push(that._readLatLng($(item))); });
			
			// show best fit for multiple pins
			if (locations.length > 1) this.veMap.SetMapView(locations);
			// show standard zoom for 1 pin
			if (locations.length == 1) this.veMap.SetCenterAndZoom(locations[0], 16);
		},
		_readLatLng: function($button) {
			return new VELatLong($button.attr("lat"), $button.attr("lng"));		
		},
        _randomId: function() {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var string_length = 8;
            var randomstring = '';
            for (var i = 0; i < string_length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }

            return randomstring;
        }
    });
	
})(jQuery);