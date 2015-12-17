import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

min_bp_ver = (2,0,5)
min_serial_ver = (2,7)

import sys
if sys.version_info[:3] < (2, 7):
    sys.exit('PixelWeb requires Python 2.7 or higher.')

try:
    import pip
except:
    sys.exit("Please install pip: https://bootstrap.pypa.io/get-pip.py")

import os
from subprocess import Popen, PIPE

def runCommand(cmd):
    cmd_list = cmd.split(' ')
    process = Popen(cmd_list, stdout=PIPE)
    output, err = process.communicate()
    exit_code = process.wait()
    return (err, exit_code, output)

_bootstrap_installs = {
    "BiblioPixel": "pip install BiblioPixel --upgrade",
    "BiblioPixelAnimations": "pip install https://github.com/ManiacalLabs/BiblioPixelAnimations/archive/master.zip --upgrade",
    "pyserial": "pip install pyserial --upgrade",
    "cherrypy": "pip install cherrypy --upgrade"
}

def doInstall(mod):
    if not mod in _bootstrap_installs: sys.exit("Invalid package name: " + mod)
    print "Installing " + mod
    err, code, output = runCommand(_bootstrap_installs[mod])
    print output
    if code != 0:
        sys.exit("Fatal error installing " + mod)

def checkBPVersion(ver):
    ver = tuple([int(i) for i in ver.split('.')])
    return ver >= min_bp_ver

def checkSerialVersion(ver):
    ver = tuple([int(i) for i in ver.split('.')])
    return ver >= min_serial_ver

def runBootstrap(upgrade = False):
    upgrade = ("--update-depends" in sys.argv)
    up_bpa = ("--update-bpa" in sys.argv)
    if upgrade:
        doInstall("BiblioPixel")
        doInstall("BiblioPixelAnimations")
        doInstall("pyserial")
    elif up_bpa:
        doInstall("BiblioPixelAnimations")
    else:
        try:
            import bibliopixel
            if not checkBPVersion(bibliopixel.VERSION):
                doInstall("BiblioPixel")
                reload(bibliopixel)
        except:
            doInstall("BiblioPixel")

        try:
            import BiblioPixelAnimations
        except:
            doInstall("BiblioPixelAnimations")

        try:
            import serial
            if not checkSerialVersion(serial.VERSION):
                doInstall("pyserial")
                reload(serial)
        except:
            doInstall("pyserial")

        # try:
        #     import cherrypy
        # except:
        #     doInstall("cherrypy")

    try:
        import bibliopixel
        import BiblioPixelAnimations
        import serial
    except ImportError, e:
        sys.exit("Fatal Error in Install/Import process: " + str(e))

if __name__ == '__main__':
    upgrade = (len(sys.argv) > 1 and sys.argv[1] == "--upgrade")
    runBootstrap(upgrade)
