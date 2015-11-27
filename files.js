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
			resolve( {
				path: filePath,
				rotation: 0
			} );
		} );
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
}

