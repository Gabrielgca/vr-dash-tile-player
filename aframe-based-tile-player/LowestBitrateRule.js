var LowestBitrateRule;

// Rule that selects the possible lowest bitrate
function LowestBitrateRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let context = this.context;
    let instance;

    function setup() {
    }

    // Always select the lowest bitrate
    function getMaxIndex(rulesContext) {
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getAbrController')) {
            return switchRequest;
        }

        const mediaType = rulesContext.getMediaInfo().type;
        const mediaInfo = rulesContext.getMediaInfo();
        const abrController = rulesContext.getAbrController();

        if (mediaType != "video") {  // Default settings for audio
            return switchRequest;           
        }

        // Ask to switch to the lowest bitrate
        switchRequest.quality = 0;
        switchRequest.reason = 'Always switching to the lowest bitrate';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;

        const bitrateList = abrController.getBitrateList(mediaInfo);  // List of all the selectable bitrates

        let tag = 0;
        if (bitrateList.length <= 1) {
            return switchRequest;
        }
        for (let i = 1; i < bitrateList.length; i++) {  // Choose the lowest bitrate
            if (bitrateList[i].bitrate < bitrateList[tag].bitrate) {
                tag = i;
            }
        }
        switchRequest.quality = 1;

        return switchRequest;
    }

    instance = {
        getMaxIndex: getMaxIndex,
    };

    setup();

    return instance;
}

LowestBitrateRuleClass.__dashjs_factory_name = 'LowestBitrateRule';
LowestBitrateRule = dashjs.FactoryMaker.getClassFactory(LowestBitrateRuleClass);

