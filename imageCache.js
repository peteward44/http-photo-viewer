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
			if ( isFinite( loadRequest.rotation ) ) {
				this._images[ loadRequest.path ] = convertImage.rotateExif( this._images[ loadRequest.path ], loadRequest.rotation );
			}
			loadRequest.resolve( this._images[ loadRequest.path ] );
			this._loading = false;
			return;
		}
		
		console.log( "Loading " + loadRequest.path );
		convertImage.clientView( loadRequest.path, { /*noConvert: true*/ }, function( err, str ) {
			if ( !err ) {
				that._images[ loadRequest.path ] = convertImage.rotateExif( str, loadRequest.rotation );
				loadRequest.resolve( that._images[ loadRequest.path ] );
			} else {
				loadRequest.reject( err );
			}
			that._loading = false;
			setImmediate( () => { that._checkQueue(); } );
		} );
	}
	
	
	_loadImage( resolve, reject, filePath, rotation ) {
		// add to the load queue, and the surrounding 2 images
		console.log( "Requesting " + filePath );
		this._loadQueue.push( {
			path: filePath,
			rotation: rotation,
			resolve: resolve,
			reject: reject
		} );
		this._checkQueue();
	}

	
	loadImage( filePath, rotation ) {
		let that = this;
		return new Promise( ( resolve, reject ) => {
			that._loadImage( resolve, reject, filePath, rotation );
		} );
	}
}


export default new ImageCache();
