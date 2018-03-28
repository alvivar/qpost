"""
    Qpost

    Python Eel application that analyzes images from a folder and create a Qbot
    compatible json ready to be used.
"""

import fnmatch
import hashlib
import json
import os
import shutil
import sys
import time

import eel

HOME = os.path.normpath(  # The script directory + cxfreeze compatibility
    os.path.dirname(
        sys.executable if getattr(sys, 'frozen', False) else __file__))

eel.init('eeldata')


@eel.expose
def flatname(name, md5it=False):
    """
        Return a lowercase alpha numeric only version of 'name'. 'md5it' will
        return the md5 hash of flat version of 'name'.

        e.g. 'D:\Dropbox\Public\games\gif' -> 'ddropboxpublicgamesgif'
    """

    flat = ''.join(i for i in name if i.isalnum()).lower()
    flat = hashlib.md5(name.encode('utf-8')).hexdigest() if md5it else flat
    return flat


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
def copytree(source, filesfilter=['*'], dirs=['eeldata', 'cache']):
    """
        Copy all files from the path into application directory. Return the
        name of the local path with the files.

        'filesfilter' is a file name pattern list of allowed files.
    """

    destiny = hashlib.md5(flatname(source).encode('utf-8')).hexdigest()
    destiny_path = os.path.join(HOME, *dirs, destiny)

    if os.path.exists(destiny_path):
        shutil.rmtree(destiny_path)
    shutil.copytree(source, destiny_path, ignore=allow_patterns(*filesfilter))

    return destiny_path


@eel.expose
def savepathfile(path, data, dirs=['eeldata', 'config']):
    """
        Create a json file with a unique name based on the 'path' that will
        contain the 'data'.
    """

    filepath = os.path.join(HOME, *dirs)
    if not os.path.exists(filepath):
        os.makedirs(filepath)

    name = hashlib.md5(flatname(path).encode('utf-8')).hexdigest()
    filename = os.path.join(filepath, name + '.json')

    with open(filename, 'w') as f:
        json.dump(data, f)


@eel.expose
def loadpathfile(path, dirs=['eeldata', 'config']):
    """
        Return the data from the json file related to the 'path', cleaning
        files that doesn't exist.
    """

    filepath = os.path.join(HOME, *dirs)
    name = hashlib.md5(flatname(path).encode('utf-8')).hexdigest()
    filename = os.path.join(filepath, name + '.json')

    try:
        with open(filename, 'r') as f:
            data = json.load(f)
    except (IOError, ValueError):
        data = []
    cleaned = [i for i in data if os.path.isfile(i['file'])]

    return cleaned


@eel.expose
def saveqbotfile(path):
    """
        Update a Qbot file on the same path that contains the images and text
        in the correct order and ready to be tweeted.
    """

    pathdata = loadpathfile(path)

    qbot = {'messages': []}
    for data in pathdata:
        if not data['ignore']:
            qbot['messages'].append({
                'text': data['text'],
                'image': data['file']
            })

    qbotpath = os.path.join(path, 'qbot.json')
    with open(qbotpath, 'w') as f:
        json.dump(qbot, f)


@eel.expose
def saveconfigfile(data, dirs=['eeldata', 'config']):
    """
        Save the data into the json file.
    """

    filepath = os.path.join(HOME, *dirs)
    if not os.path.exists(filepath):
        os.makedirs(filepath)

    filename = os.path.join(filepath, 'app.json')

    with open(filename, 'w') as f:
        json.dump(data, f)


@eel.expose
def loadconfigfile(dirs=['eeldata', 'config']):
    """
        Return the data from the json file.
    """

    filepath = os.path.join(HOME, *dirs)
    filename = os.path.join(filepath, 'app.json')

    try:
        with open(filename, 'r') as f:
            data = json.load(f)
    except (IOError, ValueError):
        data = {'recentPaths': []}

    return data


@eel.expose
def deleteFiles(files):
    """
        Delete the files.
    """
    for f in files:
        if os.path.isfile(f):
            os.remove(f)


eel.start('app.html', size=(600, 10000))
