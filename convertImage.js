'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var piexifjs = require( 'piexifjs' );

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



export function clientView( imageFilename, options, callback ) {
	if ( options.noConvert ) {
		let data = fs.readFileSync( imageFilename );
		let str = bufferToBase64( 'jpeg', data );
		callback( null, str );
	} else {
		if ( sharp ) {
			doSharp( imageFilename, options, callback );
		} else {
			doJimp( imageFilename, options, callback );
		}
	}
};





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

// https://beradrian.wordpress.com/2008/11/14/rotate-exif-images/
function rotateExifOrientation( rotation, originalOrientation ) {
	switch ( originalOrientation ) {
		default:
		case 1: // straight
			switch ( rotation ) {
				default:
				case 0:
					return 0;
				case 1:
					return 8;
				case 2:
					return 3;
				case 3:
					return 6;
			}
			break;
		case 2: // straight but flipped horizontally
			switch ( rotation ) {
				default:
				case 0:
					return 2;
				case 1:
					return 7;
				case 2:
					return 4;
				case 3:
					return 5;
			}
			break;
		case 3: // upside down
			switch ( rotation ) {
				default:
				case 0:
					return 3;
				case 1:
					return 6;
				case 2:
					return 1;
				case 3:
					return 8;
			}
			break;
		case 4: // upside down and flipped horizontally
			switch ( rotation ) {
				default:
				case 0:
					return 4;
				case 1:
					return 5;
				case 2:
					return 2;
				case 3:
					return 7;
			}
			break;
		case 5: // 90* anticlockwise flipped
			switch ( rotation ) {
				default:
				case 0:
					return 5;
				case 1:
					return 2;
				case 2:
					return 7;
				case 3:
					return 4;
			}
			break;
		case 6: // 90* anticlockwise
			switch ( rotation ) {
				default:
				case 0:
					return 6;
				case 1:
					return 1;
				case 2:
					return 8;
				case 3:
					return 3;
			}
			break;
		case 7: // 90* clockwise flipped
			switch ( rotation ) {
				default:
				case 0:
					return 7;
				case 1:
					return 4;
				case 2:
					return 5;
				case 3:
					return 2;
			}
			break;
		case 8: // 90* clockwise
			switch ( rotation ) {
				default:
				case 0:
					return 8;
				case 1:
					return 3;
				case 2:
					return 6;
				case 3:
					return 1;
			}
			break;
	}
}



export function rotate( imageFilename, options, callback ) {
	if ( options.writeExif ) { // rotate image by rewriting exif orientation tag - don't re-encode the image
		let jpeg = fs.readFileSync( imageFilename );
		let data = jpeg.toString( "binary" );
		let exif = piexifjs.load( data );
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
		let newOrientation = rotateExifOrientation( options.rotation, originalOrientation );
		console.log( "Old Orientation=" + originalOrientation + " new=" + newOrientation );
		exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] = newOrientation;
		let exifBytes = piexifjs.dump( exif );
		let newdata = piexifjs.insert( exifBytes, data );
	//	fs.writeFileSync( imageFilename + ".exif", JSON.stringify( exif, null, 2 ) );
		callback( null, newdata, newOrientation );
	} else {
		if ( sharp ) {
			doSharpRotate( imageFilename, options, callback );
		} else {
			doJimpRotate( imageFilename, options, callback );
		}
	}
};

