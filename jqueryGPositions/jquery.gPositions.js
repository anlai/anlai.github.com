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

(function($) {

    // attach this new method to jQuery
    $.fn.extend({

        gPositions : function(options) {
		
			// set the default values
			var settings = $.extend({
				height: 	"300px;",
				width:		"800px;",
				latitude:	38.537061, 
				longitude:	-121.749174,
				zoom:		16,
				routing:	false,
				mapType:	google.maps.MapTypeId.ROADMAP
			}, options);
		
			return this.each(function(index,item){
			
				var $gpContainer = $(this);	// the map container
				var $coordinates = $gpContainer.find(".gp-coordinate");
				
				// create the map object
				var gmap = CreateMap($gpContainer);
				
				// creat the coordinate list for the user to select from
				CreateCoordinateList($gpContainer, $coordinates);
				BindCoordinateActions($gpContainer, $coordinates, gmap);
			
				
			});
		
			function AdjustMapView($gpContainer, gmap)
			{			
				var bounds = new google.maps.LatLngBounds();
				
				var $selected = $gpContainer.find(".gp-selected");
				
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
		
			function CreateMap($gpContainer)
			{			
				var latlng = new google.maps.LatLng(settings.latitude, settings.longitude);
				var options = { zoom: settings.zoom, center: latlng, mapTypeId: google.maps.MapTypeId.ROADMAP }
			
				var map = new google.maps.Map($gpContainer.find(".gp-map")[0], options);
				
				return map;
			}
		
			function CreateCoordinateList($gpContainer, $coordinates)
			{
				var $list = $("<ul>").addClass("gp-coordinate-container");
			
				$.each($coordinates, function(index,item){
				
					$list.append($("<li>").append(item));
				
				});
				
				$gpContainer.append($list);
			}
		
			function BindCoordinateActions($gpContainer, $coordinates, gmap)
			{			
				$coordinates.click(function(){
					
					var lat = $(this).data("lat");
					var lng = $(this).data("lng");
					
					var title = $(this).find(".gp-name").html();
					var description = $(this).find(".gp-description").html();
					
					if ($(this).hasClass("gp-selected"))
					{
						$(this).removeClass("gp-selected");
					}
					else
					{
						$(this).addClass("gp-selected");
						
						var latlng = new google.maps.LatLng(lat, lng);
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
					}
					
					AdjustMapView($gpContainer, gmap);
				});
			}
		

		}
		
    }); // end of $.fn.extend
})(jQuery);