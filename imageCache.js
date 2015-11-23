'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var piexifjs = require( 'piexifjs' );
var convertImage = require('./convertImage.js');


class ImageCache {
	constructor() {
		this._loadQueue = [];
		this._images = {};
		this._loading = false;
	}
	
	
	_checkQueue() {
		let that = this;
		if ( this._loading ) {
			return; // loading already in progress
		}
		if ( this._loadQueue.length <= 0 ) {
			return; // nothing in the queue
		}
		
		this._loading = true;
		let loadRequest = this._loadQueue.pop();
		
		if ( this._images.hasOwnProperty( loadRequest.path ) ) {
			// already in cache
			loadRequest.resolve( this._images[ loadRequest.path ] );
			this._loading = false;
			return;
		}
		
		console.log( "Loading " + loadRequest.path );
		convertImage.clientView( loadRequest.path, { /*noConvert: true*/ }, function( err, str ) {
			err ? loadRequest.reject( err ) : loadRequest.resolve( str );
			that._images[ loadRequest.path ] = str;
			that._loading = false;
			setImmediate( () => { that._checkQueue(); } );
		} );
	}
	
	
	_loadImage( resolve, reject, filePath ) {
		// add to the load queue, and the surrounding 2 images
		console.log( "Requesting " + filePath );
		this._loadQueue.push( {
			path: filePath,
			resolve: resolve,
			reject: reject
		} );
		this._checkQueue();
	}

	
	loadImage( filePath ) {
		let that = this;
		return new Promise( ( resolve, reject ) => {
			that._loadImage( resolve, reject, filePath );
		} );
	}
}


export default new ImageCache();
