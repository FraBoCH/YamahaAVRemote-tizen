// Generic helper function
function basicNodeValue(xml, node) {
  var start = xml.indexOf("<" + node + ">");
  var end = xml.indexOf("</" + node + ">");
  return xml.substring(start + node.length + 2, end);
}
	
function YamahaAPIController (hostIPD)
{
	this.ip = hostIPD;
	
	/* Helper internal methods */
	
	this.sendRequest = function (cmd, payload, callback) {
		    var req = new XMLHttpRequest();
		    req.onload = function () {
		      if (req.readyState === 4 && req.status === 200) {
		        callback(null, req.responseText);
		      } else {
		    	console.log(req.status);
		        callback(req.status, null);
		      } 
		    };

		    req.timeout = 3000; // Set timeout to 3 seconds
		    req.ontimeout = function () { callback("timeout", null); };

		    req.open('POST', "http://" + this.ip + "/YamahaRemoteControl/ctrl");
		    req.send('<YAMAHA_AV cmd="' + cmd + '">' + payload + '</YAMAHA_AV>');
	};

	/* Public methods */
	this.changeHostIP = function (hostIP) {
		this.ip = hostIP;
	};

	this.getBasicMainZoneInfo = function (callback) {
		
		if (!this.ip) { 
			var info = {};
			info.error = "No IP set";
			callback(info);
			return;
		}
		
		this.sendRequest("GET", "<Main_Zone><Basic_Status>GetParam</Basic_Status></Main_Zone>", function (err, data) {

			var info = {};
		    
			if (data) {
		      var volume = basicNodeValue(data, "Volume");
		      var volume_level = basicNodeValue(volume, "Lvl");
		      var volume_val = basicNodeValue(volume_level, "Val");
		      
		      info.power = basicNodeValue(basicNodeValue(data, "Power_Control"), "Power");
		      info.volume = parseInt(volume_val)/10;
		      info.mute = basicNodeValue(data, "Mute");
		      info.inputName = basicNodeValue(data, "Input_Sel");
		      info.inputTitle = basicNodeValue(data, "Title");
		      
		      /*
		      if (!noaddlinfo && input_name == "NET RADIO") {
		        sendRequest("GET", "<NET_RADIO><Play_Info>GetParam</Play_Info></NET_RADIO>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Station");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "SERVER") {
		        sendRequest("GET", "<SERVER><Play_Info>GetParam</Play_Info></SERVER>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "Spotify") {
		        sendRequest("GET", "<Spotify><Play_Info>GetParam</Play_Info></Spotify>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Track");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = '';
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "Napster") {
		        sendRequest("GET", "<Napster><Play_Info>GetParam</Play_Info></Napster>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Track");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = '';
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "JUKE") {
		        sendRequest("GET", "<JUKE><Play_Info>GetParam</Play_Info></JUKE>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Track");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = '';
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "Pandora") {
		        sendRequest("GET", "<Pandora><Play_Info>GetParam</Play_Info></Pandora>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Track");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = '';
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "Bluetooth") {
		        sendRequest("GET", "<Bluetooth><Play_Info>GetParam</Play_Info></Bluetooth>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "MusicCast Link") {
		        sendRequest("GET", "<MusicCast_Link><Play_Info>GetParam</Play_Info></MusicCast_Link>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "AirPlay") {
		        sendRequest("GET", "<AirPlay><Play_Info>GetParam</Play_Info></AirPlay>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      } else if (!noaddlinfo && input_name == "USB") {
		        sendRequest("GET", "<USB><Play_Info>GetParam</Play_Info></USB>", function (playerr, playdata) {
		          if (playdata) {
		            dict["PLAYBACK_MAIN"] = basicNodeValue(playdata, "Song");
		            dict["PLAYBACK_SUB"] = basicNodeValue(playdata, "Artist");
		            dict["PLAYBACK_ELAPSED"] = basicNodeValue(playdata, "Elapsed");
		            dict["PLAYBACK_STATUS"] = basicNodeValue(playdata, "Playback_Info");
		          }
		        });
		      }*/
		    } else {
		    	info.error = "Error " + err;
		    }
		    callback(info);
		  });
	};

	this.getInputsAndScenes = function (callback) {
		// Get list from controller API
		this.sendRequest("GET", "<Main_Zone><Scene><Scene_Sel_Item>GetParam</Scene_Sel_Item></Scene></Main_Zone>", function (err, data) {
		    if (data) 
		    {
		      var lastid = parseInt(data.substring(data.lastIndexOf("Item_") + 5, data.lastIndexOf("Item_") + 7));

			  var inputList = [];
			  var sceneList = [];
		      for(var i = 1; i <= lastid; i++) {
		        var item = basicNodeValue(data, "Item_" + i);
		        
		        if (basicNodeValue(item, "RW") === 'W') {
		          // it is a scene
		        	sceneList.push({
			        	param: basicNodeValue(item, "Param"),
			        	title: basicNodeValue(item, "Title")
			          });
		        } else {
		          // it is an input
		        	inputList.push({
			        	param: basicNodeValue(item, "Param"),
			        	title: basicNodeValue(item, "Title")
			          });
		        }
		      }
		      callback(inputList, sceneList);
		    } 
		    else 
		    {
		    	callback(null, null);
		    }
		  });
	};

	this.powerToggle = function (callback) {
		this.sendRequest("PUT", "<Main_Zone><Power_Control><Power>On/Standby</Power></Power_Control></Main_Zone>", callback);
	};

	this.setVolume = function(value, callback) {
		this.sendRequest("PUT", "<Main_Zone><Volume><Lvl><Val>" + value * 10 + "</Val><Exp>1</Exp><Unit>dB</Unit></Lvl></Volume></Main_Zone>", callback);
	};

	this.muteToggle = function (callback) {
		this.sendRequest("PUT", "<Main_Zone><Volume><Mute>On/Off</Mute></Volume></Main_Zone>", callback);
	};

	this.switchInput = function (value, callback) {
		this.sendRequest("PUT", "<Main_Zone><Input><Input_Sel>" + value + "</Input_Sel></Input></Main_Zone>", callback);
	};

	this.playbackControl = function (value, callback) {
		this.sendRequest("PUT", "<Main_Zone><Play_Control><Playback>" + value + "</Playback></Play_Control></Main_Zone>", callback);
	};
}