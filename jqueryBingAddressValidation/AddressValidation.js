		
			var bingUrl = 'http://dev.virtualearth.net/REST/v1/Locations?query=[address]&key=[key]&jsonp=?';
		
			$(function(){			
				$(".addrVerification").blur(search);
			});
		
			function search()
			{
				var address = buildAddress();
				
				if (address != undefined)
				{
					// build up the url
					var url = bingUrl;
					url = url.replace('[address]', address);
					url = url.replace('[key]', key);	
					
					$("#results").empty();
					
					// make the remote call
					$.getJSON(url,function(result){
						$.each(result.resourceSets, function(index,item){
							
							var obj = item.resources[0];
							var addr = obj.address;
							
							var addrContainer = $("<fieldset>");
							var list = $("<ul>");
							list.append($("<li>").html(addr.addressLine));
							list.append($("<li>").html(addr.locality));
							list.append($("<li>").html(addr.adminDistrict));
							list.append($("<li>").html(addr.postalCode));
							list.append($("<li>").html(addr.countryRegion));
							
							addrContainer.append(list);
							$("#results").append(addrContainer);
						});
					});				
				}
			}
		
			function buildAddress()
			{	