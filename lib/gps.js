'use strict';

ExifLocation.prototype.getLongitude = function() {
	var longitude, longitudeRef;

	if (!this.exifReader) {
		throw new Error('Not loaded.');
	}

	longitude = this.exifReader.getTagDescription('GPSLongitude');
	if (!longitude) {
		return false;
	}

	longitudeRef = this.exifReader.getTagDescription('GPSLongitudeRef');
	if (longitudeRef === 'West longitude') {
		longitude = longitude * -1;
	}

	return longitude;
};


/**
 * Get the latitude from the image EXIF GPS data.
 *
 * @return {number|boolean} Return false if GPS data is not available
 */
ExifLocation.prototype.getLatitude = function() {
	var latitude, latitudeRef;

	if (!this.exifReader) {
		throw new Error('Not loaded.');
	}

	latitude = this.exifReader.getTagDescription('GPSLatitude');
	if (!latitude) {
		return false;
	}

	latitudeRef = this.exifReader.getTagDescription('GPSLatitudeRef');
	if (latitudeRef === 'South latitude') {
		latitude = latitude * -1;
	}

	return latitude;
};


/**
 * Get a Google Maps URL for the image EXIF GPS coordinates.
 *
 * @param {string} protocol Either 'http:', 'https:' or empty for a protocol relative URL
 * @param {string|number} zoom Zoom level for the map (1-20), defaults to 10
 * @param {string} type Map type, either 'm' for the normal map (default), 'k' for satellite, 'h' for hybrid, 'p' for terrain or 'e' for Google Earth
 * @return {string|boolean} Google Maps URL for the location, or false if no data points available
 */
ExifLocation.prototype.getGoogleMapsUrl = function(protocol, zoom, type) {
	var latitude, longitude;

	if (!protocol) {
		protocol = '';
	}

	if (!zoom) {
		zoom = '10';
	}

	if (!type) {
		type = 'm';
	}

	latitude = this.getLatitude();
	longitude = this.getLongitude();
	if (!latitude || !longitude) {
		return false;
	}

	return protocol + '//maps.google.com/maps?z=' + zoom + '&t=' + type + '&q=loc:' + latitude + '+' + longitude;
};

