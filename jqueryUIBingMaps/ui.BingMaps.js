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
			displayZoomControl: undefined       /* control to set zoom if you have a specific control to put the zoom level in */
		},
		_create: function() {
			this.id = this.element.attr("id");
			this.container = this.element;
		
			this.coordinates = this._formatCoordinates(this.container.children("div"));
			this.map = $("<div>").attr("id", this._randomId()).css("position", "relative").css("width", this.options.width).css("height", this.options.height).addClass("map-container").prependTo(this.container);
			this.location = $("<div>").addClass("location-container").appendTo(this.container);
		
			this._initializeMap();
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
			
			
			this.veMap.AddPushpin(vePin);
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

			$button.attr("pinId", vePin.ID);
			
			if (src.length > 0 && dest.length > 0)
			{
				var start = src.
			}
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