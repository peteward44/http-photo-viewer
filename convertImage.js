'use strict';

let fs = require( 'fs' );
let path = require( 'path' );
let piexifjs = require( 'piexifjs' );
let orientation = require( './orientation.js' );

let sharp;
try {
	sharp = require('sharp');
}
catch ( err ) {
	// no sharp available - use backup lib
}
let Jimp = require("jimp");


const newWidth = 300;
const containHeight = 500;


function calculateNewSize( w, h ) {
	// work out if landscape or portrait
	const isLandscape = w > h;
	const ratio = w / h;
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
				callback( null, { data: data } );
			} );
	});
}



export function clientView( imageFilename, options, callback ) {
	// if ( options.noConvert ) {
		let data = fs.readFileSync( filePath ).toString( 'binary' );
		let exif = piexifjs.load( data );
		let result = {};
		result.orientation = exif && exif[ "0th" ] && isFinite( exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] ) ? exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] : 0
		result.data = data;
		callback( null, data );
	// } else {
		// if ( sharp ) {
			// doSharp( imageFilename, options, callback );
		// } else {
			// doJimp( imageFilename, options, callback );
		// }
	// }
}





function doSharpRotate( imageFilename, options, callback ) {
	console.log( "Using sharp for image conversion..." );
	sharp( imageFilename )
		.rotate( 90 * options.rotation )
		.toFormat(sharp.format.jpeg)
		.toBuffer()
		.then( function( data ) {
			callback( null, data, 0 );
		} );
}



function doJimpRotate( imageFilename, options, callback ) {
	console.log( "Using Jimp fallback for image conversion..." );
	var j = new Jimp( imageFilename, function (err, image) {
		this.rotate( 90 * options.rotation )
			.quality( 100 )
			.getBuffer( Jimp.MIME_JPEG, function( err, data ) {
				callback( null, data, 0 );
			} );
	});
}


export function rotateExif( data, rotation ) {
	if ( !isFinite( rotation ) || rotation === 0 ) {
		return data;
	}
	while ( rotation < 0 ) {
		rotation += 4;
	}
	rotation %= 4;
	console.log( "Rotating " + rotation );

	let exif = piexifjs.load( data.data );
	let originalOrientation = 0;
	if ( !exif ) {
		exif = {};
	}
	if ( !exif[ "0th" ] ) {
		exif[ "0th" ] = {};
	}
	if ( isFinite( exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] ) ) {
		originalOrientation = exif[ "0th" ][ piexifjs.ImageIFD.Orientation ];
	}
	let newOrientation = orientation.rotate( originalOrientation, rotation );
	console.log( "Old Orientation=" + originalOrientation + " new=" + newOrientation );
	exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] = newOrientation;
//	console.log( "Outputting exif data " + imageFilename + ".exif" );
//	fs.writeFileSync( imageFilename + ".exif", JSON.stringify( exif, null, 2 ) );	
	let exifBytes = piexifjs.dump( exif );
	data.data = piexifjs.insert( exifBytes, data.data );
	data.orientation = newOrientation;
	return data;
}


export function rotate( imageFilename, options, callback ) {
	if ( options.writeExif ) { // rotate image by rewriting exif orientation tag - don't re-encode the image
		let jpeg = fs.readFileSync( imageFilename );
		let data = jpeg.toString( "binary" );
		let newdata = rotateExif( data, options.rotation );
		callback( null, newdata, newOrientation );
	} else {
		if ( sharp ) {
			doSharpRotate( imageFilename, options, callback );
		} else {
			doJimpRotate( imageFilename, options, callback );
		}
	}
};

