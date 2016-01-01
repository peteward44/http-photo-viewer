'use strict';

require( 'babel/register' ) ({
		optional: ['es7.asyncFunctions']
	});

var main = require( './lib/main.js' );

var prom = main();
prom.then( function() {

} )
.catch( function( err ) {
	console.error( err );
} );
