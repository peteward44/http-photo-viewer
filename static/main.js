'use strict';

var viewport = $( "#viewport" );
var viewimg = $( "#viewimg" );
var canvas = viewimg[0];
var photoIndex = 0;
var rotation = 0;
var rotationChange = 0;
var photoImg = new Image();
var flipHorz = false;
var flipVert = false;


function render() {
	var sideways = ( rotation % 2 ) === 1;
	canvas.height = sideways ? photoImg.width : photoImg.height;
	canvas.width = sideways ? photoImg.height : photoImg.width;
	var ctx = canvas.getContext("2d");	
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	if ( flipHorz || flipVert ) {
		ctx.scale( flipHorz ? -1 : 1, flipVert ? -1 : 1 );
	}
	ctx.rotate( rotation * ( Math.PI / 2 ) );
	ctx.drawImage(photoImg, -photoImg.width/2, -photoImg.height/2);
	ctx.restore();
}


function setPhotoData( data ) {
	photoImg.onload = function() {
		rotation = 0;
		rotationChange = 0;
		flipHorz = false;
		flipVert = false;
		switch ( data.orientation ) {
			case 2:
				flipHorz = true;
				break;
			case 3: // upside down
				rotation = 2;
				break;
			case 4:
				rotation = 2;
				flipHorz = true;
				break;
			case 5:
				rotation = 3;  // 90* anticlockwise
				flipVert = true;
				break;
			case 6:
				rotation = 3;
				break;
			case 7:
				rotation = 1; // 90* clockwise - needs to be rotated 270* to correct
				flipVert = true;
				break;
			case 8:
				rotation = 1;
				break;
		}
		render();
	};
	photoImg.src = data.data;
}


function loadNextPhoto( next ) {
	var previousPhotoData;
	var nextIndex = 0;
	if ( next !== undefined ) {
		nextIndex = photoIndex + ( next ? 1 : -1 );
	}
	$.getJSON( '/next', { next: { index: nextIndex }, previous: { index: photoIndex, rotation: rotationChange } }, function( data ) {
		setPhotoData( data );
		photoIndex = nextIndex;
	} );
}


function set_body_height() { // set body height = window height
	viewport.height($(window).height());
}


function inc( base, diff ) {
	base += diff;
	if ( base > 3 ) {
		base = 0;
	}
	if ( base < 0 ) {
		base = 3;
	}
	return base;
}


function rotate( clockwise ) {
	var diff = clockwise ? 1 : -1;
	rotation = inc( rotation, diff );
	rotationChange = inc( rotationChange, diff );
	render();
}


function onKeyPress( evt ) {
	console.log( evt.which );
	switch ( evt.which ) {
		case 37: // left
			loadNextPhoto( false );
			break;
		case 39: // right
			loadNextPhoto( true );
			break;
		case 40: // down
			rotate( true );
			break;
		case 38: // up
			rotate( false );
			break;
	}
}


window.onload = function() {
	var win = $(window);
	win.bind('resize', set_body_height);
	win.keydown( onKeyPress );
	loadNextPhoto();
};

