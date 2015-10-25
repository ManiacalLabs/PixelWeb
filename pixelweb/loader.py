import md5
import sys
import os.path
import imp
import traceback
import glob
import status

def load_package(path, base):
    try:
        try:
            sys.path.append(path + "/" + base)
            init = path + "/" + base + "/__init__.py"
            if not os.path.exists(init):
                return None

            fin = open(init, 'rb')

            return  (base, imp.load_source(base, init, fin))
        finally:
            try: fin.close()
            except: pass
    except ImportError, x:
        traceback.print_exc(file = sys.stderr)
        raise
    except:
        traceback.print_exc(file = sys.stderr)
        raise

def load_module(path):
    try:
        try:
            code_dir = os.path.dirname(path)
            code_file = os.path.basename(path)
            base = code_file.replace(".py", "")

            fin = open(path, 'rb')

            hash = md5.new(path).hexdigest() + "_" + code_file
            return  (base, imp.load_source(base, path, fin))
        except Exception, e:
            status.pushError("Error loading {}".format(path))
            status.pushError(e)
            return (None, None)
        finally:
            try: fin.close()
            except: pass
    except ImportError, x:
        traceback.print_exc(file = sys.stderr)
        raise
    except:
        traceback.print_exc(file = sys.stderr)
        raise

def load_folder(dir):
    sys.path.append(dir)
    mods = []
    status.pushStatus("Scanning: {}".format(dir))

    # for p in glob.glob(dir + "/*/"):
    #     base = p.replace("\\", "").replace("/", "")
    #     base = base.replace(dir.replace("\\", "").replace("/", ""), "")
    #     package = load_package(dir, base)
    #     if package:
    #         hash, pack = package
    #         mods[hash] = pack

    for m in glob.glob(dir + "/*.py"):
        hash, mod = load_module(m)
        if mod:
            mods.append(mod)

    return mods
