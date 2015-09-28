var gl;
var vertices;
var offsetM;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    vertices = [
// K
        vec2( -0.6, -0.1 ),
        vec2(  -0.6,  0.4 ),
        vec2(  -0.1, 0.4 ),
        vec2( -0.6, 0.1 ),
        vec2(  -0.6,  -0.4 ),
        vec2(  -0.1, -0.4 ),
// negative space
        vec2( -0.52, 0.1 ),
        vec2(  -0.52,  0.4 ),
        vec2(  -0.2, 0.4 ),
        vec2( -0.52, -0.1 ),
        vec2(  -0.52,  -0.4 ),
        vec2(  -0.2, -0.4 )];

offsetM=vertices.length;
// M
        vertices.push(vec2( 0.1, -0.4 ));
        vertices.push(vec2(  0.1,  0.4 ));
        vertices.push(vec2(  0.6, -0.4 ));
        vertices.push(vec2( 0.6, 0.4 ));
// negative space
        vertices.push(vec2( 0.2, -0.4 ));
        vertices.push(vec2(  0.2,  0.1 ));
        vertices.push(vec2(  0.5, -0.4 ));
        vertices.push(vec2( 0.5, 0.1 ));

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "color" );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
	// K
    gl.uniform4fv( colorLoc, vec4(0.5, 0.0, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLES, 0, 3 );
    gl.drawArrays( gl.TRIANGLES, 3, 3 );
	// Whitespace
    gl.uniform4fv( colorLoc, vec4(0.8, 0.8, 0.8, 1.0));
    gl.drawArrays( gl.TRIANGLES, 6, 3 );
    gl.drawArrays( gl.TRIANGLES, 9, 3 );
	// M
    gl.uniform4fv( colorLoc, vec4(0.0, 0.7, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, offsetM, 4 );
	// Whitespace
    gl.uniform4fv( colorLoc, vec4(0.8, 0.8, 0.8, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, offsetM+4, 4 );
}
