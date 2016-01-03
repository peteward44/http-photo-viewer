'use strict';

var piexifjs = require( 'piexifjs' );
var fs = require( 'fs' );

export function getGoogleMapsUrl( exif, protocol, zoom, type ) {
	if ( !exif || !exif[ "GPS" ] ) {
		return null;
	}
	
	if ( !exif[ "GPS" ][ piexifjs.GPSIFD.GPSLongitude ] || !exif[ "GPS" ][ piexifjs.GPSIFD.GPSLatitude ] ) {
		return null;
	}
	
	let lon = exif[ "GPS" ][ piexifjs.GPSIFD.GPSLongitude ];
	let lat = exif[ "GPS" ][ piexifjs.GPSIFD.GPSLatitude ];
	
	if ( exif[ "GPS" ][ piexifjs.GPSIFD.GPSLongitudeRef ] === 'West longitude' ) {
		lon *= -1;
	}
	
	if ( exif[ "GPS" ][ piexifjs.GPSIFD.GPSLatitudeRef ] === 'South latitude' ) {
		lat *= -1;
	}
	protocol = protocol || 'http';
	zoom = zoom || '10';
	type = type || 'm';
	return protocol + '//maps.google.com/maps?z=' + zoom + '&t=' + type + '&q=loc:' + lat + '+' + lon;	
}


export function getDateTime( exif ) {
	if ( exif ) {
		//fs.writeFileSync( 'out.txt', JSON.stringify( exif, null, 2 ) );
		if ( exif[ "0th" ] ) {
			// get date time of image
			if ( exif[ "0th" ][ piexifjs.ImageIFD.DateTime ] ) {
				return exif[ "0th" ][ piexifjs.ImageIFD.DateTime ];
			}
		}
		if ( exif[ "Exif" ] ) {
			if ( exif[ "Exif" ][ piexifjs.ExifIFD.DateTimeOriginal ] ) {
				return exif[ "Exif" ][ piexifjs.ExifIFD.DateTimeOriginal ];
			}
			if ( exif[ "Exif" ][ piexifjs.ExifIFD.DateTimeDigitized ] ) {
				return exif[ "Exif" ][ piexifjs.ExifIFD.DateTimeDigitized ];
			}
		}
		if ( exif[ "GPS" ] ) {
			if ( exif[ "GPS" ][ piexifjs.GPSIFD.GPSDateStamp ] ) {
				return exif[ "GPS" ][ piexifjs.GPSIFD.GPSDateStamp ];
			}
		}
	}
	return null;
}


export function getOrientation( exif ) {
	if ( exif && exif[ "0th" ] ) {
		if ( isFinite( exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] ) ) {
			return exif[ "0th" ][ piexifjs.ImageIFD.Orientation ];
		}
	}
	return 0;
}

