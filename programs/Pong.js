var canvas;
var gl;

var xvel = Math.random()/75;
var yvel = Math.random()/75;
var offset;
var offsetLoc;
var ballx = 0.0;
var bally = 0.0;
var paddlex = 0.0;

var vertices;
var pi = Math.PI;
var bounceCount = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vertices = [
		vec2(0.0, 0.95),
		vec2(0.0 + 0.05*Math.cos(0),  0.95 + 0.05*Math.sin(0)),
		vec2(0.0 + 0.05*Math.cos(pi/6),  0.95 + 0.05*Math.sin(pi/6)),
		vec2(0.0 + 0.05*Math.cos(2*pi/6),  0.95 + 0.05*Math.sin(2*pi/6)),
		vec2(0.0 + 0.05*Math.cos(3*pi/6),  0.95 + 0.05*Math.sin(3*pi/6)),
		vec2(0.0 + 0.05*Math.cos(4*pi/6),  0.95 + 0.05*Math.sin(4*pi/6)),
		vec2(0.0 + 0.05*Math.cos(5*pi/6),  0.95 + 0.05*Math.sin(5*pi/6)),
		vec2(0.0 + 0.05*Math.cos(6*pi/6),  0.95 + 0.05*Math.sin(6*pi/6)),
		vec2(0.0 + 0.05*Math.cos(7*pi/6),  0.95 + 0.05*Math.sin(7*pi/6)),
		vec2(0.0 + 0.05*Math.cos(8*pi/6),  0.95 + 0.05*Math.sin(8*pi/6)),
		vec2(0.0 + 0.05*Math.cos(9*pi/6),  0.95 + 0.05*Math.sin(9*pi/6)),
		vec2(0.0 + 0.05*Math.cos(10*pi/6), 0.95 + 0.05*Math.sin(10*pi/6)),
		vec2(0.0 + 0.05*Math.cos(11*pi/6), 0.95 + 0.05*Math.sin(11*pi/6)),
		vec2(0.0 + 0.05*Math.cos(0), 0.95 + 0.05*Math.sin(0)),
		vec2(0.2, 0.03),	// paddle starts here
		vec2(-0.2, 0.03),
		vec2(0.2, 0.0),
		vec2(-0.2, 0.0)
    ];

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    offsetLoc = gl.getUniformLocation( program, "offset" );

    // buttons
    document.getElementById("Left").onclick = function () {
        paddlex = paddlex - 0.1;
	if (paddlex<-0.8) {
		paddlex = -0.8
	}
    };
    document.getElementById("Right").onclick = function () {
        paddlex = paddlex + 0.1;
	if (paddlex>0.8) {
		paddlex = 0.8
	}
    };
    document.getElementById("Faster").onclick = function () {
        xvel = xvel*1.05;
	yvel = yvel*1.05;
    };
    document.getElementById("Slower").onclick = function () {
        xvel = xvel*0.95;
	yvel = yvel*0.95;
    };

    colorLoc = gl.getUniformLocation( program, "color" );
    render();
};

function render() {
    loop = 1;
    gl.clear( gl.COLOR_BUFFER_BIT );
    if (ballx<-0.95 || ballx>0.95) {			// wall bounce
	xvel = -1*xvel;
    }
    else if (bally<-1.88 || bally>0.0) {
	yvel = -1*yvel;
	if (bally<-1.88 && (ballx>paddlex+0.2 || ballx<paddlex-0.2)) {		// paddle misses, game over
		loop = 0;
	}
	else if (bally<-1.88) {
		bounceCount++;
	}
    }
    else {}
	var countString = document.getElementById("bounceCnt");
	countString.innerHTML = "Bounce Count: " + bounceCount;

    ballx = ballx + xvel;
    bally = bally + yvel;
    offset = vec2(ballx, bally);
    gl.uniform2fv(offsetLoc, offset);
    gl.uniform4fv( colorLoc, vec4(0.0, 1.0, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 14 );		// draw ball

    offset = vec2(paddlex, -1.0);
    gl.uniform2fv(offsetLoc, offset);
    gl.uniform4fv( colorLoc, vec4(0.8, 0.0, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLE_STRIP, 14, 4);		// draw paddle
    if (loop) {
	window.requestAnimFrame(render);			// animate
    }
    else {
	alert("Game over. \nScore: " + bounceCount);
    }
}
