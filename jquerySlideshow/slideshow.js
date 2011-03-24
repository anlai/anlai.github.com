(function($) {

	$.widget("ui.slideshow", {
	
		options: {	
			interval: 30000	// 30 seconds
		},
		_create: function() {
		
			this.id = this.element.attr("id");
			this.container = this.element;
		
			this._initialize();
			
			this.currentIndex = 0;
			this.maxIndex = $(this.container).find("img").length;
			
			// activate konamify
			this.konami= false;
			this._konamify(this);
			
			// set the default
			this._selectImage(0);
			
			setInterval(this._automaticChange, this.options.interval, this);
		},
		_initialize: function(){
			// set local copy of this
			var that = this;
		
			// create a container for the links to select image
			var $link_container = $("<ul>").attr("id", "link_container");
		
			// setup the photos
			$.each($(this.container).find("img"), function(index, item){
				// assign an id to each photo
				$(item).attr("id", index);
				// hide every image except the first one
				if (index > 0) $(item).hide();
				
				// add a link for each image
				var $link = $("<a>").attr("href", "#").attr("id", "link_"+index).data("id", index).html(index).addClass("select_image");
				$link_container.append($link);
			});
			
			// add the list of links to the main container
			$(that.container).append($link_container);
			
			// add a click handler for each image
			$(".select_image").click(function(){
				that._selectImage($(this).data("id"));
			});
		},
		_selectImage: function(id){
		
			if (this.konami)
			{
				$(this.container).find("img:visible").effect("explode",{pieces: 20});
			}
			else
			{		
				// fade out the old one
				$(this.container).find("img:visible").fadeOut();
			}
			// show the selected image
			$(this.container).find("img#" + id).fadeIn();						
			
			// set the classes for the sprites
			$(".select_image").removeClass("selected");
			$("#link_" + id).addClass("selected");
			
			// set the current index
			this.currentIndex = id;
		},
		_automaticChange: function(that){
	
			// load and increment the index
			var index = that.currentIndex;
			index++;
			
			// reached the end, start from beginning
			if (index >= that.maxIndex)
			{
				index = 0;
			}
						
			that._selectImage(index);
		},
		_konamify: function(that)
		{
			var kkeys = [], konami = "38,38,40,40,37,39,37,39,66,65";  
			$(document).keydown(function(e) {  
			  kkeys.push( e.keyCode );  
			  if ( kkeys.toString().indexOf( konami ) >= 0 ){  
				$(document).unbind('keydown',arguments.callee);  
				that.konami = true;
			  }  
    });  
		}
	});

})(jQuery);