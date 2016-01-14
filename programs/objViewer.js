var gl;
var a_Position;
var a_Normal;
var a_Color;
var a_Texture;			// texture

var u_MvpMatrix;
var u_MvMatrix;			// lighting
var u_NormalMatrix;
var samplerUniform;		// texture

var kiaTexture;			// texture
var texFileName = "kia.jpg";	// texture
var program;
var samplerUniform;		// texture
var textureCoordAttribute;	// texture



// LIGHTING
var ambientColorUniform;
var lightPositionUniform;
var lightColorUniform;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // LIGHTING
    

    a_Position = gl.getAttribLocation(program, "a_Position");
    a_Normal = gl.getAttribLocation(program, "a_Normal");
    a_Color = gl.getAttribLocation(program, "a_Color");
    a_Texture = gl.getAttribLocation(program, "a_TextureCoord");

    u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
    u_MvMatrix = gl.getUniformLocation(program, "u_MvMatrix");
    u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
    samplerUniform = gl.getUniformLocation(program, "uSampler");

    if (a_Position < 0 ||  a_Normal < 0 || a_Color < 0 || a_Texture < 0 ||
        !u_MvpMatrix || !u_NormalMatrix || !u_MvMatrix) {
        console.log('Failed to get the location of attribute, uniform variables');
        return;
    }
    
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl);
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }
    
    // calculate view projection matrix
    var viewProjMatrix = mult(perspective(30.0, canvas.width/canvas.height, 1.0, 5000.0),
                              lookAt(vec3(0.0, 400.0, 200.0),
                                     vec3(0.0, 0.0, 0.0),
                                     vec3(0.0, 1.0, 0.0)));
    
    // Start reading the OBJ file
    readOBJFile('kia.obj', gl, model, 15, true);
    // vertex texture coordinates
    textureCoordAttribute = gl.getAttribLocation(program, "a_TextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    uniformSampler = gl.getUniformLocation(program, "uSampler");
    ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
    lightPositionUniform = gl.getUniformLocation(program, "uLightPosition");
    lightColorUniform = gl.getUniformLocation(program, "uLightColor");

    initTexture(gl);

    var currentAngle = 0.0; // Current rotation angle [degree]
    var tick = function() {   // Start drawing
        currentAngle = animate(currentAngle); // Update current rotation angle
        draw(gl, currentAngle, viewProjMatrix, model);
        requestAnimationFrame(tick, canvas);
    };
    tick();
    
};

// texture
function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE0); // enable the texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.uniform1i( samplerUniform, 0 ); // set the texture unit
}

//texture
function initTexture(gl) {
    kiaTexture = gl.createTexture();
    kiaTexture.image = new Image();	// create image object
    kiaTexture.image.onload = function () {
        handleLoadedTexture(kiaTexture)
    }
    kiaTexture.image.src = "kia.jpg";
}

// Create an buffer object and perform an initial configuration
function initVertexBuffers(gl) {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(gl, a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, a_Normal, 3, gl.FLOAT);
    o.textureBuffer = createEmptyArrayBuffer(gl, a_Texture, 2, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.textureBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
    
    return buffer;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
}

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

// Coordinate transformation matrix
var g_modelMatrix = mat4();
var g_mvpMatrix = mat4();
var g_normalMatrix = mat3();

// Drawing function
function draw(gl, angle, viewProjMatrix, model) {
    if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        g_objDoc = null;
    }
    if (!g_drawingInfo) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers
    

    //LIGHTING
    gl.uniform3f( ambientColorUniform,  0.2, 0.2, 0.2 );
    
    var lightPosition = [ 0.0, 200.0, 0.0 ];
    gl.uniform3fv(lightPositionUniform, lightPosition); // light position in the world space
        
    gl.uniform3f( lightColorUniform, 1.0, 1.0, 1.0 );




    g_modelMatrix = mult(rotateX(angle), mult(rotateY(angle), rotateZ(angle)));
    
    gl.uniformMatrix4fv(u_MvMatrix, false, flatten(g_modelMatrix)); 
    
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix = normalMatrix(g_modelMatrix, true); // return 3 by 3 normal matrix
    
    gl.uniformMatrix3fv(u_NormalMatrix, false, flatten(g_normalMatrix));
    
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix = mult(viewProjMatrix, g_modelMatrix);
    
    gl.uniformMatrix4fv(u_MvpMatrix, false, flatten(g_mvpMatrix));

    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.textures, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    
    return drawingInfo;
}

var ANGLE_STEP = 10;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}
