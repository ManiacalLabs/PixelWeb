import globals
from util import *
import traceback, sys
import status

import bibliopixel.log as log

from threading import Timer

from bpmanager import *
bpm = None

def initBPM():
	status.pushStatus("Initializing BiblioPixel")
	server_config=globals._server_config

	if globals._bpm:
		status.pushStatus("Stopping current config")
		globals._bpm.stopConfig()

	global bpm
	bpm = globals._bpm = BPManager(server_config.off_anim_time)
	status.pushStatus("Loading modules")
	globals._bpm.loadBaseMods()
	globals._bpm.loadMods()
	cfg = config.readConfig("current_setup")
	if "controller" in cfg and "driver" in cfg and server_config.load_defaults:
		bpm.startConfig(cfg.driver, cfg.controller)
	status.pushStatus("BiblioPixel Init Complete")

fillColor = (0,0,0)
def setColor(req):
	global fillColor
	fillColor = colors.hex2rgb(req['color'])
	bpm.led.fill(fillColor)
	bpm.led.update()
	return success(None)

def setBrightness(req):
	try:
		bpm.led.setMasterBrightness(req['level'])
		bpm.led.fill(fillColor)
		bpm.led.update()
	except Exception, e:
		return fail(traceback.format_exc(), error=ErrorCode.BP_ERROR, data=None)
	return success(None)


def getDrivers(req):
	return success({"drivers":bpm.drivers, "names":bpm._driverNames})

def getControllers(req):
	return success({"controllers":bpm.controllers, "names":bpm._contNames})

def getAnims(req):
	return success({"anims":bpm.anims, "run":bpm.animRunParams, "names":bpm._animNames})

def startConfig(req):
	try:
		result = bpm.startConfig(req['drivers'], req['controller'])
		if result.status:
			return success()
		else:
			return result
	except:
		return fail(traceback.format_exc(), error=ErrorCode.BP_ERROR, data=None)

def startAnim(req):
	try:
		result = bpm.startAnim(req['config'])
		if result.status:
			return success()
		else:
			return result
	except:
		return fail(traceback.format_exc(), error=ErrorCode.BP_ERROR, data=None)

def stopAnim(req):
	bpm.stopAnim()
	return success()

def getConfig(req):
	return success(bpm.getConfig())

def getServerConfig(req):
	return success({
		"setup":config.BASE_SERVER_CONFIG,
		"config":{
			"id": "server_config",
			"config": globals._server_config
			}
		})

def saveServerConfig(req):
	config.writeServerConfig(req["config"])
	cfg = d(req["config"])
	level = log.INFO
	if cfg.show_debug: level = log.DEBUG
	log.setLogLevel(level)
	globals._server_config = cfg
	return success()

def getStatus(req):
	return success(data=status.dumpStatus())

def getErrors(req):
	return success(data=status.dumpErrors())

def savePreset(req):
	cfg = config.readConfig("presets", key=req.type)
	cfg[req.name] = req.data
	config.writeConfig("presets", cfg, key=req.type)
	return success()

def deletePreset(req):
	cfg = config.readConfig("presets", key=req.type)
	if req.name in cfg:
		del cfg[req.name]
		config.writeConfig("presets", cfg, key=req.type)
	return success()

def getPresets(req):
	if "type" not in req:
		req.type = None
	cfg = config.readConfig("presets", key=req.type)
	return success(data=cfg)

def saveQueue(req):
	cfg = config.readConfig("queues")
	cfg[req.name] = req.data
	config.writeConfig("queues", cfg)
	return success()

def deleteQueue(req):
	cfg = config.readConfig("queues")
	if req.name in cfg:
		del cfg[req.name]
		config.writeConfig("queues", cfg)
	return success()

def getQueues(req):
	cfg = config.readConfig("queues")
	return success(data=cfg)

def saveQS(req):
	cfg = config.readConfig("quick_select")
	cfg[req.name] = req.data
	config.writeConfig("quick_select", cfg)
	return success()

def getQS(req):
	name = None
	if "name" in req:
		name = req.name
	cfg = config.readConfig("quick_select", key=name)
	if("name" in req and "name" not in cfg): cfg = None
	return success(data=cfg)

def deleteQS(req):
	cfg = config.readConfig("quick_select")
	if req.name in cfg:
		del cfg[req.name]
		config.writeConfig("quick_select", cfg)
	return success()

def _shutdownServer():
	status.pushStatus("Shutting down server")
	globals._server_obj.shutdown()

def shutdownServer(req):
	t = Timer(0.5, _shutdownServer)
	t.start()
	return success(data=None)

def restartServer(req):
	globals._running = True
	t = Timer(0.5, _shutdownServer)
	t.start()
	return success(data=None)

def reloadBP(req):
	initBPM()
	return success(data=None)

actions = {
	'setColor' : [setColor, ['color']],
	'setBrightness' : [setBrightness, ['level']],
	'getDrivers' : [getDrivers, []],
	'getControllers' : [getControllers, []],
	'getAnims' : [getAnims, []],
	'startConfig': [startConfig, ['drivers', 'controller']],
	'startAnim': [startAnim, ['config']],
	'stopAnim': [stopAnim, []],
	'getConfig': [getConfig, []],
	'getServerConfig': [getServerConfig, []],
	'saveServerConfig': [saveServerConfig, ["config"]],
	'getStatus': [getStatus, []],
	'getErrors': [getErrors, []],
	'savePreset': [savePreset, ['type', 'name', 'data']],
	'deletePreset': [deletePreset, ['type', 'name']],
	'getPresets': [getPresets, []],
	'saveQueue': [saveQueue, ['name', 'data']],
	'deleteQueue': [deleteQueue, ['name']],
	'getQueues': [getQueues, []],
	'saveQS': [saveQS, ['name', 'data']],
	'getQS': [getQS, []],
	'deleteQS': [deleteQS, ['name']],
	# 'shutdownServer': [shutdownServer, []],
	# 'restartServer': [restartServer, []],
	'reloadBP': [reloadBP, []],
}
