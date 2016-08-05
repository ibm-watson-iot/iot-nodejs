var express = require('express');
var _ = require('underscore');
var router = express.Router();
//var read = [];
//var reading = [];
var data = [];
var isAppdata =false;
var types=[];
var Client = require("ibmiotf");
// var appClientConfig = require("./application.json");
/* appClient = new Client.IotfApplication(appClientConfig);
appClient.connect();

appClient.on("connect", function () {
        appClient.subscribeToDeviceStatus("+","+","+","json");
});

appClient.on("deviceStatus", function (deviceType, deviceId, payload, topic) {
	var obj = JSON.parse(payload);
	obj.id = deviceId;
	obj.type = deviceType;

	console.log("Device status from :: "+deviceType+" : "+deviceId+" is "+obj.Action+" with Close Code being "+obj.CloseCode+" and Reason being \""+obj.Reason+" "+obj.ClientAddr+"\"");
	var info = _.find(data,function(itm){return itm.id == deviceId && itm.type == deviceType});

	if(!info){
		data.push(obj);
	}
	else
	{
		info.Action = obj.Action;
		info.CloseCode= obj.CloseCode;
		info.Reason=obj.Reason;
		info.ClientAddr=obj.ClientAddr;
	}
		
});

appClient.on("error", function (err) {
        console.log("Error : "+err);
}); */

/* GET home page. */
router.get('/', function(req, res, next) {
	 console.log("org id:"+ req.query.org_id)
	 if(req.query.auth_key && req.query.auth_token){
		var obj ={
		  "org": req.query.auth_key.split('-')[1],
		  "id": "123",
		  "auth-key": req.query.auth_key,
		  "auth-token": req.query.auth_token
		}
		appClient = new Client.IotfApplication(obj);
		appClient.connect();

		appClient.on("connect", function () {
			res.redirect('/status');
			
				appClient.subscribeToDeviceStatus("+","+","+","json");
		});

		appClient.on("deviceStatus", function (deviceType, deviceId, payload, topic) {
			var obj = JSON.parse(payload);
			obj.id = deviceId;
			obj.type = deviceType;

			console.log("Device status from :: "+deviceType+" : "+deviceId+" is "+obj.Action+" with Close Code being "+obj.CloseCode+" and Reason being \""+obj.Reason+" "+obj.ClientAddr+"\"");
			var info = _.find(data,function(itm){return itm.id == deviceId && itm.type == deviceType});

			if(!info){
				data.push(obj);
			}
			else
			{
				info.Action = obj.Action;
				info.CloseCode= obj.CloseCode;
				info.Reason=obj.Reason;
				info.ClientAddr=obj.ClientAddr;
			}
				
		});

		appClient.on("error", function (err) {
				console.log("Error : "+err);
		});
	 
	 }
	 else{
		res.render('user', { title: 'IBM Watson IoT Platform'});//,data,selected:req.query.type});
	 }

});

/* GET Device Status page. */
router.get('/status', function(req, res, next) {
	// console.log("body:"+req.query.type)
	if(typeof appClient != 'undefined'){
		types = _.uniq(_.pluck(data,"type"));
		res.render('status', { title: 'IBM Watson IoT Platform' ,data,types,selected:req.query.type});
	}
	else{
				res.redirect('/');
	}
	
});
module.exports = router;
