(function ($) {
	
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
			displaySearch: false				/* displays search controls */
			
		},
		_create: function() {
			this.id = this.element.attr("id");
			this.container = this.element;
		
			this.coordinates = this._formatCoordinates(this.container.children("div"));
			this.map = $("<div>").attr("id", this._randomId()).css("position", "relative").css("width", this.options.width).css("height", this.options.height).addClass("map-container").prependTo(this.container);
			this.location = $("<div>").addClass("location-container").appendTo(this.container);
			this.searchContainer = $("<div>").addClass("search-container").appendTo(this.container);
			this.searchBox = $("<input>").attr("type", "text").appendTo(this.searchContainer);
			this.searchButton = $("<input>").attr("type", "button").val("Search").appendTo(this.searchContainer);
		
			this._initializeMap();
			this._registerMapButtonClick();
			if (this.options.displayCurrentLocation || this.options.displayZoom) this._registerMapChange();
			if (this.options.displaySearch) this._registerSearch();
		},
		_formatCoordinates: function($coordinateContainer /* div holding dl */){
			$coordinateContainer.addClass("coordinate-container");
			$coordinateContainer.find("div").addClass("map-button");
			
			return $coordinateContainer;
		},
		_initializeMap: function()
		{
			var mapId = this.map.attr("id");
			
			var veMap = new VEMap(mapId);
			veMap.LoadMap(new VELatLong(this.options.defaultLat, this.options.defaultLng), this.options.defaultZoom, 'h', false);
			veMap.SetMapStyle(this.options.defaultMapStyle);

			this.veMap = veMap;
			
			// set the default pin if there is one			
			var defaultCoordinate = this.coordinates.find("div.default-location");
			if (defaultCoordinate.length > 0) {
				//AddPushPin(map, $coordinates, defaultCoordinate);
				this._addPushPin(defaultCoordinate);
			}
		},
		_addPushPin: function($button) {	
			// prepare a pin to be added to the map
			var pushPinId = this._randomId();
			var veLocation = new VELatLong($button.attr("lat"), $button.attr("lng"));
			var title = $button.find("dt").html();
			var description = $button.find("dd").html();
			var vePin = new VEPushpin(pushPinId, veLocation, null, title, description);
			
			// determine what to do with the map, whether routing or not
			
			if (this.options.enableRouting)
			{
				this._handleRouting($button, veLocation, vePin);
			}
			else
			{
				$button.addClass("selected");
			}

			this.veMap.AddPushpin(vePin);
			$button.attr("pinId", vePin.ID);
		},
		_handleRouting: function($button, veLocation, vePin) {
			var src = this.coordinates.find("div.src");
			var dest = this.coordinates.find("div.dest");
			
			// add classes to appropriate buttons
			if (src.length == 0)
			{
				$button.addClass("src");
				this.veMap.SetCenterAndZoom(veLocation, 16);
				
				src = $button;
			}
			else if (dest.length == 0)
			{
				$button.addClass("dest");
				
				dest = $button;
			}
			else
			{
				alert("Source and destination have already been selected.");
				return;
			}

			if (src.length > 0 && dest.length > 0)
			{
				var start = new VELatLong(src.attr("lat"), src.attr("lng"));
				var end = new VELatLong(dest.attr("lat"), dest.attr("lng"));
				this._route(start, end);				
			}
		},
		_registerMapButtonClick: function() {
			var that = this;
			this.coordinates.find("div.map-button").click(function(){
				if (!$(this).hasClass("src") && !$(this).hasClass("dest") && !$(this).hasClass("selected"))
				{
					that._addPushPin($(this));
				}
				else
				{
					that.veMap.DeletePushpin($(this).attr("pinId"));
                    $(this).removeAttr("pinId");
                    $(this).removeClass("src dest selected");
                    that.veMap.DeleteRoute();
				}
			});			
		},
		_registerMapChange: function(){
			var that = this;
		
			this.veMap.AttachEvent("onchangeview", function() {

				var displayInformation = "";

				if (that.options.displayCurrentLocation) {
					var center = that.veMap.GetCenter();
					displayInformation = "Coordinates:" + center.Latitude + "," + center.Longitude;

					if (that.options.displayLongitudeControl != undefined && that.options.displayLatitudeControl != undefined) {
						$("#" + that.options.displayLongitudeControl).val(center.Longitude);
						$("#" + that.options.displayLatitudeControl).val(center.Latitude);

						displayInformation = "";
					}
				}

				if (that.options.displayZoom) {
					var zoom = veMap.GetZoomLevel();
					
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
		_registerSearch: function(){
			var that = this;
			
			this.searchButton.click(function(){
				try{
				that.veMap.Find(null, that.searchBox.val());
				} catch (e) { alert(e);}
			});
		},
		_route: function (start, end){
			var options = new VERouteOptions();
			options.RouteMode = this.options.routeMode;
			this.veMap.GetDirections([start, end], options);
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