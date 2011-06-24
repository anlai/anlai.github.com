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
					
					var latlng = new google.maps.LatLng(lat, lng);
					var marker = new google.maps.Marker({
						position: latlng, 
						map: gmap, 
						title:"Hello World!"
					});  
				
				});
			}
		
			function CreateMap($gpContainer)
			{			
				var latlng = new google.maps.LatLng(settings.latitude, settings.longitude);
				var options = { zoom: settings.zoom, center: latlng, mapTypeId: google.maps.MapTypeId.ROADMAP }
			
				var map = new google.maps.Map($gpContainer.find(".gp-map")[0], options);
				
				return map;
			}
		}
		
    }); // end of $.fn.extend
})(jQuery);