var FOVEditRule;

function FOVEditRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let context = this.context;
    let instance;

    function setup() {
    }


    function getMaxIndex(rulesContext) {
        ////consol.log("rulesContext: ", rulesContext);
        ////consol.log("rulesContext.getMediaInfo(): ", rulesContext.getMediaInfo());
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getAbrController')) {
            return switchRequest;
        }

        const mediaType = rulesContext.getMediaInfo().type;
        const mediaInfo = rulesContext.getMediaInfo();
        const abrController = rulesContext.getAbrController();
        console.log("🚀 abrController", abrController)
        let dashMetrics = DashMetrics(context).getInstance();
        console.log("🚀 dashMetrics: ", dashMetrics)
        let streamController = StreamController(context).getInstance();
        console.log(dashMetrics.getHttpRequests(mediaType))
        var appElement = document.querySelector('[ng-controller=DashController]');
        var $scope = angular.element(appElement).scope();
        let center_viewport_x = $scope.current_center_viewport_x;
        let center_viewport_y = $scope.current_center_viewport_y;
        console.log("streamController: ", streamController);
        
        
        //consol.log("$center_viewport_xxxx", $scope.center_viewport_x);
        //consol.log("$time_array", $scope.time_array);
        if (mediaType != "video") {  // Default settings for audio
            return switchRequest;           
        }

        // Ask to switch to the lowest bitrate
        switchRequest.quality = 0;
        switchRequest.reason = 'Always switching to the lowest bitrate';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;

        const bitrateList = abrController.getBitrateList(mediaInfo);  // List of all the selectable bitrates
        //consol.log("oi oi ")
        let visible_faces = $scope.get_visible_faces(center_viewport_x, center_viewport_y);
        // console.log("$visible_faces", visible_faces);

        let predicted_viewport = $scope.predict_center_viewport(1);
        // console.log("current center_viewport_x", center_viewport_x, "current center_viewport_y", center_viewport_y,"predicted yaw: ", predicted_viewport[0], "predicted pitch: ",  predicted_viewport[1]);
        let tag = 0;
        if (bitrateList.length <= 1) {
            return switchRequest;
        }
        for (let i = 1; i < bitrateList.length; i++) {  // Choose the lowest bitrate
            if (bitrateList[i].bitrate < bitrateList[tag].bitrate) {
                tag = i;
            }
        }


        switchRequest.quality = 5;

        return switchRequest;
    }

    instance = {
        getMaxIndex: getMaxIndex,
    };

    setup();

    return instance;
}

FOVEditRuleClass.__dashjs_factory_name = 'FOVEditRule';
FOVEditRule = dashjs.FactoryMaker.getClassFactory(FOVEditRuleClass);
