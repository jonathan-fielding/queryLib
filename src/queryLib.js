;(function (window, document, undefined ) {
	var doc = window.document,
		docElem = doc.documentElement,
		head = doc.getElementsByTagName( "head" )[0] || docElem,
		base = doc.getElementsByTagName( "base" )[0],
		defaults = {
			requestQueue: [],
			rules: [],
			mediastyles: [],
			parsedSheets: {},
			links: null
		};

    // The queryLib constructor
    function queryLib (callback) {
        this.callback = callback;
        this.properties = defaults;
        this.properties.links = head.getElementsByTagName( "link" );
        this.init();

        return this;
    }

    queryLib.prototype = {
        init: function(){
			//loop stylesheets, send text content to translate
			
			for( var i = 0; i < this.properties.links.length; i++ ){
				var sheet = this.properties.links[i],
				href = sheet.href,
				media = sheet.media,
				isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";

				//only links plz and prevent re-parsing
				if( !!href && isCSS && !this.properties.parsedSheets[ href ] ){
					// selectivizr exposes css through the rawCssText expando
					if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
						this.translate( sheet.styleSheet.rawCssText, href, media );
						this.properties.parsedSheets[ href ] = true;
					} else {
						if( (!/^([a-zA-Z:]*\/\/)/.test( href ) && !base) ||
							href.replace( RegExp.$1, "" ).split( "/" )[0] === window.location.host ){
							this.properties.requestQueue.push( {
								href: href,
								media: media
							} );
						}
					}
				}
			}

			this.makeRequests();
		},
		makeRequests: function(){
			var that = this;
			//recurse through request queue, get css text

			if( this.properties.requestQueue.length ){
				var thisRequest = this.properties.requestQueue.shift();

				ajax( thisRequest.href, function( styles ){
					that.translate( styles, thisRequest.href, thisRequest.media );
					that.properties.parsedSheets[ thisRequest.href ] = true;

					// by wrapping recursive function call in setTimeout 
					// we prevent "Stack overflow" error in IE7
					window.setTimeout(function(){ that.makeRequests(); },0);
				} );
			}
		},
		translate: function( styles, href, media ){
			//find media blocks in css text, convert to style blocks
			var qs = styles.match(  /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi ),
				ql = qs && qs.length || 0;

			//try to get CSS path
			href = href.substring( 0, href.lastIndexOf( "/" ) );

			var repUrls	= function( css ){
					return css.replace( /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g, "$1" + href + "$2$3" );
				},
				useMedia = !ql && media;

			//if path exists, tack on trailing slash
			if( href.length ){ href += "/"; }	

			//if no internal queries exist, but media attr does, use that	
			//note: this currently lacks support for situations where a media attr is specified on a link AND
				//its associated stylesheet has internal CSS media queries.
				//In those cases, the media attribute will currently be ignored.
			if( useMedia ){
				ql = 1;
			}

			for( var i = 0; i < ql; i++ ){
				var fullq, thisq, eachq, eql;

				//media attr
				if( useMedia ){
					fullq = media;
					this.properties.rules.push( repUrls( styles ) );
				}
				//parse for styles
				else{
					fullq = qs[ i ].match( /@media *([^\{]+)\{([\S\s]+?)$/ ) && RegExp.$1;
					this.properties.rules.push( RegExp.$2 && repUrls( RegExp.$2 ) );
				}

				eachq = fullq.split( "," );
				eql	= eachq.length;

				for( var j = 0; j < eql; j++ ){
					thisq = eachq[ j ];
					this.properties.mediastyles.push( { 
						media 		: thisq.split( "(" )[ 0 ].match( /(only\s+)?([a-zA-Z]+)\s?/ ) && RegExp.$2 || "all",
						rulesCount 	: this.properties.rules.length - 1,
						rules 		: this.properties.rules[i],
						hasquery 	: thisq.indexOf("(") > -1,
						minw 		: thisq.match( /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ), 
						maxw 		: thisq.match( /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/ ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" )
					} );
				}	
			}

			this.callback(this.properties.mediastyles);
		}
    };

    //tweaked Ajax functions from Quirksmode
	var ajax = function( url, callback ) {
		var req = xmlHttp();
		if (!req){
			return;
		}	
		req.open( "GET", url, true );
		req.onreadystatechange = function () {
			if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){
				return;
			}
			callback( req.responseText );
		};
		if ( req.readyState === 4 ){
			return;
		}
		req.send( null );
	};

	//define ajax obj 
	var xmlHttp = (function() {
		var xmlhttpmethod = false;	
		try {
			xmlhttpmethod = new window.XMLHttpRequest();
		}
		catch( e ){
			xmlhttpmethod = new window.ActiveXObject( "Microsoft.XMLHTTP" );
		}
		return function(){
			return xmlhttpmethod;
		};
	})();

    window.queryLib = function(callback){
    	var instance = new queryLib(callback);
    	window.queryLib.cached = function(){
    		return instance.properties.mediastyles
    	};
	};
    
})(window, document);