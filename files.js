'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var piexifjs = require( 'piexifjs' );


export default class Files {
	constructor() {
		this._files = [];
	}
	
	
	_createFileObject( filePath ) {
		return new Promise( function( resolve, reject ) {
			let data = fs.readFileSync( filePath ).toString( 'binary' );
			let exif = piexifjs.load( data );
			resolve( {
				path: filePath,
				//exif: exif
				orientation: exif && exif[ "0th" ] && isFinite( exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] ) ? exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] : 0
			} );
		} );
	}
	
	
	updateOrientation( filePath, orientation ) {
		for ( let i=0; i<this._files.length; ++i ) {
			let f = this._files[i];
			if ( f.path === filePath ) {
				f.orientation = orientation;
				return;
			}
		}
	}

	
	async init( rootFilePath ) {
		// analyse directory given to find all files there
		this._files.length = 0;
		let paths = walkSync( rootFilePath, { directories: false } );
		for ( let i=0; i<paths.length; ++i ) {
			let filePath = path.join( rootFilePath, paths[i] );
			try {
				let ext = path.extname( filePath ).toLowerCase();
				if ( ext === '.jpg' || ext === '.jpeg' ) {
					let obj = await this._createFileObject( filePath );
					this._files.push( obj );
				}
			}
			catch ( err ) {
				console.error( "Couldn't process file '" + filePath + "'" );
				console.error( err );
			}
		}
	}
	
	
	getImage( index ) {
		if ( this._files.length > 0 ) {
			while ( index < 0 ) {
				index += this._files.length;
			}
			return this._files[ index % this._files.length ];
		}
		return null;
	}
	
	
	clientViewImage( index ) {
		// loads next X images for client view, so no waiting around
		
	}
}

