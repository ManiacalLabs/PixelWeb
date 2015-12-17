from bootstrap import runBootstrap
runBootstrap()

import json, os
import globals, config, status

from bottle import *
from actions import *

import bibliopixel.log as log

import BiblioPixelAnimations

class StoppableServer(WSGIRefServer):
    def run(self, app): # pragma: no cover
        from wsgiref.simple_server import WSGIRequestHandler, WSGIServer
        from wsgiref.simple_server import make_server
        import socket

        class FixedHandler(WSGIRequestHandler):
            def address_string(self): # Prevent reverse DNS lookups please.
                return self.client_address[0]
            def log_request(*args, **kw):
                if not self.quiet:
                    return WSGIRequestHandler.log_request(*args, **kw)

        handler_cls = self.options.get('handler_class', FixedHandler)
        server_cls  = self.options.get('server_class', WSGIServer)

        if ':' in self.host: # Fix wsgiref for IPv6 addresses.
            if getattr(server_cls, 'address_family') == socket.AF_INET:
                class server_cls(server_cls):
                    address_family = socket.AF_INET6

        srv = make_server(self.host, self.port, app, server_cls, handler_cls)
        self.srv = srv ### THIS IS THE ONLY CHANGE TO THE ORIGINAL CLASS METHOD!
        srv.serve_forever()

    def shutdown(self): ### ADD SHUTDOWN METHOD.
        self.srv.shutdown()
        # self.server.server_close()

# @route('/')
def home():
    return static_file("index.html", root='./ui/')

# @route('/qs/<name>')
def qs(name):
    return static_file("qs.html", root='./ui/')

# @route('/<filename:path>')
def getFiles(filename):
    return static_file(filename, root='./ui/')

# @route('/api')
def postonly():
    return "Please use POST JSON API calls only."

def doAPI(req):
    try:
        if req and'action' in req:
            if req['action'] in actions:
                action = actions[req['action']]
                # status.pushStatus("API: " + req['action'])
                params = action[1][:]
                valid = True
                missing = []
                for p in params:
                    if not p in req:
                        valid = False
                        missing.append(p)

                if not valid:
                    return fail("Missing parameters.", data=missing)

                return action[0](req)

            else:
                return fail("Invalid action.")
        else:
            return fail("Invalid request data.")
    except Exception, e:
        status.pushError(traceback.format_exc())
        return fail(str(e), error=ErrorCode.GENERAL_ERROR, data=None)

# @route('/api', method='POST')
def api():
    req = d(request.json)
    result = doAPI(req)
    if not result.status:
        status.pushError(result.msg)
    return result

def setupRouting(app):
    app.route('/', 'GET', home)
    app.route('/qs/<name>', 'GET', qs)
    app.route('/<filename:path>', 'GET', getFiles)
    app.route('/api', 'GET', postonly)
    app.route('/api', 'POST', api)

def startup():
    bpa_path = os.path.dirname(os.path.abspath(BiblioPixelAnimations.__file__)).replace("\\", "/")
    bpa_matrix = bpa_path + "/matrix/"
    bpa_strip = bpa_path + "/strip/"

    status.pushStatus("Starting PixelWeb Server")
    config.initConfig()
    status.pushStatus("Reading server config")
    config.upgradeServerConfig()
    cfg = globals._server_config = config.readServerConfig()
    # if(bpa_matrix not in cfg.mod_dirs): cfg.mod_dirs.append(bpa_matrix)
    # if(bpa_strip not in cfg.mod_dirs): cfg.mod_dirs.append(bpa_strip)

    globals._bpa_dirs = [bpa_matrix, bpa_strip]

    level = log.INFO
    if cfg.show_debug: level = log.DEBUG
    log.setLogLevel(level)

    initBPM()

def startServer():
    while globals._running:
        try:
            startup()

            host = "127.0.0.1"
            if globals._server_config.external_access:
                host = "0.0.0.0"

            app = default_app()
            setupRouting(app)
            server = "wsgiref"
            try:
                import cherrypy
                server = "cherrypy"
                print "Using CherryPy for Server"
            except:
                pass

            globals._server_obj = StoppableServer(host=host, port=globals._server_config.port, server=server)
            globals._running = False
            app.run(server=globals._server_obj)
        except Exception, e:
            print e
            globals._running = False

if __name__ == '__main__':
    startServer()
