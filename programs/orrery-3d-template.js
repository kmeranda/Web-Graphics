var gl;
var bufferId;
var day = 0;
var dayOffset = 1;
var mspf = 1000/30;
var g_last = Date.now();
var pi = Math.PI;
var orbitPath;

var mvpMatrix; // projectMatrix * modelViewMatrix
var projectionMatrix; // projection matrix
var stack = []; // matrix stack, for pushing and popping

var positionLoc;
var colorLoc;
var mvpMatrixLoc;

// scale factors
var rSunMult = 30;      // keep sun's size manageable
var rPlanetMult = 1200;  // scale planet sizes to be more visible

// colors
var colorSun = vec3(1.0,1.0,0.0);
var colorMercury = vec3(1.0,0.0,0.0);
var colorVenus = vec3(0.3,1.0,0.3);
var colorEarth = vec3(0.0,0.0,1.0);
var colorMoon = vec3(1.0,1.0,1.0);

// surface radii (km)
var rSun = 696000;
var rMercury = 2440;
var rVenus = 6052;
var rEarth = 6371;
var rMoon = 1737;

// orbital radii (km)
var orMercury = 57909050;
var orVenus = 108208000;
var orEarth = 149598261;
var orMoon = 384399;

// orbital periods (Earth days)
var pMercury = 88;
var pVenus = 225;
var pEarth = 365;
var pMoon = 27;

var projectionScale;

var sphereVertexPositionData = [];
var sphereVertexIndexData = [];

var sphereVertexPositionBuffer;
var sphereVertexIndexBuffer;

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.85, 0.85, 0.85, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    // projection matrix
    projectionScale = 1.0 / ( orEarth + orMoon
                             + ( rEarth + 2 * rMoon ) * rPlanetMult );
    
    // standard orthogonal projection matrix * uniform scaling matrix
    projectionMatrix = mult(scalem(projectionScale,projectionScale,projectionScale), rotateX(30));	// rotate orrery 30 degrees
    projectionMatrix = mult(projectionMatrix, ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0))

    setupSphere();
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    orbitPath = [
		vec3(Math.cos(0), 0.0, Math.sin(0)),
		vec3(Math.cos(pi/24), 0.0, Math.sin(pi/24)),
		vec3(Math.cos(2*pi/24), 0.0, Math.sin(2*pi/24)),
		vec3(Math.cos(3*pi/24), 0.0, Math.sin(3*pi/24)),
		vec3(Math.cos(4*pi/24), 0.0, Math.sin(4*pi/24)),
		vec3(Math.cos(5*pi/24), 0.0, Math.sin(5*pi/24)),
		vec3(Math.cos(6*pi/24), 0.0, Math.sin(6*pi/24)),
		vec3(Math.cos(7*pi/24), 0.0, Math.sin(7*pi/24)),
		vec3(Math.cos(8*pi/24), 0.0, Math.sin(8*pi/24)),
		vec3(Math.cos(9*pi/24), 0.0, Math.sin(9*pi/24)),
		vec3(Math.cos(10*pi/24), 0.0, Math.sin(10*pi/24)),
		vec3(Math.cos(11*pi/24), 0.0, Math.sin(11*pi/24)),
		vec3(Math.cos(12*pi/24), 0.0, Math.sin(12*pi/24)),
		vec3(Math.cos(13*pi/24), 0.0, Math.sin(13*pi/24)),
		vec3(Math.cos(14*pi/24), 0.0, Math.sin(14*pi/24)),
		vec3(Math.cos(15*pi/24), 0.0, Math.sin(15*pi/24)),
		vec3(Math.cos(16*pi/24), 0.0, Math.sin(16*pi/24)),
		vec3(Math.cos(17*pi/24), 0.0, Math.sin(17*pi/24)),
		vec3(Math.cos(18*pi/24), 0.0, Math.sin(18*pi/24)),
		vec3(Math.cos(19*pi/24), 0.0, Math.sin(19*pi/24)),
		vec3(Math.cos(20*pi/24), 0.0, Math.sin(20*pi/24)),
		vec3(Math.cos(21*pi/24), 0.0, Math.sin(21*pi/24)),
		vec3(Math.cos(22*pi/24), 0.0, Math.sin(22*pi/24)),
		vec3(Math.cos(23*pi/24), 0.0, Math.sin(23*pi/24)),
		vec3(Math.cos(24*pi/24), 0.0, Math.sin(24*pi/24)),
		vec3(Math.cos(25*pi/24), 0.0, Math.sin(25*pi/24)),
		vec3(Math.cos(26*pi/24), 0.0, Math.sin(26*pi/24)),
		vec3(Math.cos(27*pi/24), 0.0, Math.sin(27*pi/24)),
		vec3(Math.cos(28*pi/24), 0.0, Math.sin(28*pi/24)),
		vec3(Math.cos(29*pi/24), 0.0, Math.sin(29*pi/24)),
		vec3(Math.cos(30*pi/24), 0.0, Math.sin(30*pi/24)),
		vec3(Math.cos(31*pi/24), 0.0, Math.sin(31*pi/24)),
		vec3(Math.cos(32*pi/24), 0.0, Math.sin(32*pi/24)),
		vec3(Math.cos(33*pi/24), 0.0, Math.sin(33*pi/24)),
		vec3(Math.cos(34*pi/24), 0.0, Math.sin(34*pi/24)),
		vec3(Math.cos(35*pi/24), 0.0, Math.sin(35*pi/24)),
		vec3(Math.cos(36*pi/24), 0.0, Math.sin(36*pi/24)),
		vec3(Math.cos(37*pi/24), 0.0, Math.sin(37*pi/24)),
		vec3(Math.cos(38*pi/24), 0.0, Math.sin(38*pi/24)),
		vec3(Math.cos(39*pi/24), 0.0, Math.sin(39*pi/24)),
		vec3(Math.cos(40*pi/24), 0.0, Math.sin(40*pi/24)),
		vec3(Math.cos(41*pi/24), 0.0, Math.sin(41*pi/24)),
		vec3(Math.cos(42*pi/24), 0.0, Math.sin(42*pi/24)),
		vec3(Math.cos(43*pi/24), 0.0, Math.sin(43*pi/24)),
		vec3(Math.cos(44*pi/24), 0.0, Math.sin(44*pi/24)),
		vec3(Math.cos(45*pi/24), 0.0, Math.sin(45*pi/24)),
		vec3(Math.cos(46*pi/24), 0.0, Math.sin(46*pi/24)),
		vec3(Math.cos(47*pi/24), 0.0, Math.sin(47*pi/24)),
		vec3(Math.cos(0), 0.0, Math.sin(0))
    ];

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(orbitPath), gl.STATIC_DRAW );

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexPositionData), gl.STATIC_DRAW);
    
    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereVertexIndexData), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    
    positionLoc = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( positionLoc );

    colorLoc = gl.getUniformLocation( program, "vColor" );

    mvpMatrixLoc = gl.getUniformLocation( program, "mvpMatrix" );

    render();
    
};

// increase button functionality
function incDPF() {
	dayOffset *= 2;
}

// decrease button functionality
function decDPF() {
	dayOffset /= 2;
}

function countDay() {		// update text showing number of days elapsed
    var text = document.getElementById("dayCount");
    if ((document.getElementById("dayoff").checked)) {
	text.innerHTML = "";
    }
    else {
	text.innerHTML = "Day " + day;
    }
}

function setupSphere() {
    var latitudeBands = 15;
    var longitudeBands = 15;
    var radius = 1.0;
    
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * pi / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * pi / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            
            sphereVertexPositionData.push(radius * x);
            sphereVertexPositionData.push(radius * y);
            sphereVertexPositionData.push(radius * z);
        }
    }
    
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            sphereVertexIndexData.push(first);
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(first + 1);
            
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(second + 1);
            sphereVertexIndexData.push(first + 1);
        }
    }
};

function drawSphere(color, size) {
    // set uniforms
    gl.uniform3fv( colorLoc, color );
    
    // get the matrix at the top of stack
    var topm = stack[stack.length-1];
    mvpMatrix = mult(topm, scalem(size, size, size));
    mvpMatrix = mult(projectionMatrix, mvpMatrix);
    gl.uniformMatrix4fv(mvpMatrixLoc, false, flatten(mvpMatrix) );
    
    // draw the sphere
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexData.length, gl.UNSIGNED_SHORT, 0);
    
    // draw wireframe for testing
    //gl.uniform3fv( colorLoc, vec3(0.5, 0.5, 0.5) );
    //gl.drawArrays( gl.LINE_STRIP, 0, sphereVertexPositionData.length/3 );
};

function drawBodies() { 
    var size;
    // Sun
    size = rSun * rSunMult;
    stack.push(mat4());
    drawSphere( colorSun, size );
    stack.pop();

    // Mercury
    size = rMercury * rPlanetMult;
    var merc = mult(mat4(),translate(orMercury*Math.cos(-day*2*pi/pMercury),0,orMercury*Math.sin(-day*2*pi/pMercury)));
    stack.push(merc);
    drawSphere( colorMercury, size );
    stack.pop();

    // Venus
    size = rVenus * rPlanetMult;
    var venus = mult(mat4(),translate(orVenus*Math.cos(-day*2*pi/pVenus),0,orVenus*Math.sin(-day*2*pi/pVenus)));
    stack.push(venus);
    drawSphere( colorVenus, size );
    stack.pop();

    // Earth
    var earth = mult(mat4(),translate(orEarth*Math.cos(-day*2*pi/pEarth),0,orEarth*Math.sin(-day*2*pi/pEarth)));
    stack.push(earth);
    	// Moon
    	size = rMoon * rPlanetMult;
    	var moon = mult(earth,translate((orMoon+rEarth)*rSunMult*Math.cos(-day*2*pi/pMoon),0,(orMoon+rEarth)*rSunMult*Math.sin(-day*2*pi/pMoon)));
    	stack.push(moon);
    	drawSphere( colorMoon, size );
    	stack.pop();
    size = rEarth * rPlanetMult;
    drawSphere( colorEarth, size );
    stack.pop();

};

function drawCircle(size) {	// similar to drawSphere function provided
    // set uniforms
    gl.uniform3fv( colorLoc, vec3(0.0, 0.0, 0.0) );
    
    // get the matrix at the top of stack
    var topm = stack[stack.length-1];
    mvpMatrix = mult(topm, scalem(size, size, size));
    mvpMatrix = mult(projectionMatrix, mvpMatrix);
    gl.uniformMatrix4fv(mvpMatrixLoc, false, flatten(mvpMatrix) );
    
    // draw the sphere
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, 49);
};

function drawOrbits() {
    // Mercury orbit
    stack.push(mat4());
    drawCircle(orMercury);
    stack.pop();

    // Venus orbit
    stack.push(mat4());
    drawCircle(orVenus);
    stack.pop();

    // Earth orbit
    stack.push(mat4());
	// Moon orbit
	stack.push(mult(mat4(),translate(orEarth*Math.cos(-day*2*pi/pEarth),0,orEarth*Math.sin(-day*2*pi/pEarth))));
    	drawCircle((orMoon+rEarth)*rSunMult);
    	stack.pop();
    drawCircle(orEarth);
    stack.pop();
};

function drawAll() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    if (!(document.getElementById("orbitoff").checked)) {	// orbit display radio button functionality
	drawOrbits();
    }
    drawBodies();	// draw planets
    
};

function render() {
    var now = Date.now();		// get current time
    var elapsed = now - g_last;		// get elapsed time
    if (!(document.getElementById("animateoff").checked)) {	// animate radio button functionality
    	if (elapsed > mspf) {		// set fps to 30
	    day += dayOffset;
    	    g_last = now;		// set past time to new past time
    	}
    }
    countDay();		// update text of # of days and implement day radio button functionality
    drawAll();
    requestAnimationFrame(render, canvas);
};
