var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var user = (function () {
    var configs = require('/config.json');
    var routes = new Array();

	var log = new Log();
	var db;
	var device;
	var deviceModule = require('device.js').device;
	var common = require("/modules/common.js");
	var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}
	
	var claimEmail = "http://wso2.org/claims/emailaddress";
	var claimFirstName = "http://wso2.org/claims/givenname";
	var claimLastName = "http://wso2.org/claims/lastname";
	var claimMobile = "http://wso2.org/claims/mobile";
	
    var module = function (dbs) {
		db = dbs;
        device = new deviceModule(db);
        //mergeRecursive(configs, conf);
    };

	var configs = function (tenantId) {
	    var config = application.get(TENANT_CONFIGS);
		if (!tenantId) {
	        return config;
	    }
	    return config[tenantId] || (config[tenantId] = {});
	};			
	/**
	 * Returns the user manager of the given tenant.
	 * @param tenantId
	 * @return {*}
	 */
	var userManager = function (tenantId) {
	    var config = configs(tenantId);
	    if (!config || !config[USER_MANAGER]) {
			var um = new carbon.user.UserManager(server, tenantId);
			config[USER_MANAGER] = um;
	        return um;
	    }
	    return configs(tenantId)[USER_MANAGER];
	};			
	
    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }
	
    // prototype
    module.prototype = {
        constructor: module,
		authenticate: function(ctx){
			var authStatus = server.authenticate(ctx.username, ctx.password);
			if(!authStatus) {
				return null;
			}
			var user =  getUser({userid: ctx.username});
			var result = db.query("SELECT COUNT(id) AS record_count FROM tenantplatformfeatures WHERE tenant_id = ?",  stringify(user.tenantId));
			if(result[0].record_count == 0) {
				for(var i = 1; i < 13; i++) {
					var result = db.query("INSERT INTO tenantplatformfeatures (tenant_id, platformFeature_Id) VALUES (?, ?)", stringify(user.tenantId), i);
				}
			}
		    return user;
		},
		devices: function(obj){
			var devices = db.query("SELECT * FROM devices WHERE user_id= ? AND tenant_id = ?", String(obj.userid), common.getTenantID());
			return devices;
		},
		getUser: function(ctx){
			try {
				var proxy_user = {};
				var tenantUser = carbon.server.tenantUser(ctx.userid);
				var um = userManager(tenantUser.tenantId);
			    var user = um.getUser(tenantUser.username);
		    	var claims = [claimEmail, claimFirstName, claimLastName];
				var claimResult = user.getClaimsForSet(claims,null);
				proxy_user.email = claimResult.get(claimEmail);
				proxy_user.firstName = claimResult.get(claimFirstName);
				proxy_user.lastName = claimResult.get(claimLastName);
				proxy_user.mobile = claimResult.get(claimMobile);
				proxy_user.username = tenantUser.username;
				proxy_user.tenantId = tenantUser.tenantId;
				proxy_user.roles = stringify(user.getRoles());
				return proxy_user;
			} catch(e) {
				log.error(e);
				var error = 'Error occurred while retrieving user.';
				return error;
			}
		},
		getUserRoles: function(ctx){
            var tenantUser = carbon.server.tenantUser(ctx.userid);
			var um = userManager(tenantUser.tenantId);
		    var user = um.getUser(tenantUser.username);
			return stringify(user.getRoles());
		},
		sendEmail: function(ctx){
		    content = "Dear "+ ctx.first_name+", \nYou have been registered to the WSO2 MDM. Please click the link below to enroll your device.\n \nLink - "+configs.HTTPS_URL+"/mdm/api/device_enroll \n \nWSO2 MDM Team";
		    subject = "MDM Enrollment";

		    var email = require('email');
		    var sender = new email.Sender("smtp.gmail.com", "25", "dulitha@wso2mobile.com", "brainsteamer", "tls");
		    sender.from = "mdm@wso2mobile.com";

		    log.info(ctx.username);
		    sender.to = ctx.username;
		    sender.subject = subject;
		    sender.text = content;
		    sender.send();
		},
		addUser: function(ctx){
			var claimMap = new java.util.HashMap();
			claimMap.put(claimEmail, ctx.username);
			claimMap.put(claimFirstName, ctx.first_name);
			claimMap.put(claimLastName, ctx.last_name);
			claimMap.put(claimMobile, ctx.mobile_no);
			var proxy_user = {};
			
			try {
				var tenantId = common.getTenantID();
				var users_list = Array();
				if(tenantId){
					var um = userManager(common.getTenantID());
					if(um.userExists(ctx.username)) {
						objResult.error = 'User already exist with the email address.';
					} else {
						um.addUser(ctx.username, ctx.password, 
							ctx.groups, claimMap, null);					
					}
				}
				else{
					log.error('Error in getting the tenantId from session');
					print('Error in getting the tenantId from session');
				}
			} catch(e) {
				log.error(e);
				proxy_user.error = 'Error occurred while creating the user.';
			}
			return proxy_user;
		},
		getGroups: function(ctx){
			var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			return um.allRoles();
		},
		getUsers: function(ctx){
			var tenantId = common.getTenantID();
			var users_list = Array();
			if(tenantId){
					var um = userManager(common.getTenantID());
					var arrUserName = parse(stringify(um.listUsers()));

					for(var i = 0; i < arrUserName.length; i++) {
						if(!common.isMDMUser(arrUserName[i])) {
							continue;
						}
						var user = um.getUser(arrUserName[i]);
						
						var proxy_user = {};
						proxy_user.username = arrUserName[i];
						var claims = [claimEmail, claimFirstName, claimLastName];
						var claimResult = user.getClaimsForSet(claims,null);
						proxy_user.email = claimResult.get(claimEmail);
						proxy_user.firstName = claimResult.get(claimFirstName);
						proxy_user.lastName = claimResult.get(claimLastName);
						proxy_user.mobile = claimResult.get(claimMobile);
						proxy_user.tenantId = tenantId;
						proxy_user.roles = stringify(user.getRoles());
						users_list.push(proxy_user);
						
					}	
			}else{
				print('Error in getting the tenantId from session');
			}
			log.info(">>>>>");
			log.info(users_list);
			return users_list;
		},
		operation: function(ctx){
			var device_list = db.query("SELECT id, reg_id, os_version, platform_id FROM devices WHERE user_id = ?", ctx.userid);
		    var succeeded="";
		    var failed="";
		    for(var i=0; i<device_list.length; i++){
		        var status = device.sendToDevice({'deviceid':device_list[i].id, 'operation': ctx.operation, 'data' : ctx.data});
		        if(status == true){
		            succeeded += device_list[i].id+",";
		        }else{
		            failed += device_list[i].id+",";
		        }
		    }
		    return "Succeeded : "+succeeded+", Failed : "+failed;
		}
    };
    // return module
    return module;
})();