// Dynamic Edit with SnapCut and Fade Rotation

const INSTANT_EDIT = "instant";
const GRADUAL_EDIT = "gradual";

const EDIT_TIME = 2.5; //seconds
const FADE_TIME = 1; //seconds after edit started
const ROTATION_SPEED = 0.005; //radians per 10 miliseconds
const OPACITY_THRESHOLD = 0.95; // opacity that will start the snapcut on the fade rotation edit
const ENABLE_EDIT = true;



var sphere_reference, camera_reference;
var doIt = true;
var doFade = true;

var enableRotation = true;
var enableFade = true;
var fadeStarted = false;
var isSnapCutEnabled = true;
var dist_nearest_roi_gradual;
var direction;
var isRotating = false;
var editEditInfoJSON;
let next_edit = 0;
let CvpXRadians, CvpYRadians;
let last_frame_with_edit = 0;
    
function dynamicEditClass () {
        
    if (ENABLE_EDIT){
        [sphere_reference, camera_reference ] = getIframeEntities('frame');


    
        var appElement = document.querySelector('[ng-controller=DashController]');
        var $scope = angular.element(appElement).scope();
        editEditInfoJSON = $scope.contents.edits.edit;

        if ( $scope.frameNumber == 0) {
            $scope.frameNumber = camera_reference.videoFrames["video_0"];
        }


        var currentFrame = $scope.frameNumber.get();
        var currentTime = $scope.normalizedTime;
        var frameRate = $scope.videoFrameRate;
        var normCurrentTime = Math.ceil(currentTime);
        ////console.log("FROM DYNAMIC EDIT")
        let CvpDegree = sphere_reference["head_movement_degree"];
        let CvpRadians = sphere_reference["head_movement_radians"];

        let hasEditScheduledValue = false;
        let editHappenedValue = false;
        let radiansRotationValue = 0;
        let editTypeValue = "null";

        if (CvpRadians != undefined){
    
            // Only use the X axis for the edit
            CvpXRadians = CvpRadians[0];
    
            let sphereOpacity = sphere_reference.object3DMap.mesh.material.opacity;
            
            ////console.log(CvpRadians);
            //Fade Effect Showcase
            if (editEditInfoJSON[next_edit] && editEditInfoJSON[next_edit]["type"] == GRADUAL_EDIT){
                
                let currentFrameEdit = editEditInfoJSON[next_edit] ? editEditInfoJSON[next_edit]["frame"] : 0;
                let frameStartGradualRotation = Math.ceil(currentFrameEdit - (EDIT_TIME * 2 * frameRate));
                let frameStopGradualRotation = Math.ceil(currentFrameEdit + (EDIT_TIME * 2 * frameRate));
    
                let frameStartFade = Math.ceil(frameStopGradualRotation - ((EDIT_TIME + FADE_TIME)* 2 * frameRate));
                
                
                if (currentFrame >= frameStartGradualRotation  && enableRotation ){
                    console.log("START ROTATION");
                    
                    console.log("🚀 ~ file: dynamicEdit.js:85 ~ dynamicEditClass ~ frameStartGradualRotation", frameStartGradualRotation);
                    console.log("🚀 ~ file: dynamicEdit.js:85 ~ dynamicEditClass ~ currentFrame", currentFrame);
                    [dist_nearest_roi_gradual, direction,] = getNearestRegionOfInterest(CvpXRadians);
                    
                    // if the RoI is under 30° from the current center of the viewport, it is not needed to do an edit
                    if (dist_nearest_roi_gradual >= 0.5235){
                        isRotating = true;
                    }

                    enableRotation = false;
                }

    
                if (currentFrame >= frameStartFade && enableFade){
                    console.log("START FADE");
                    sphere_reference.emit('fadeEffect');
                    enableFade = false;
                    fadeStarted = true;
                }

                //console.log(sphereOpacity, doIt);
                if (sphereOpacity >= OPACITY_THRESHOLD && fadeStarted && doIt){
                    console.log("START SNAPCUT");
                    doIt = false;
                    let snapCutRotation = handleSnapCut(CvpXRadians);

                    if (snapCutRotation != undefined){
                        radiansRotationValue = snapCutRotation;
                        editHappenedValue = true;
                    }
                }
    
                if (isRotating){
                    editTypeValue = GRADUAL_EDIT;
                    hasEditScheduledValue = true;

                    const quaternion = new THREE.Quaternion();
                    

                    if (direction > 0)
                    {
                        //console.log("positive")
                        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), ROTATION_SPEED );
                        camera_reference.object3D.quaternion.multiply(quaternion);
                        sphere_reference.object3D.quaternion.multiply(quaternion);

                        const quaternionFace = new THREE.Quaternion();
                        quaternionFace.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), ROTATION_SPEED );
                
                        for (var face in camera_reference.faceStructure) {
                            for (var position = 0; position < camera_reference.faceStructure[face].length; position++){
                                camera_reference.faceStructure[face][position].applyQuaternion(quaternionFace);
                                
                            }
                        }
                        // camera_reference.object3D.rotation.y += ROTATION_SPEED;
                        // sphere_reference.object3D.rotation.y += ROTATION_SPEED;
                    }
                    else {
                        //console.log("negative")
                        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),-1*ROTATION_SPEED );
                        camera_reference.object3D.quaternion.multiply(quaternion);
                        sphere_reference.object3D.quaternion.multiply(quaternion);

                        const quaternionFace = new THREE.Quaternion();
                        quaternionFace.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), -1*ROTATION_SPEED );
                
                        for (var face in camera_reference.faceStructure) {
                            for (var position = 0; position < camera_reference.faceStructure[face].length; position++){
                                camera_reference.faceStructure[face][position].applyQuaternion(quaternionFace);
                                
                            }
                        }
                        // camera_reference.object3D.rotation.y -= ROTATION_SPEED;
                        // sphere_reference.object3D.rotation.y -= ROTATION_SPEED;
                    }
    
                }

                if (currentFrame >= frameStopGradualRotation){
                    console.log("STOP ROTATION");
                    next_edit++;
                    isRotating = false;
                    enableRotation = true;
                    enableSnapCut = true;
                    enableFade = true;
                    fadeStarted = false;
                    doIt = true;
                }
            }
        
            
            // Check if there is another edit to be done, if the current frame has an edit on the ediInfo file 
            // and if the last frame already had an edit (this is needed because the last frame is redrawn when the edit happens)
            if (editEditInfoJSON[next_edit] && editEditInfoJSON[next_edit]["type"] == INSTANT_EDIT)
            {
                let currentFrameEdit = editEditInfoJSON[next_edit] ? editEditInfoJSON[next_edit]["frame"] : 0;
                
                if (currentFrame >= currentFrameEdit && last_frame_with_edit != currentFrame ){
                    console.log("START INSTANT SNAPCUT");
                    console.log("🚀 ~ file: dynamicEdit.js:182 ~ dynamicEditClass ~ currentFrameEdit", currentFrameEdit)
                    console.log("🚀 ~ file: dynamicEdit.js:182 ~ dynamicEditClass ~ currentFrame", currentFrame)
                    editTypeValue = INSTANT_EDIT;
                    hasEditScheduledValue = true;

                    let snapCutRotation = handleSnapCut(CvpXRadians);
                    last_frame_with_edit = currentFrame;
                    if (snapCutRotation != undefined){
                        radiansRotationValue = snapCutRotation;
                        editHappenedValue = true;
                    }
                    next_edit++;
                }
            }

            let frame_data = {
                frame: Math.ceil(currentTime),
                yaw: Number.parseFloat(CvpRadians[0]).toFixed(4),
                pitch: Number.parseFloat(CvpRadians[1]).toFixed(4),
                hasEditScheduled: hasEditScheduledValue,
                editHappened: editHappenedValue,
                radiansRotation: radiansRotationValue,
                editType: editTypeValue
            }
            
            $scope.json_output.push(frame_data);
        }



        //face_4.object3D.translateY(0.01);
    }
    requestAnimationFrame(dynamicEditClass);
}


function getIframeEntities(frameId) {
    var frameObj = document.getElementById(frameId);
    if (frameObj){
        var camera_reference = frameObj.contentWindow.document.querySelector('#video_camera');
        var sphere_reference = frameObj.contentWindow.document.querySelector('#sky-sphere'); 
        return [sphere_reference, camera_reference];
    }
    return;
    }


function fireRotation (roi_radians)
    {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), roi_radians );
        console.log("fire Rotation!!");
        console.log("BEFORE camera_reference.faceStructure", camera_reference.faceStructure);
        const quaternionFace = new THREE.Quaternion();
        quaternionFace.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), roi_radians );

        for (var face in camera_reference.faceStructure) {
            for (var position = 0; position < camera_reference.faceStructure[face].length; position++){
                camera_reference.faceStructure[face][position].applyQuaternion(quaternionFace);
                
            }
        }
        console.log("AFTER camera_reference.faceStructure", camera_reference.faceStructure);
        camera_reference.object3D.quaternion.multiply(quaternion);
        sphere_reference.object3D.quaternion.multiply(quaternion);
        // camera_reference.object3D.rotation.y += roi_radians;
        // sphere_reference.object3D.rotation.y += roi_radians;
    }


function handleSnapCut(CvpXRadians)
{
    let abs_dist_nearest_roi, dist_nearest_roi, index_dist_nearest_roi;
            
    [abs_dist_nearest_roi, dist_nearest_roi, index_dist_nearest_roi]= getNearestRegionOfInterest(CvpXRadians)
    

    let nearest_region_of_interest = editEditInfoJSON[next_edit]["region_of_interest"][index_dist_nearest_roi]["ROI_theta"];
    //console.log(nearest_region_of_interest)

    // if the RoI is under 30° from the current center of the viewport, it is not needed to do a snapcut
    if (abs_dist_nearest_roi >= 0.5235){
                    
        fireRotation(dist_nearest_roi);
    }
    else {
        //console.log("Distance lower than 30°")
        doIt = false;
    }

    return dist_nearest_roi;

}

function getNearestRegionOfInterest(CvpXRadians)
{
    let abs_dist_nearest_roi = Infinity;
    let dist_nearest_roi;
    let index_dist_nearest_roi = 0;

    for (let i in editEditInfoJSON[next_edit]["region_of_interest"])
    {
        let ROIXRadians = convert_normalized_to_radians(editEditInfoJSON[next_edit]["region_of_interest"][i]["ROI_theta"]);
        
        let CvpXOpositeRadians = CvpXRadians > 0 ? CvpXRadians - Math.PI : CvpXRadians + Math.PI;
        // let getRotationDirecition = CvpXRadians > 0 ? getRotationDirecitionByNegativeCvp() : getRotationDirecitionByPositiveCvp();
        
        let curr_dist_roi = getSphereRotation(CvpXRadians, CvpXOpositeRadians, ROIXRadians);
        
        if (Math.abs(curr_dist_roi) < abs_dist_nearest_roi){
            index_dist_nearest_roi = i;
            abs_dist_nearest_roi = Math.abs(curr_dist_roi);		
            dist_nearest_roi = curr_dist_roi;

        }

    }
    // //console.log("dist_nearest_roi " + dist_nearest_roi)
    return [abs_dist_nearest_roi, dist_nearest_roi, index_dist_nearest_roi]
}

function getSphereRotation(CvpXRadians, CvpXOpositeRadians, ROIXRadians)
{
    // //console.log("ROIXRadians " + ROIXRadians);
    // //console.log("CvpXOpositeRadians " + CvpXOpositeRadians);
    // //console.log("CvpXRadians " + CvpXRadians);
    if ((CvpXRadians > 0 && ROIXRadians > 0) || (CvpXRadians < 0 && ROIXRadians < 0))
    {
        // //console.log("CvpXRadians and ROIXRadians in the same quadrant")
        return ROIXRadians - CvpXRadians;
    }
    
    if (CvpXOpositeRadians > 0)
    {

        // CvpXRadians is negative and ROIXRadians is positive
        if (CvpXOpositeRadians < ROIXRadians)
        {
            //Rotates to the left
            // //console.log("CvpXRadians is negative and ROIXRadians is positive Rotates to the left")
            return -1*((Math.PI + CvpXRadians) + (Math.PI - ROIXRadians));
        }
        else
        {
            //Rotates to the right
            // //console.log("CvpXRadians is negative and ROIXRadians is positive Rotates to the right")
            return ROIXRadians - CvpXRadians;
        }
    }
    else
    {
        // CvpXRadians is positive and ROIXRadians is negative
        
        if (CvpXOpositeRadians < ROIXRadians)
        {
            //Rotates to the left
            // //console.log("CvpXRadians is positive and ROIXRadians is negative Rotates to the left")
            return -1*(CvpXRadians - ROIXRadians);
        }
        else
        {
            //Rotates to the right
            // //console.log("CvpXRadians is positive and ROIXRadians is negative Rotates to the right")
            return (Math.PI - CvpXRadians) + (Math.PI + ROIXRadians);
        }
        
    }
}

function convert_normalized_to_degree(cvp_norm) {
    return 360*cvp_norm - 180;
};

function convert_normalized_to_radians(cvp_norm) {
    return 2*Math.PI*cvp_norm - Math.PI;
};