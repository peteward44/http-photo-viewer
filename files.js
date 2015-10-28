'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var ExifImage = require('exif').ExifImage;


export default class Files {
	constructor() {
		this._files = [];
	}
	
	
	_createFileObject( filePath ) {
		return new Promise( function( resolve, reject ) {
			let exif = new ExifImage( { image : filePath }, function(err, exifData) {
				if ( err ) {
					reject( err );
				} else {
					let result = {
						path: filePath,
						orientation: exifData.image.Orientation ? exifData.image.Orientation : 0
					};
					resolve( result );
				}
			} );
		} );
	}

	
	async init( rootFilePath ) {
		// analyse directory given to find all files there
		this._files.length = 0;
		let paths = walkSync( rootFilePath, { directories: false } );
		for ( let i=0; i<paths.length; ++i ) {
			let filePath = path.join( rootFilePath, paths[i] );
			let ext = path.extname( filePath ).toLowerCase();
			if ( ext === '.jpg' || ext === '.jpeg' ) {
				let obj = await this._createFileObject( filePath );
				this._files.push( obj );
			}
		}
	}
	
	
	getImage( index ) {
		return this._files[ index ];
	}
}

