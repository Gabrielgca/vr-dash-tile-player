var FOVEditRule;

function FOVEditRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let Debug = factory.getSingletonFactoryByName('Debug');

    let context = this.context;
    let instance,
        logger;

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
    }

    function getBytesLength(request) {
        return request.trace.reduce(function (accumulator, currentByte) {
            return accumulator + currentByte.b[0];
        }, 0);
    }

    function getMaxIndex(rulesContext) {
        
        let mediaType = rulesContext.getMediaInfo().type;
        
        let dashMetrics = DashMetrics(context).getInstance();
        let streamController = StreamController(context).getInstance();
        let dashManifest = DashManifestModel(context).getInstance();
        let abrController = rulesContext.getAbrController();
        let current = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo().id);
        let mediaInfo = rulesContext.getMediaInfo();
        
        var appElement = document.querySelector('[ng-controller=DashController]');
        var $scope = angular.element(appElement).scope();
        let center_viewport_x = $scope.current_center_viewport_x;
        let center_viewport_y = $scope.current_center_viewport_y;

        let requests = dashMetrics.getHttpRequests(mediaType),
            lastRequest = null,
            currentRequest = null,
            downloadTime,
            totalTime,
            calculatedBandwidth,
            currentBandwidth,
            latencyInBandwidth,
            switchUpRatioSafetyFactor,
            currentRepresentation,
            count,
            bandwidths = [],
            i,
            q = SwitchRequest.NO_CHANGE,
            p = SwitchRequest.PRIORITY.DEFAULT,
            totalBytesLength = 0;
        latencyInBandwidth = true;
        switchUpRatioSafetyFactor = 1.5;
        // console.log("[CustomRules][" + mediaType + "][FOVEditRule] Checking download ratio rule... (current = " + current + ")");

        if (!requests) {
            // console.log("[CustomRules][" + mediaType + "][FOVEditRule] No metrics, bailing.");
            return SwitchRequest(context).create();
        }
        //_tfinish = The real time at which the request finished.
        // trequest = The real time at which the request was sent.
        // tresponse =  The real time at which the first byte of the response was received.
        // trace = Throughput traces, for successful requests only.
        
        // Get last valid request
        i = requests.length - 1;
        while (i >= 0 && lastRequest === null) {
            currentRequest = requests[i];
            if (currentRequest._tfinish && currentRequest.trequest && currentRequest.tresponse && currentRequest.trace && currentRequest.trace.length > 0) {
                lastRequest = requests[i];
            }
            i--;
        }
        
        if (lastRequest === null) {
            // console.log("[CustomRules][" + mediaType + "][FOVEditRule] No valid requests made for this stream yet, bailing.");
            return SwitchRequest(context).create();
        }
        
        if (lastRequest.type !== 'MediaSegment') {
            // console.log("[CustomRules][" + mediaType + "][FOVEditRule] Last request is not a media segment, bailing.");
            return SwitchRequest(context).create();
        }
        
        totalTime = (lastRequest._tfinish.getTime() - lastRequest.trequest.getTime()) / 1000;
        downloadTime = (lastRequest._tfinish.getTime() - lastRequest.tresponse.getTime()) / 1000;
        
        if (totalTime <= 0) {
            // console.log("[CustomRules][" + mediaType + "][FOVEditRule] Don't know how long the download of the last fragment took, bailing.");
            return SwitchRequest(context).create();
        }
        // console.log("LAST REQUEST", lastRequest)
        totalBytesLength = getBytesLength(lastRequest);
        
        // console.log("[CustomRules][" + mediaType + "][FOVEditRule] DL Lasr Request: " + Number(downloadTime.toFixed(3)) + "s, Total: " + Number(totalTime.toFixed(3)) + "s, Length: " + totalBytesLength);

        // Take average bandwidth over 5 requests
        count = 1;
        // console.log("requests LENGTH", requests.length)
        while (i >= 0 && count <= 5) {
            currentRequest = requests[i];

            if (currentRequest._tfinish && currentRequest.trequest && currentRequest.tresponse && currentRequest.trace && currentRequest.trace.length > 0) {

                let _totalTime = (currentRequest._tfinish.getTime() - currentRequest.trequest.getTime()) / 1000;

                let _downloadTime = (currentRequest._tfinish.getTime() - currentRequest.tresponse.getTime()) / 1000;
                
                // console.log("[CustomRules][" + mediaType + "][FOVEditRule] DL Average [" + count + "]: " + Number(_downloadTime.toFixed(3)) + "s, Total: " + Number(_totalTime.toFixed(3)) + "s, Length: " + getBytesLength(currentRequest));
                // console.log("currentRequest IF", currentRequest)
                totalTime += _totalTime;
                downloadTime += _downloadTime;
                totalBytesLength += getBytesLength(currentRequest);
                count += 1;
            }
            else {
                // console.log("[CustomRules][" + mediaType + "][FOVEditRule] Not a valid Request [" + count + "]");
                // console.log("currentRequest ELSE", currentRequest)
            }
            i--;
        }

        // Set length in bits
        totalBytesLength *= 8;

        calculatedBandwidth = latencyInBandwidth ? (totalBytesLength / totalTime) : (totalBytesLength / downloadTime);

        // console.log("[CustomRules][" + mediaType + "][FOVEditRule] BW = " + Math.round(calculatedBandwidth / 1000) + " kb/s");

        if (isNaN(calculatedBandwidth)) {
            return SwitchRequest(context).create();
        }

        count = rulesContext.getMediaInfo().representationCount;
        currentRepresentation = rulesContext.getRepresentationInfo();
        currentBandwidth = dashManifest.getBandwidth(currentRepresentation);
        for (i = 0; i < count; i += 1) {
            bandwidths.push(rulesContext.getMediaInfo().bitrateList[i].bandwidth);
        }
        if (calculatedBandwidth <= currentBandwidth) {
            for (i = current - 1; i > 0; i -= 1) {
                if (bandwidths[i] <= calculatedBandwidth) {
                    break;
                }
            }
            q = i;
            p = SwitchRequest.PRIORITY.WEAK;

            // // console.log("[CustomRules] SwitchRequest Low: q=" + q + "/" + (count - 1) + " (" + bandwidths[q] + ")"/* + ", p=" + p*/);
            // return SwitchRequest(context).create(q, { name: FOVEditRuleClass.__dashjs_factory_name }, p);
        } else {
            for (i = count - 1; i > current; i -= 1) {
                if (calculatedBandwidth > (bandwidths[i] * switchUpRatioSafetyFactor)) {
                    // console.log("[CustomRules][" + mediaType + "][FOVEditRule] bw = " + calculatedBandwidth + " results[i] * switchUpRatioSafetyFactor =" + (bandwidths[i] * switchUpRatioSafetyFactor) + " with i=" + i);
                    break;
                }
            }

            q = i;
            p = SwitchRequest.PRIORITY.STRONG;

            // // console.log("[CustomRules] SwitchRequest High: q=" + q + "/" + (count - 1) + " (" + bandwidths[q] + ")"/* + ", p=" + p*/);
            // return SwitchRequest(context).create(q, { name: FOVEditRuleClass.__dashjs_factory_name }, p);
        }

        ////////////////////////////////////////////////////
        ////////////////////////////////////////////////////
        ////////////////////////////////////////////////////

        // Qual a regra?
        // Pegar a média da taxa de transmissão da forma acima
        // O resultado dela será a qualidade máxima que uma face pode ter
        // Pegar quais faces estão visíveis
        // Mudar o peso que se dá a porcentagem do que está visível dependendo do que está sendo visto
        // Se uma face não está praticamente sendo vista: Uma qualidade a menos
        // Se duas faces estão bem vistas: 50/50
        // Se três faces estão sendo vistas: usar porcentagem
        // Se quatro faces estão visíveis, muito provavelmente duas delas estão bem pouco visíveis. Usar uma qualidade a menos para elas
        // Faces que não estão sendo vísiveis, pior qualidade
        // O que fazer quando houver uma edição programada? Precisa ver qual o segmento que está sendo requisitado


        var info = abrController.getSettings().info;

        // console.log("info", info)

        let visible_faces = $scope.get_visible_faces(center_viewport_x, center_viewport_y);
        // console.log("$visible_faces", visible_faces);
        // console.log("center_viewport_x, center_viewport_y", center_viewport_x, center_viewport_y)
        let predicted_viewport = $scope.predict_center_viewport(1);
        // console.log("predicted_viewport", predicted_viewport);
        // console.log("FRAME NUMBER", $scope.frameNumber.get());
        return computedQuality(info, q, predicted_viewport, bandwidths, $scope);

    }


    function computedQuality (info, maxQuality,  predicted_viewport, bandwidths, $scope) {
        let factory = dashjs.FactoryMaker;
        let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
        const switchRequest = SwitchRequest(context).create();

        let predicted_visible_faces = $scope.get_visible_faces(predicted_viewport[0], predicted_viewport[1]);

        // console.log("predicted_visible_faces", predicted_visible_faces);
        let isFaceVisible = false;
        let percentageVisibleFace;
        for (face in predicted_visible_faces){
            
            if (face.includes(info.face) ){
                isFaceVisible = true;
                percentageVisibleFace = predicted_visible_faces[face];
                break;
            }

        }

        if (isFaceVisible){
            // console.log("FACE ", info.face, "IS VISIBLE AND ITS PERCENTAGE IS ", percentageVisibleFace);

            if (percentageVisibleFace < 0.10){
                switchRequest.quality = maxQuality - 1;
                switchRequest.reason = 'Face is slightly visible. Getting one quality lower than the max quality possible';
                switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            }
            else {
                switchRequest.quality = maxQuality;
                switchRequest.reason = 'Face is visible. Selecting high quality possible.';
                switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
            }
        }
        else {
            // console.log("FACE ", info.face, "IS NOT VISIBLE. SELECTING THE LOWEST QUALITY.");

            let tag = 0;

            // Choose the lowest bitrate
            for (let i = 1; i < bandwidths.length; i++) {  
                if (bandwidths[i] < bandwidths[tag]) {
                    tag = i;
                }
            }

            switchRequest.quality = tag;
            switchRequest.reason = 'Face is not visible. Selecting the lowest quality';
            switchRequest.priority = SwitchRequest.PRIORITY.WEAK;
        }

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
