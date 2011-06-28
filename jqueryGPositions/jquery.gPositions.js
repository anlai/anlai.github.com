/*
	jQuery Map/Routing Control
	Written by : Alan Lai
				 College of Agricultural & Environmental Sciences Dean's Office
				 University of California, Davis
	Date: 6/23/2011
	
	Dependencies:
		jquery 1.5.1
	
	Description:
		Map control powered by Google Maps Javascript API v3.  This control allows
		you to specify multiple locations and place pins on them by clicking on
		a button on the side of the map.
		
		It can also support routing between two points if enabled.
		
	Usage:
		To use this control you will need a div for the location of where to put the map.
		And inside the div, divs with the coordinates in data attributes and having the class "coordinate"
*/

/* enum for defining mode */
var MapMode = { STANDARD: 0, ROUTING: 1, SELECTINGPOINT: 2 };

(function($) {

    // attach this new method to jQuery
    $.fn.extend({

        gPositions : function(options) {
		
			var markers = [];
			// required to use the direction/routing services
			var directionsService = new google.maps.DirectionsService();
			var directionDisplay;
			
			// set the default values
			var settings = $.extend({
				height: 	"300px;",
				width:		"800px;",
				latitude:	38.537061, 
				longitude:	-121.749174,
				zoom:		16,
				mode:		MapMode.STANDARD,
				loadAll:	false,	// default to load all pins
				mapType:	google.maps.MapTypeId.ROADMAP,
				debug: 		false
			}, options);
		
			return this.each(function(index,item){
			
				var $gpContainer = $(this);	// the map container
				// create the map object
				var gmap = CreateMap($gpContainer);
			
				if (settings.mode == MapMode.STANDARD || settings.mode == MapMode.ROUTING)
				{
					var $coordinates = $gpContainer.find(".gp-coordinate");
					
					// create the coordinate list for the user to select from
					CreateCoordinateList($gpContainer, $coordinates, gmap);
					BindCoordinateActions($gpContainer, $coordinates, gmap);	
				}
				else
				{
					CreatePositionSelectingControls(gmap, $gpContainer);
					CreatePositionSelecting(gmap, $gpContainer);
				}
			});
		
			/*
				Adjusts the map to show routing information
			*/
			function AdjustMapViewRouting($gpContainer, gmap)
			{
				if (directionDisplay != null) directionDisplay.setMap(null);
			
				// add the directions overlay to the map
				directionDisplay = new google.maps.DirectionsRenderer();
				directionDisplay.setMap(gmap);
				
				// figure out the directions
				var src = markers[0];				// first marker
				var dest = markers[markers.length-1];	// last marker
				
				var wayPts = [];
				if (markers.length > 2)
				{		
					for(i = 1; i < markers.length-1; i++)
					{
						wayPts.push({location: markers[i].position, stopover: true});
					}
				}
				
				var request = {origin: src.position, destination: dest.position, waypoints: wayPts, travelMode: google.maps.TravelMode.WALKING};
				
				directionsService.route(request, function(result, status)
					{
						if (status == google.maps.DirectionsStatus.OK)
						{
							directionDisplay.setDirections(result);
						}
					});
			}
		
			function AdjustMapView($gpContainer, gmap)
			{			
				var bounds = new google.maps.LatLngBounds();
				
				var $selected = $gpContainer.find(".gp-selected");
				
				if ($selected.length > 1 && settings.mode == MapMode.ROUTING)
				{
					AdjustMapViewRouting($gpContainer, gmap);
				}
				else
				{
					if (directionDisplay != null) directionDisplay.setMap(null);
				}
				
				// just set the default zoom if all markers are removed
				if ($selected.length <= 1)
				{
					// center on single pin
					if ($selected.length == 1)
					{
						var lat = $selected.data("lat");
						var lng = $selected.data("lng");
						var latlng = new google.maps.LatLng(lat, lng);
						
						gmap.setCenter(latlng);
					}
					
					// always adjust zoom
					gmap.setZoom(settings.zoom);
				}
				else
				{
					// get the bounds on all markers
					$.each($selected, function(index,item){
						var lat = $(this).data("lat");
						var lng = $(this).data("lng");
					
						var latlng = new google.maps.LatLng(lat, lng);
						bounds.extend(latlng);
					});
					
					gmap.fitBounds(bounds);
				}
			}
		
			// Creates the standard map with selecting points / routing
			function CreateMap($gpContainer)
			{			
				var latlng = new google.maps.LatLng(settings.latitude, settings.longitude);
				var options = { zoom: settings.zoom, center: latlng, mapTypeId: google.maps.MapTypeId.ROADMAP }
			
				var map = new google.maps.Map($gpContainer.find(".gp-map")[0], options);
			
				return map;
			}
		
			function CreateCoordinateList($gpContainer, $coordinates, gmap)
			{
				var hasDefault = false;
			
				var $list = $("<ul>").addClass("gp-coordinate-container");
				//var $container = $("<div>").addClass("gp-coordinate-container").append($list);
				
				$.each($coordinates, function(index,item){
				
					$list.append($("<li>").append(item));
				
					if (settings.loadAll)
					{					
						AddMarker(gmap, $(item));
					}
					// load in the default pin if specified
					else
					{
						if ($(item).hasClass("gp-default"))
						{
							AddMarker(gmap, $(item));							
							hasDefault = true;
						}
					}
					
				});
				
				$gpContainer.append($list);
				
				if (settings.loadAll || hasDefault)
				{
					AdjustMapView($gpContainer, gmap);
				}
			}
		
			/*
				Creates the marker
				
				$selector: the div that holds the mapping information
				return: returns the gmid number
			*/
			function AddMarker(gmap, $selector)
			{
				$selector.addClass("gp-selected");
			
				var lat = $selector.data("lat");
				var lng = $selector.data("lng");
				var latlng = new google.maps.LatLng(lat, lng);
				
				var title = $selector.find(".gp-name").html();
				var description = $selector.find(".gp-description").html();
			
				var marker = new google.maps.Marker({
					position: latlng, 
					map: gmap, 
					animation: google.maps.Animation.DROP,
					title: title != undefined && title != "" ? title : "no title"
				});  
				
				// add the info window when the marker is clicked
				var infowindow = new google.maps.InfoWindow({
					content: description
				});

				google.maps.event.addListener(marker, 'click', function() {
					infowindow.open(gmap,marker);
				});
			
				if (settings.mode == MapMode.ROUTING) 
				{
					marker.setMap(null);
				}
			
				markers.push(marker);
					
				$selector.data("gmid", marker.__gm_id);
			}
			
			function RemoveMarker($selector)
			{								
				$selector.removeClass("gp-selected");
				var gmid = $selector.data("gmid");
			
				// remove the marker from the map				
				var marker, index;
				
				for(i = 0; i < markers.length; i++)
				{
					if (markers[i].__gm_id == gmid)
					{
						index = i;
						//marker = markers[i];
						break;
					}
				}
			
				if (index != undefined)
				{
					//markers.remove(index);
					marker = markers.splice(index,1);
					marker[0].setMap(null);
				}
			}
		
			function BindCoordinateActions($gpContainer, $coordinates, gmap)
			{			
				$coordinates.click(function(){
					
					if ($(this).hasClass("gp-selected"))
					{
						RemoveMarker($(this));
					}
					else
					{
						AddMarker(gmap, $(this));
					}
					
					AdjustMapView($gpContainer, gmap);
				});
			}
			
			// Creates the map with listener for selecting position
			function CreatePositionSelecting(gmap, $gpContainer)
			{			
				// load in the crosshairs			
				var $crosshairs = $("<div>").addClass("gp-crosshair");
				$gpContainer.find(".gp-map").append($crosshairs);		
							
				// find the display controls
				var $list = $gpContainer.find(".gp-selecting-controls");
				var $lat = $list.find(".gp-lat");
				var $lng = $list.find(".gp-lng");

				var $latdebug = $list.find(".gp-lat-debug");
				var $lngdebug = $list.find(".gp-lng-debug");
						
				google.maps.event.addListener(gmap, 'mouseup', function(event) {
				
					$lat.val(event.latLng.lat());
					$lng.val(event.latLng.lng());
			
					// display the information for debug
					if (settings.debug)
					{
						$latdebug.html(event.latLng.lat());
						$lngdebug.html(event.latLng.lng());
					}
			
				});
			}
			
			function CreatePositionSelectingControls(gmap, $gpContainer)
			{
				var $list = $("<ul>").addClass("gp-selecting-controls");
				
				// create the search boxes
				var $search = $("<li>").html("Search Address: &nbsp");
				// create search box
				var $searchBox = $("<input>").addClass("gp-search-box");
				$searchBox.keyup(function(event){if(event.keyCode == 13){ $(this).siblings('input[type="button"]').click(); }});
				// create search button
				var $searchBtn = $("<input>").attr("type", "button").val("Search");
				$searchBtn.click(function(){ 
					var address = $(this).siblings(".gp-search-box").val(); 
					Search(gmap, address);
				});
				$search.append($searchBox).append($searchBtn);
				
				var $lat = $("<li>").html("Latitude:").append($("<input>").attr("name", "lat").attr("type", "hidden").addClass("gp-lat"));
				var $lng = $("<li>").html("Longitude:").append($("<input>").attr("name", "lng").attr("type", "hidden").addClass("gp-lng"));
				
				// display the information for debug
				if (settings.debug)
				{
					$lat.append($("<div>").addClass("gp-lat-debug"));
					$lng.append($("<div>").addClass("gp-lng-debug"));
				}
				
				$list.append($search);
				$list.append($lat);
				$list.append($lng);
				
				$gpContainer.append($list);
			}
			
			function Search(gmap, address)
			{
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({'address': address}, function(results, status){
					if (status == google.maps.GeocoderStatus.OK)
					{
						gmap.setCenter(results[0].geometry.location);
					}
				
				});
			}
		}
		
    }); // end of $.fn.extend
})(jQuery);