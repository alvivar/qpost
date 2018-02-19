"""
    Qpost

    Python Eel application that analyzes images from a folder and create a Qbot
    compatible json ready to be used.
"""

import fnmatch
import os
import shutil
import sys
import time

import eel

HOME = os.path.normpath(  # The script directory + cxfreeze compatibility
    os.path.dirname(
        sys.executable if getattr(sys, 'frozen', False) else __file__))

eel.init('web')


@eel.expose
def get_files_dirs(path, filesfilter=['*']):
    """
        Return a tuple with 2 values, first a list of all files, second a list
        of all directories.

        'filesfilter' is a list of file name patterns e.g. '*.gif' used to
        filter the files results.
    """

    files = []
    dirs = []
    for root, ds, fs in os.walk(path, topdown=False):
        for file_name in fs:
            files.append(os.path.join(root, file_name))
        for dir_name in ds:
            dirs.append(os.path.join(root, dir_name))

    filtered_files = []
    for pattern in filesfilter:
        filtered_files.extend(fnmatch.filter(files, pattern))
    files = filtered_files

    return files, dirs


def allow_patterns(*patterns):
    """
        Function that can be used as copytree() ignore parameter.

        Patterns is a sequence of glob-style patterns that are used to exclude
        files that don't match.
    """

    def _ignore_patterns(path, names):

        files_only = [
            name for name in names
            if not os.path.isdir(os.path.join(path, name))
        ]

        allowed_files = []
        for pattern in patterns:
            allowed_files.extend(fnmatch.filter(files_only, pattern))

        ignore_others = set(files_only) - set(allowed_files)
        return ignore_others

    return _ignore_patterns


@eel.expose
def copytree(source, filesfilter=['*']):
    """
        Copy all files from the path into application directory.
    """

    destiny = ''.join(i for i in source if i.isalnum()).lower()
    destiny_path = os.path.join(HOME, 'images', destiny)
    if os.path.exists(destiny_path):
        shutil.rmtree(destiny_path)
    shutil.copytree(source, destiny_path, ignore=allow_patterns(*filesfilter))


# copytree(r'D:\Dropbox\Public\games\gif\haldronmoon')

eel.start('app.html', size=(700, 500))
