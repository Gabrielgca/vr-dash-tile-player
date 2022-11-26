
function update_center_viewport (){

        var scene = document.querySelector('a-scene');
        var camera = scene.camera;
        var sky_sphere = scene.children[1]; //sky_sphere
        var sphere_mesh = sky_sphere.object3DMap.mesh;

        if (camera && sphere_mesh){
                const newRaycaster= new THREE.Raycaster();
                const mouse=new THREE.Vector2(0,0);
        
                newRaycaster.setFromCamera(mouse, camera);
        
                let intersection=[];
        
                //get the head position using raycast from the sphere to the camera
                sphere_mesh.raycast(newRaycaster, intersection);
                
                if ( intersection.length > 0 ){
                        console.log(intersection);
                        var cvp_x_norm = intersection[0].uv.x;
                        var cvp_y_norm = intersection[0].uv.y;
        
                        //values from -180° through +180°
                        var cvp_x_degree = convert_normalized_to_degree(cvp_x_norm); 
                        var cvp_y_degree = convert_normalized_to_degree(cvp_y_norm);
        
        
                        //values from -PI through +PI
                        var cvp_x_radians = convert_normalized_to_radians(cvp_x_norm); 
                        var cvp_y_radians = convert_normalized_to_radians(cvp_y_norm);
        
        
                        // fulfill the sky object with the Head Movement data
                        sky_sphere["head_movement_degree"] = [cvp_x_degree, cvp_y_degree]; 
                        sky_sphere["head_movement_radians"] = [cvp_x_radians, cvp_y_radians];
        
                        return [cvp_x_radians, cvp_y_radians];
                }
        }
        
        return;
}


function get_visible_faces(cvp_x_radians, cvp_y_radians){


    var scene = document.querySelector('a-scene');
    var camera = scene.camera;
    var camera_reference = scene.children[2]; //camera_reference
    let faceStructureModified = camera_reference.faceStructure;
      
    var visibleObjects = [];

        if (camera && faceStructureModified)
        {
        camera.updateMatrix();
        camera.updateMatrixWorld();
        
        //Copy the actual camera to simulate rotations so that the original camera is not influenced
        var cameraAux = camera.clone();        

        var frustum = new THREE.Frustum();

        // Make a frustum to know what is in the camera vision
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  
        console.log("-----------------------------------------------------")
        let visible = false;
        // Uses the faceStructureModified value because it could have an edit on the playback
        for (var face in faceStructureModified) {
                for (var position = 0; position < faceStructureModified[face].length; position++){
                        //Check if the points mapped to the specific face in under the camera vision
                        if (frustum.containsPoint( faceStructureModified[face][position] )){
                                visibleObjects.push(face);
                                visible = true;
                                break;
                        }
                }
        }

        console.log("ACTUAL: ", visibleObjects);

        // Use quaternion to simulate the camera rotation
        // It was noticed that the camera object does not change its quaternion value after the render process.
        // With that in mind, the simulation is done by rotating the camera to the given center of the viewport
        // as if the camera was in the initial position.
        const quaternion_x = new THREE.Quaternion();
        const quaternion_y = new THREE.Quaternion();

        console.log("cvp_x_radians ", cvp_x_radians, "cvp_y_radians ", cvp_y_radians)
        // Multiply by -1 because the quaternion rotation reference is the oposite from the one received from the update_center_viewport() function
        quaternion_x.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), -1*cvp_x_radians );

        // Divide the Y center of the viewport because it goes from -PI to +PI and the rotation goes from -PI/2 to +PI/2 in this axis
        quaternion_y.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), cvp_y_radians/2 );
        
        //Just to make sure that its start from the initial position
        cameraAux.quaternion = new THREE.Quaternion(0, 0, 0, 1);
        cameraAux.quaternion.multiply(quaternion_x).multiply(quaternion_y);

        cameraAux.updateMatrix();
        cameraAux.updateMatrixWorld();


        // Make a new frustum to know what is in the camera vision simulation
        var frustum2 = new THREE.Frustum();

        frustum2.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cameraAux.projectionMatrix, cameraAux.matrixWorldInverse));  
        visible = false;

        visibleObjects = [];

        //Uses the faceStructure object because the value is not updaded on the render
        for (var face in faceStructure) {
                for (var position = 0; position < faceStructure[face].length; position++){

                        if (frustum2.containsPoint( faceStructure[face][position] )){
                                visibleObjects.push(face);
                                visible = true;
                                break;
                        }
                }
        }

        console.log("PREDICTED: ", visibleObjects);
        
        }
        return visibleObjects;
}

/* This variable map the 3D position of some relevants vectors that make up the specific face
   Imagine a face in te 3D space, the variable maps the following points marked with '+', hence 9 in total:
                                +---------+---------+
                                |         |         |
                                |         |         |
                                |         |         |
                                +---------+---------+
                                |         |         |
                                |         |         |
                                |         |         |
                                +---------+---------+
   With the information of how many points of a face is in the camera vision, one can have an estimation
   of how much of that face is visible (percentage)                 

*/
var faceStructure = {
    ent_video_0: [  new THREE.Vector3( 240,  240, -240),   new THREE.Vector3(240,  240,    0),
            new THREE.Vector3( 240,  240,  240),   new THREE.Vector3(240,    0,  240),
            new THREE.Vector3( 240, -240,  240),   new THREE.Vector3(240, -240,    0),
            new THREE.Vector3( 240, -240, -240),   new THREE.Vector3(240,    0, -240),
            new THREE.Vector3( 240 ,   0,   0)],
            
   
    ent_video_1: [  new THREE.Vector3(-240,  240, -240),   new THREE.Vector3(-240,  240,    0),
            new THREE.Vector3(-240,  240,  240),   new THREE.Vector3(-240,    0,  240),
            new THREE.Vector3(-240, -240,  240),   new THREE.Vector3(-240, -240,    0),
            new THREE.Vector3(-240, -240, -240),   new THREE.Vector3(-240,    0, -240),
            new THREE.Vector3(-240 ,   0,   0)],
   
    ent_video_2: [  new THREE.Vector3(-240,  240, -240),   new THREE.Vector3(   0,    240, -240),
            new THREE.Vector3( 240,  240, -240),   new THREE.Vector3( 240,    240,    0),
            new THREE.Vector3( 240,  240,  240),   new THREE.Vector3(   0,    240,  240),
            new THREE.Vector3(-240,  240,  240),   new THREE.Vector3(-240,    240,    0),
            new THREE.Vector3(   0, 240,   0)],
   
    ent_video_3: [  new THREE.Vector3(-240,  -240, -240),  new THREE.Vector3(   0,   -240, -240),
            new THREE.Vector3( 240,  -240, -240),  new THREE.Vector3( 240,   -240,    0),
            new THREE.Vector3( 240,  -240,  240),  new THREE.Vector3(   0,   -240,  240),
            new THREE.Vector3(-240,  -240,  240),  new THREE.Vector3(-240,   -240,    0),
            new THREE.Vector3(   0,  -240,   0)],
  
    ent_video_4: [  new THREE.Vector3(-240,  240, -240),   new THREE.Vector3(   0,   240,  -240),
            new THREE.Vector3( 240,  240, -240),   new THREE.Vector3( 240,     0,  -240),
            new THREE.Vector3( 240, -240, -240),   new THREE.Vector3(   0,  -240,  -240),
            new THREE.Vector3(-240, -240, -240),   new THREE.Vector3(-240,     0,  -240),
            new THREE.Vector3(   0,    0, -240)],
   
    ent_video_5: [  new THREE.Vector3(-240,  240, 240),    new THREE.Vector3(   0,   240,   240),
            new THREE.Vector3( 240,  240, 240),    new THREE.Vector3( 240,     0,   240),
            new THREE.Vector3( 240, -240, 240),    new THREE.Vector3(   0,  -240,   240),
            new THREE.Vector3(-240, -240, 240),    new THREE.Vector3(-240,     0,   240),
            new THREE.Vector3(   0,    0, 240)],
  }