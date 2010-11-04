/*
	jQuery Map/Routing Control
	Written by : Alan Lai
				 College of Agricultural & Environmental Sciences Dean's Office
				 University of California, Davis
	Date: 10/29/2010
	
	Dependancies:
		jquery 1.4.2
	
	Description:
		Map control using Bing Maps to provide a user with predefined geo coordinates
		the ability to dynamically add/remove pins and when enabled provide automatic
		routing between to points.
		
		When routing is disabled, an unlimited number of pins can be added to the map.
*/


(function($) {

    // attach this new method to jQuery
    $.fn.extend({

        bingMaps: function(options) {

            var settings = $.extend({
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
            }, options);


            // iterate through each of the objects passed in to generate the calendar
            return this.each(function(index, item) {
                var $mapContainer = $(this);
                var $coordinates = $mapContainer.find("dl"); 	// get the list of all geo coordinates

                // create the actual map
                var $map = $("<div>").attr("id", randomId());

                // add the div about the
                var $centerLocation = $("<div>").addClass("centerLocationContainer");

                // add classes to all the objects
                $map.addClass("mapContainer");
                $coordinates.parent().addClass("coordinateContainer");

                // add the new objects into our existing container
                $mapContainer.prepend($map);
                $mapContainer.append($centerLocation);

                var veMap = InitializeMap($map.attr("id"), $coordinates);
                $(".mapBtn").click(function() { CoordinateClick(veMap, $(this)) });
                if (settings.displayCurrentLocation || settings.displayZoom) { AddHandler(veMap, $centerLocation); }
            });

            function InitializeMap(mapId, $coordinates) {
                var map = new VEMap(mapId);
                map.LoadMap(new VELatLong(settings.defaultLat, settings.defaultLng), settings.defaultZoom, 'h', false);
                map.SetMapStyle(settings.defaultMapStyle);

                // set the default pin if there is one
                var defaultCoordinate = $coordinates.find(".defaultLocation");
                if (defaultCoordinate.length > 0) {
                    AddPushPin(map, $coordinates, defaultCoordinate);
                }

                return map;
            }

            function AddHandler(veMap, $locationBox) {
                veMap.AttachEvent("onchangeview", function() {

                    var displayInformation = "";

                    if (settings.displayCurrentLocation) {
                        var center = veMap.GetCenter();
                        displayInformation = "Coordinates:" + center.Latitude + "," + center.Longitude;

                        if (settings.displayLongitudeControl != undefined && settings.displayLatitudeControl != undefined) {
                            $("#" + settings.displayLongitudeControl).val(center.Longitude);
                            $("#" + settings.displayLatitudeControl).val(center.Latitude);

                            displayInformation = "";
                        }
                    }

                    if (settings.displayZoom) {
                        var zoom = veMap.GetZoomLevel();
                        
                        if (settings.displayZoomControl != undefined) {
                            $("#" + settings.displayZoomControl).val(zoom);
                        }
                        else {
                            displayInformation = displayInformation + "<br/>Zoom: " + zoom;
                        }
                    }

                    if (displayInformation != "") $locationBox.html(displayInformation);
                });

                // draw crosshairs
                var crosshair = $("<img>").attr("src", settings.crosshairLocation).addClass("crosshair");

                $("div#" + veMap.ID).append(crosshair);
            }

            function AddPushPin(veMap, $dl, $div)//, $dt, $dd)
            {
                var $dt = $div.find("dt");
                var $dd = $div.find("dd");

                var id = randomId();
                var location = new VELatLong($dt.attr("lat"), $dt.attr("lng"));
                var pin = new VEPushpin(id, location, null, $dt.html(), $dd.length == 0 ? null : $dd.html());

                var $src = $dl.find(".src");
                var $dest = $dl.find(".dest");

                if (settings.enableRouting) {
                    if ($src.length == 0)		// begin point has been selected
                    {
                        $dt.parent().addClass("src");
                        $src = $dt.parent();

                        // set the center of the map
                        veMap.SetCenterAndZoom(location, 16);
                    }
                    else if ($dest.length == 0)	// dest point has been selected
                    {
                        $dt.parent().addClass("dest");
                        $dest = $dt.parent();
                    }
                    else									// we already have a begin and end point
                    {
                        alert("A source and destination have been selected");
                        return;
                    }

                    // add the pin to the map
                    veMap.AddPushpin(pin);

                    // add the id to the div
                    $div.attr("pinId", id);

                    if ($src.length == 1 && $dest.length == 1 && settings.autoRoute) {
                        var start = new VELatLong($src.find("dt").attr("lat"), $src.find("dt").attr("lng"));
                        var end = new VELatLong($dest.find("dt").attr("lat"), $dest.find("dt").attr("lng"));
                        Route(veMap, start, end);
                    }
                }
                else {
                    veMap.AddPushpin(pin);
                    $div.attr("pinId", id);
                    $div.addClass("selected");
                }
            }

            function Route(veMap, start, end) {
                var options = new VERouteOptions();
                options.RouteMode = settings.routeMode;
				options.RouteCallback = function(routeSteps){debugger;};
                veMap.GetDirections([start, end], options);
            }

            function CoordinateClick(veMap, $div /* The div containing DT and DD */) {
                // add a push pin
                if (!$div.hasClass("src") && !$div.hasClass("dest") && !$div.hasClass("selected")) {
                    //AddPushPin(veMap, $div.parent(), $div.find("dt"), $div.find("dd"));
                    AddPushPin(veMap, $div.parent(), $div);
                }
                // remove push pin
                else {
                    veMap.DeletePushpin($div.attr("pinId"));
                    $div.removeAttr("pinId");
                    $div.removeClass("src dest selected");
                    veMap.DeleteRoute();
                }
            }

            function randomId() {
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
                var string_length = 8;
                var randomstring = '';
                for (var i = 0; i < string_length; i++) {
                    var rnum = Math.floor(Math.random() * chars.length);
                    randomstring += chars.substring(rnum, rnum + 1);
                }

                return randomstring;
            }

        } // end of conferencemaps
    }); // end of $.fn.extend
})(jQuery);