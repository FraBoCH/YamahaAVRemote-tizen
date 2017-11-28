const REFRESH_INFOS_THRESHOLD = 5000;
const CHANGE_VOLUME_THRESHOLD = 200;
const VOLUME_MIN = -70;
const VOLUME_MAX = 0;

document.addEventListener("DOMContentLoaded", function ()
{
	var yamahaAPIController,
	mainPage = document.getElementById("main"),
	inputPage = document.getElementById("input"),
	volumeDiv = document.getElementById("div_volume"),
	power_switch = document.getElementById("input_power"),
	inputDiv = document.getElementById("div_input"),
	inputListDisplay = document.getElementById("input_list"),
	progressBarWidget,
	listHelper,
	lastInfosRefresh = 0,
	lastVolumeChange = 0,
	lastVolumeValue;

	/*
	 * Utils
	 */
	function remap( x, oMin, oMax, nMin, nMax )
	{
	    //check reversed input range
	    var oldMin = Math.min( oMin, oMax );
	    var oldMax = Math.max( oMin, oMax );
	    var reverseInput = oldMin !== oMin;

	    //check reversed output range
	    var newMin = Math.min( nMin, nMax );
	    var newMax = Math.max( nMin, nMax );
	    var reverseOutput = oldMin !== oMin;

	    var portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);
	    if (reverseInput) { portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin); }
	    
	    var result = portion + newMin;
	    if (reverseOutput) { result = newMax - portion; }

	    // ensure result is in range
	    if (result < newMin) { result = newMin; }
	    if (result > newMax) { result = newMax; }
	    
	    return Math.round(result);
	}
	
	function percentTodB(value) { return remap(value, 0, 100, VOLUME_MIN, VOLUME_MAX); }
	function dBToPercent(value) { return remap(value, VOLUME_MIN, VOLUME_MAX, 0, 100); }
	
    function validateIPaddress(ipaddress)   
    {  
    	return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress));
    }
	
	/* 
	 * Business functions
	 */
	function togglePower()
	{
		yamahaAPIController.powerToggle(function(err, data){
			if (err) { tau.openPopup("errorPopup"); }
		});
	} 
	
	function displayVolume(dbValue) 
	{
		volumeDiv.innerHTML = dbValue + " dB";
		progressBarWidget.value(dBToPercent(dbValue));
	}
	
	function changeVolume(dbValue) 
	{
		// Don't change volume on each call if they are too frequent 
		setTimeout(function() {
			if (Date.now() - lastVolumeChange > CHANGE_VOLUME_THRESHOLD)
			{
				displayVolume(dbValue);
				lastVolumeChange = Date.now();
				console.log("Changing volume to value " + dbValue);
				yamahaAPIController.setVolume(dbValue, function(err, data){
					if (err)
					{
						console.log("ERROR: changing volume to value " + dbValue +":"+ err);
					}
				});
			}
		}, CHANGE_VOLUME_THRESHOLD);
	}

	function toggleMute(){
		console.log("Toggling mute");
		if (volumeDiv.innerHTML !== "Mute")
		{
			lastVolumeValue = volumeDiv.innerHTML;
			volumeDiv.innerHTML = "Mute";
		} else if (lastVolumeValue) {
			volumeDiv.innerHTML = lastVolumeValue;
		}
		
		yamahaAPIController.muteToggle(function(err, data){
			if (err) { tau.openPopup("errorPopup"); }
		});
	}
	
	function switchInput(newInput)
	{
		console.log("Switching input to : " + newInput);
		inputDiv.innerHTML = newInput;
		yamahaAPIController.switchInput(newInput, function(err, data){
			if (err) { tau.openPopup("errorPopup"); }
		});
	}
	
	function syncInfos(info) 
	{
		console.log("Power is " + info.power +", volume is " + info.volume + ", mute is " + info.mute + ", input is " + info.inputTitle);
		displayVolume(info.volume);
		if (info.mute === "On") {
			lastVolumeValue = volumeDiv.innerHTML;
			volumeDiv.innerHTML = "Mute";
		}
		if (info.power === "On") { power_switch.checked = true; }
		else { power_switch.checked = false; }
		inputDiv.innerHTML = info.inputTitle;
	}
	
	function getInfos()
	{
		tau.changePage("processing");
		yamahaAPIController.getBasicMainZoneInfo(function (info){
			if (info && !info.error) {
				tau.changePage("main");
				lastInfosRefresh = Date.now();
				syncInfos(info);
			} else {
				if(info) { console.log(info.error); }
				tau.openPopup("errorPopup");
			}
		});
	}
	
	function refreshInfos()
	{	
		// Refresh only if last refresh didn't occur in last few seconds
		if (Date.now() - lastInfosRefresh >= REFRESH_INFOS_THRESHOLD) 
		{
			console.log("Refreshing info");
			yamahaAPIController.getBasicMainZoneInfo(function (info){
				if (info && !info.error) {
					lastInfosRefresh = Date.now();
					syncInfos(info);
				} else {
					if(info) { console.log(info.error); }
					tau.openPopup("errorPopup");
				}
			});
		}
		
		// call for next refresh
		setTimeout(refreshInfos, REFRESH_INFOS_THRESHOLD);
	}

	/* 
	 * Handling back
	 */
	 window.addEventListener('tizenhwkey', function(ev) {
	      if (ev.keyName === "back") {
	         var page = document.getElementsByClassName("ui-page-active")[0],
	            pageid = page ? page.id : "";
	
	         if ( pageid === "main" || pageid === "processing" ) {
	            try {
	            /* Call tizen.application.getCurrentApplication().exit() to exit application */
	                  tizen.application.getCurrentApplication().exit();
	            } catch (ignore) {
	            /* Add script to add another behavior */
	            }
	         } else {
	            /* Call window.history.back() to go to previous browser window */
	            window.history.back();
	         }
	      }
	   });
	
	/* 
	 * Handling of main page events
	 */
	function rotaryDetentHandler() {
		// Get rotary direction
		var direction = event.detail.direction,
		value = parseInt(progressBarWidget.value());

		if (direction === "CW") {
			// Right => increase
			value = value+2;
		}
		else 
		{
			// Left => decrease
			value = value-2;
		}
		
		changeVolume(percentTodB(value));
	}
	
	mainPage.addEventListener("pagebeforeshow", function () {
		progressBarWidget = new tau.widget.CircleProgressBar(document.getElementById("circleprogress"), {size: "full"});
		document.addEventListener("rotarydetent", rotaryDetentHandler);
	    document.querySelector("#div_power").addEventListener('click', togglePower);		
	    document.querySelector("#div_volume").addEventListener('click', toggleMute);		
	    refreshInfos();
	});
	
	mainPage.addEventListener("pagehide", function () {
		document.removeEventListener("rotarydetent", rotaryDetentHandler);
	    document.querySelector("#div_power").removeEventListener('click', togglePower);
	    document.querySelector("#div_volume").removeEventListener('click', toggleMute);		
		// release object
		progressBarWidget.destroy();
	});
	
	/* 
	 * Config handling 
	 */
	function getHostIPString(){
		return document.getElementById("input_hostip_1").value + "." +
				document.getElementById("input_hostip_2").value + "." +
				document.getElementById("input_hostip_3").value + "." +
				document.getElementById("input_hostip_4").value;
	}
	
	function setHostIPConfig(value){
		if (value && value.length > 0)
		{
			var components = value.split(".");
			document.getElementById("input_hostip_1").value = components[0];
			document.getElementById("input_hostip_2").value = components[1];
			document.getElementById("input_hostip_3").value = components[2];
			document.getElementById("input_hostip_4").value = components[3];
		}
	}
	
	document.getElementById("saveConfig").addEventListener("click", function(){
		var hostIP = getHostIPString();
		if (!validateIPaddress(hostIP)) {
			return;
		}
		
		if (yamahaAPIController) 
		{
			yamahaAPIController.changeHostIP(hostIP);
		}
		else
		{
			yamahaAPIController = new YamahaAPIController(hostIP);
		}
		tizen.preference.setValue("hostIP", hostIP);
		getInfos();
	});
	
	document.getElementById("cancelConnect").addEventListener("click", function(){
		tizen.application.getCurrentApplication().exit();
	});
	
	
	/* 
	 * Input selection handling
	 */
	function onInputSelected(e)
	{
		switchInput(e.target.getAttribute("data-param"));
		tau.changePage("main");
	}
	
	inputPage.addEventListener("pagebeforeshow", function() 
	{
		if (!inputListDisplay.children || inputListDisplay.children.length === 0)
		{
			yamahaAPIController.getInputsAndScenes(function (inputList){
				inputListDisplay.innerHTML = "";
				if (inputList)
				{
					/*inputList.sort(function(a, b) {
						if(a.title < b.title) { return -1; }
						else if(a.title > b.title) { return 1; }
					    return 0;
					});*/
					var i;
					for (i = 0; i < inputList.length ; i++)
					{
						var li = document.createElement("li");
						li.setAttribute("class", "li-has-radio");
						li.setAttribute("id", "inputList[i].title");
						
						// Label
						var label = document.createElement("label");
						var t = document.createTextNode(inputList[i].title);
						label.appendChild(t);
						
						// Radio button
						var rad = document.createElement("input");
						rad.setAttribute("type", "radio");
						rad.setAttribute("name", "radio-input");
						rad.setAttribute("data-param", inputList[i].param);
						if (inputList[i].title === inputDiv.innerHTML)
						{
							rad.setAttribute("checked", "checked");
						}
						rad.addEventListener('click', onInputSelected);
						
						label.appendChild(rad);
						li.appendChild(label);
						inputListDisplay.appendChild(li);
					}

					listHelper = tau.helper.SnapListMarqueeStyle.create(inputListDisplay, {marqueeDelay: 1000});
					
					// scroll to current input
					//location.href="#"+inputDiv.innerHTML;
				}
				else
				{
					console.log("No input received.");
				}
			});
		} else {
			// Inputs are already in DOM, only recreate snaplist
			
			listHelper = tau.helper.SnapListMarqueeStyle.create(inputListDisplay, {marqueeDelay: 1000});
		}
		
	});

	inputPage.addEventListener("pagehide", function() {
		 document.querySelector("#input_list input").removeEventListener('click', onInputSelected);
		});
	
	/* 
	 * Init
	 */
	if (tizen.preference.exists("hostIP")) 
	{ 
		var hostIP = tizen.preference.getValue("hostIP");
		console.log("Host IP retrieved from preferences: "+hostIP);
		if (validateIPaddress(hostIP)) {
			yamahaAPIController = new YamahaAPIController(hostIP);
			setHostIPConfig(hostIP);
			getInfos();
		} else {
			console.log("Host IP in config is wrong");
			tau.changePage("config");
		}
	}
	else 
	{
		console.log("No Host IP set, go to config");
		tau.changePage("config");
	}
},false);
