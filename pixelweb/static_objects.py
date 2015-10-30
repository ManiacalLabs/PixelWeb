import bibliopixel.led as led

controllers = [
	led
]

import bibliopixel.drivers.visualizer as visualizer
import bibliopixel.drivers.network as network

try:
	import bibliopixel.drivers.serial_driver as serial_driver
except:
	serial_driver = None

import glob
if len(glob.glob("/dev/spi*")) > 0:
	import bibliopixel.drivers.APA102 as APA102
	import bibliopixel.drivers.LPD8806 as LPD8806
	import bibliopixel.drivers.WS2801 as WS2801
else:
	APA102 = LPD8806 = WS2801 = None

drivers = [
	visualizer,
	serial_driver,
	APA102,
	LPD8806,
	WS2801,
	network
]

moduleList = []
moduleList.extend(controllers)
moduleList.extend(drivers)
if None in moduleList:
	moduleList.remove(None)
