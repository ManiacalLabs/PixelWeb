from __future__ import with_statement
import os, sys
from os.path import join as pjoin, splitext, split as psplit
from distutils.core import setup
from distutils.command.install_scripts import install_scripts
from distutils.command.install import install as _install
from distutils import log

BAT_TEMPLATE = \
r"""@echo off
REM wrapper to use shebang first line of {FNAME}
set mypath=%~dp0
set pyscript="%mypath%{FNAME}"
set /p line1=<%pyscript%
if "%line1:~0,2%" == "#!" (goto :goodstart)
echo First line of %pyscript% does not start with "#!"
exit /b 1
:goodstart
set py_exe=%line1:~2%
call "%py_exe%" %pyscript% %*
"""


class do_install_scripts(install_scripts):
    def run(self):
        install_scripts.run(self)
        if not os.name == "nt":
            return
        for filepath in self.get_outputs():
            # If we can find an executable name in the #! top line of the script
            # file, make .bat wrapper for script.
            with open(filepath, 'rt') as fobj:
                first_line = fobj.readline()
            if not (first_line.startswith('#!') and
                    'python' in first_line.lower()):
                log.info("No #!python executable found, skipping .bat "
                            "wrapper")
                continue
            pth, fname = psplit(filepath)
            froot, ext = splitext(fname)
            bat_file = pjoin(pth, froot + '.bat')
            bat_contents = BAT_TEMPLATE.replace('{FNAME}', fname)
            log.info("Making %s wrapper for %s" % (bat_file, filepath))
            if self.dry_run:
                continue
            with open(bat_file, 'wt') as fobj:
                fobj.write(bat_contents)


data_dirs = []
for root, dirs, files in os.walk("./pixelweb/ui"):
    base = root.replace("\\","/").replace("./pixelweb/", "")
    for f in files:
        data_dirs.append(base + "/" + f)

setup(
    name='PixelWeb',
    version='1.0b8',
    description='PixelWeb is a flexible web-based UI for BiblioPixel',
    author='Adam Haile',
    author_email='adam@maniacallabs.com',
    url='http://github.com/maniacallabs/pixelweb/',
    license='MIT',
    packages=['pixelweb'],
    scripts=['run-pixelweb', 'pixelweb_genmanifest'],
    package_data = {'pixelweb' : data_dirs},
    cmdclass = {'install_scripts': do_install_scripts},
    classifiers = [
        'Development Status :: 4 - Beta',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        ],
    )
