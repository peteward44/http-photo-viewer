'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var sharp;
try {
	sharp = require('sharp');
}
catch ( err ) {
	// no sharp available - use backup lib
}
var Jimp = require("jimp");


var newWidth = 300;
var containHeight = 500;


function calculateNewSize( w, h ) {
	// work out if landscape or portrait
	var isLandscape = w > h;
	var ratio = w / h;
	if ( isLandscape ) {
		return {
			width: 740,
			height: Math.floor( 740 * ( h / w ) )
		};
	} else {
		return {
			width: Math.floor( 560 * ( w / h ) ),
			height: 560
		};
	}
}



function bufferToBase64( format, data ) {
	var prefix = "data:image/" + format + ";base64,";
	var base64 = data.toString('base64');
	var photoData = prefix + base64;
	return photoData;
}


function doSharp( imageFilename, options, callback ) {
	console.log( "Using sharp for image conversion..." );
	sharp( imageFilename )
		.metadata()
		.then(function(data) {
			var dimensions = calculateNewSize( data.width, data.height );
			return image.resize(dimensions.width, dimensions.height)
				.webp()
				.toBuffer()
				.then( function( data ) {
					var photoData = bufferToBase64( "webp", data );
					console.log( "Finished." );
					callback( null, photoData );
				} );
		});
}



function doJimp( imageFilename, options, callback ) {
	console.log( "Using Jimp fallback for image conversion..." );
	var j = new Jimp( imageFilename, function (err, image) {
		var dimensions = calculateNewSize( image.bitmap.width, image.bitmap.height );
		this.resize( dimensions.width, dimensions.height )
			.quality( 95 )
			.getBuffer( Jimp.MIME_JPEG, function( err, data ) {
//				fs.writeFileSync( 'out.png', data, 'binary' );
				var str = bufferToBase64( 'jpeg', data );
				console.log( "Finished." );
				callback( null, str );
			} );
	});
}



exports.clientView = function( imageFilename, options, callback ) {
	if ( sharp ) {
		doSharp( imageFilename, options, callback );
	} else {
		doJimp( imageFilename, options, callback );
	}
};





function doSharpRotate( imageFilename, options, callback ) {
	console.log( "Using sharp for image conversion..." );
	sharp( imageFilename )
		.rotate( 90 * options.rotation )
		.toFormat(sharp.format.jpeg)
		.toBuffer()
		.then( function( data ) {
			callback( null, data );
		} );
}



function doJimpRotate( imageFilename, options, callback ) {
	console.log( "Using Jimp fallback for image conversion..." );
	var j = new Jimp( imageFilename, function (err, image) {
		this.rotate( 90 * options.rotation )
			.quality( 100 )
			.getBuffer( Jimp.MIME_JPEG, function( err, data ) {
				callback( null, data );
			} );
	});
}



exports.rotate = function( imageFilename, options, callback ) {
	if ( sharp ) {
		doSharpRotate( imageFilename, options, callback );
	} else {
		doJimpRotate( imageFilename, options, callback );
	}
};

