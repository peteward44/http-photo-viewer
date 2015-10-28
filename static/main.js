'use strict';

var viewport = $( "#viewport" );
var viewimg = $( "#viewimg" );
var canvas = viewimg[0];
var photoIndex = -1;
var photoData;
var photoImg = new Image();


function onDataLoaded() {
	//ctx.drawImage(photoImg, -img.width/2, -img.height/2);
	canvas.width = photoImg.width;
	canvas.height = photoImg.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage( photoImg, 0, 0 );
}


function setPhotoData( data ) {
	photoData = data;
	photoImg.onload = onDataLoaded;
	photoImg.src = photoData;	
	//viewimg.attr( "src", data );
}


function loadNextPhoto() {
	var previousPhotoData;
	var nextIndex = photoIndex + 1;
	$.getJSON( '/next', { index: nextIndex, previous: { index: photoIndex, data: previousPhotoData } }, function( data ) {
		setPhotoData( data.data );
		photoIndex = nextIndex;
	} );
}


function set_body_height() { // set body height = window height
	viewport.height($(window).height());
}


function rotate( clockwise ) {

	canvas.height = img.width;
	canvas.width = img.height;
	var ctx = canvas.getContext("2d");	
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	ctx.rotate(90 * Math.PI / 180);
	ctx.drawImage(img, -img.width/2, -img.height/2);
	ctx.restore();
	
		// var canvas = document.createElement("canvas");
		// canvas.height = img.width;
		// canvas.width = img.height;
		// var ctx = canvas.getContext("2d");
		// ctx.translate(canvas.width/2, canvas.height/2);
		// //..check orientation data, this code assumes the case where its oriented 90 degrees off
		// ctx.rotate(90 * Math.PI / 180);
		// ctx.drawImage(img, -img.width/2, -img.height/2);
		// setPhotoData( canvas.toDataURL("image/jpeg") );
	
}


function onKeyPress( evt ) {
	console.log( evt.which );
	switch ( evt.which ) {
		case 37: // left
			loadNextPhoto();
			break;
		case 39: // right
			loadNextPhoto();
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

