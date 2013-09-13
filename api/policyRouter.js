var policy = (function () {


    var module = function (db,router) {
        var policyModule = require('modules/policy.js').policy;
        var policy = new policyModule(db);

        router.post('policies/', function(ctx){

            log.info("check policy router POST");
            log.info(ctx);
            var result = policy.addPolicy(ctx);
            if(result == 1){
                response.status = 200;
            }else{
                response.status = 404;
            }

        });
        router.delete('policies/{policyid}', function(ctx){
            log.info("Check Delete Router");
            var result = policy.deletePolicy(ctx);
            if(result==1){
                response.status = 200;
            }else{
                response.status = 404;
            }
        });
        router.get('policies/', function(ctx){

            log.info("check policy router GET");
            log.info(ctx);
            var result = policy.getAllPolicies(ctx);
            if(result != undefined && result != null && result[0] != undefined && result[0]!= null){
                response.content = result;
                response.status = 200;
            }else{
                response.status = 404;
            }

        });
        router.put('policies/{policyid}/groups', function(ctx){
            log.info("check policy router PUT");
            log.info(ctx);
            policy.assignGroupsToPolicy(ctx);


        });
        router.get('policies/{policyid}/groups', function(ctx){

            var result = policy.getGroupsByPolicy(ctx);

        });

    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();