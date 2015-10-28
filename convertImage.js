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


function bufferToBase64( format, data ) {
	var prefix = "data:image/" + format + ";base64,";
	var base64 = data.toString('base64');
	var photoData = prefix + base64;
	return photoData;
}


function doSharp( imageFilename, callback ) {
	console.log( "Using sharp for image conversion..." );
	sharp( imageFilename )
		.metadata( function( data ) {
			var ratio = data.width / data.height;
			newHeight = ratio * newWidth;
		} )
		.resize(newWidth, newHeight)
		.webp()
		.toBuffer()
		.then( function( data ) {
			var photoData = bufferToBase64( "webp", data );
			console.log( "Finished." );
			callback( null, photoData );
		} );
}



function doJimp( imageFilename, callback ) {
	console.log( "Using Jimp fallback for image conversion..." );
	var j = new Jimp( imageFilename, function (err, image) {
		this.contain( newWidth, containHeight )
			.getBuffer( Jimp.MIME_PNG, function( err, data ) {
				var str = bufferToBase64( 'png', data );
				console.log( "Finished." );
				callback( null, str );
			} );
	});
}



module.exports = function( imageFilename, callback ) {
	var newHeight; 
	if ( sharp ) {
		doSharp( imageFilename, callback );
	} else {
		doJimp( imageFilename, callback );
	}
}
