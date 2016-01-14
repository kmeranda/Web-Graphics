"use strict";

var canvas;
var gl;

var program;
var vPosition;

var vCurvePointBuffer; // sample points on the B-spline curve
var points = []; // store sample points that approximate the B-spline curve

var vControlVertexBuffer; // user-specified control vertices
var vertices = []; // store user-specified control vertices

var cindex; // color index for control vertex, control line, and b-spline curve
var idx = -1; // the index of the control vertex to be dragged

var step = 30; // so we store 30 sample points for b-spline curve between any two control vertices
var numPoints = 0;
var maxNumPoints = 10000;



window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvas.addEventListener("mousedown", function(event) {
        var mousePos = vec2(2*(event.clientX - event.target.getBoundingClientRect().left)/canvas.width - 1,
                            2*(canvas.height - (event.clientY - event.target.getBoundingClientRect().top))/canvas.height - 1);

        if (document.getElementById("add").checked == true) { // add control vertices
            numPoints++;
            vertices.push(mousePos);
            // send new control vertex to buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, vControlVertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(numPoints-1), flatten(mousePos));
            if (numPoints >= 4) { // drawing a b-spline curve needs at least four control vertices
                // generate all the sample points for the b-spline curve according to all control vertices placed so far
                generateBSplinePoints();
                // send new calculated curves to buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, vCurvePointBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
            }
        }
        else { 	// drag control vertex selected
            // get the index of the control vertex to be dragged
            idx = -1;
	    for (var i=0; i<vertices.length; ++i) {
		// 5e-2 is the threshold to get the index of control vertex to be dragged
		if (Math.abs(mousePos[0]-vertices[i][0])<5e-2 && Math.abs(mousePos[1]-vertices[i][1])<5e-2) {
		    idx = i;
		    break;
		}
	    }
        }
    });

    canvas.addEventListener("mousemove", function(event) {
        // update the position of the dragged control vertex
        if (idx != -1 && document.getElementById("drag").checked == true) {
	    // get mouse position
	    var pos = vec2(2*(event.clientX - event.target.getBoundingClientRect().left)/canvas.width - 1, 2*(canvas.height - (event.clientY - event.target.getBoundingClientRect().top))/canvas.height - 1);
	    vertices[idx] = pos; // update the position of the dragged control vertex
            // send updated vertex to buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, vControlVertexBuffer);
	    gl.bufferSubData(gl.ARRAY_BUFFER, 8*idx, new Float32Array(pos));
	    // while a control vertex is being dragged, generate all the sample points for the b-spline curve according to all control vertices placed so far, send sample point data to the GPU
	    generateBSplinePoints();
	    gl.bindBuffer(gl.ARRAY_BUFFER, vCurvePointBuffer);
	    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
	}
    });
    
    canvas.addEventListener("mouseup", function(event) {
        // reset the index of the control vertex to be dragged to a dummy value
        idx = -1;
    });

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 0.95, 0.95, 1.0 );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    vCurvePointBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vCurvePointBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumPoints, gl.STATIC_DRAW );

    vControlVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vControlVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumPoints, gl.STATIC_DRAW );
    
    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cindex = gl.getUniformLocation(program,"cindex");

    render();
};

// non-uniform cubic b-spline, to draw b-spline curve that starts from
// the first control vertex to the last control vertex, we need to
// generate multiple b-spline curve segments
function computeBSplinePoint(t, p0, p1, p2, p3) {
    // polynomial cubic b-spline equation
    var point = (Math.pow(1-t, 3) * p0/6) +
		((4-6*Math.pow(t,2)+3*Math.pow(t,3)) * p1/6) +
		((1+3*t+3*Math.pow(t,2)-3*Math.pow(t,3))* p2/6) +
		(Math.pow(t, 3) * p3/6);
    return point;
}

function generateBSplinePoints() {
    // reinitialize points
    points.length = 0;
    // start
    for (var j=0; j<2; j++) {
        for (var i=0; i<=step; ++i) {	
	    var tmp = i/(step-1.0);
	    var x = computeBSplinePoint(tmp, vertices[0][0], vertices[0][0], vertices[j][0], vertices[j+1][0]);
	    var y = computeBSplinePoint(tmp, vertices[0][1], vertices[0][1], vertices[j][1], vertices[j+1][1]);
	    var result = vec2(x, y);
	    points.push(result);
        }
    }
    // middle
    for (var j=0; j<=numPoints-4; ++j) {
	var start = vertices[j];
	var c1 = vertices[j+1];
	var c2 = vertices[j+2];
	var end = vertices[j+3];
    	for (var i=0; i<=step; ++i) {
	    var tmp = i/(step-1.0);
	    var x = computeBSplinePoint(tmp, start[0], c1[0], c2[0], end[0]);
	    var y = computeBSplinePoint(tmp, start[1], c1[1], c2[1], end[1]);
	    var result = vec2(x, y);
	    points.push(result);
    	}
    }
    // end
    var len = vertices.length-1;
    for (var i=0; i<=step; ++i) {
	var tmp = i/(step-1.0);
	var x = computeBSplinePoint(tmp, vertices[len-2][0], vertices[len-1][0], vertices[len][0], vertices[len][0]);
	var y = computeBSplinePoint(tmp, vertices[len-2][1], vertices[len-1][1], vertices[len][1], vertices[len][1]);
	var result = vec2(x, y);
	points.push(result);
    }
    for (var i=0; i<=step; ++i) {
	var tmp = i/(step-1.0);
	var x = computeBSplinePoint(tmp, vertices[len-1][0], vertices[len][0], vertices[len][0], vertices[len][0]);
	var y = computeBSplinePoint(tmp, vertices[len-1][1], vertices[len][1], vertices[len][1], vertices[len][1]);
	var result = vec2(x, y);
	points.push(result);
    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // draw b-spline curve
    gl.bindBuffer( gl.ARRAY_BUFFER, vCurvePointBuffer );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform1i(cindex, 0);
    gl.lineWidth(5.0);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length);

    // draw control vertices
    gl.bindBuffer( gl.ARRAY_BUFFER, vControlVertexBuffer);
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform1i(cindex, 1);
    gl.drawArrays(gl.POINTS, 0, vertices.length);
    
    // draw lines connecting control vertices
    gl.uniform1i(cindex, 2);
    gl.lineWidth(2.0);
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length);
    
    window.requestAnimFrame(render);    
}
