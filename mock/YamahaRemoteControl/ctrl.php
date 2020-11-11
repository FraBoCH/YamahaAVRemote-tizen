<?php
function logMessage($level, $message)
{
	//if (strpos("DEBUG,INFO", $level) == 0)
	//	return;
	
	$time = @date('[d/M/Y:H:i:s]');
	$log = fopen('/volume1/web/YamahaRemoteControl/requests.log', 'a');
	fwrite($log, "($time) $level : $message". PHP_EOL);
	fclose($log);
}

$volume = apc_fetch("vol");
if (!$volume) { $volume = "-500"; }
$power = apc_fetch("power");
if (!$power) { $power = "On"; }
$input = apc_fetch("input");
if (!$input) { $input = "HDMI1"; }
$mute = apc_fetch("mute");
if (!$mute) { $mute = "Off"; }
logMessage("DEBUG", "Variables are power = $power, volume = $volume, input = $input, mute = $mute");

$request = file_get_contents('php://input');
try 
{
	if (strpos ($request, "<Basic_Status>GetParam</Basic_Status>") > 0) { 
		logMessage("DEBUG", "Get basic info");
	?>
		<Volume><Lvl><Val><?= $volume ?></Val></Lvl></Volume>
		<Power_Control><Power><?= $power ?></Power></Power_Control>
		<Mute><?= $mute ?></Mute>
		<Input_Sel><?= $input ?></Input_Sel>
		<Title><?= $input ?></Title>
	<?
	} else if (strpos ($request, "<Scene_Sel_Item>GetParam</Scene_Sel_Item>") > 0) { 
		logMessage("DEBUG", "Get scenes");
	?>
		<Item_1>
			<RW>R</RW>
			<Param>HDMI1</Param>
			<Title>HDMI1</Title>
		</Item_1>
		<Item_2>
			<RW>R</RW>
			<Param>HDMI2</Param>
			<Title>HDMI2</Title>
		</Item_2>
		<Item_3>
			<RW>R</RW>
			<Param>HDMI3</Param>
			<Title>HDMI3</Title>
		</Item_3>
	<?
	} else if (strpos ($request, "PUT") > 0) {
		// store value in cache
		if (strpos($request, "<Power_Control><Power>On/Standby</Power></Power_Control>") > 0)
		{
			if ($power == "On")
				apc_store("power", "Standby");
			else 
				apc_store("power", "On");

			logMessage("INFO", "Store power in cache : $power");
		}
		else if (strpos($request, "<Volume><Lvl><Val>") > 0)
		{
			$volume = substr($request, strpos($request, "<Volume><Lvl><Val>") + 18, 4);
			if ($volume == "0</V") $volume = "000";
			apc_store("vol", $volume);
			logMessage("INFO", "Store volume in cache : $volume");
		}
		else if (strpos($request, "<Volume><Mute>On/Off</Mute></Volume>") > 0)
		{
			if ($mute == "On")
				apc_store("mute", "Off");
			else 
				apc_store("mute", "On");

			logMessage("INFO", "Store mute in cache : $mute");
		}
		else if (strpos($request, "<Input><Input_Sel>") > 0)
		{
			$input = substr($request, strpos($request, "<Input><Input_Sel>") + 18, 5);
			apc_store("input", $input);
			logMessage("INFO", "Store input in cache : $input");
		}
		else {
			logMessage("ERROR", "Unknown PUT request : $request");
		}
		
		http_response_code (200);
	} 
	else 
	{
		throw new Exception("Unknown request : $request");
	}
	
} catch (Exception $e) {
	logMessage("ERROR", $e->getMessage());
	http_response_code (400);
}
?>