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
		}
	});
	
})