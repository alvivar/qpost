"""
    Qpost

    Python Eel application that analyzes images from a folder and create a Qbot
    compatible json ready to be used.
"""

import os
import time

import eel

eel.init('web')


@eel.expose
def cleantime():
    return round(time.time())


@eel.expose
def get_files_dirs(path, allow=[]):
    """
        Return a tuple with 2 values, first a list of all files, second a list
        of all directories.

        'allow' a list of words used to filter the results. Files and
        directories should contain at least one word.
    """

    files = []
    dirs = []
    for root, ds, fs in os.walk(path, topdown=False):
        for file_name in fs:
            files.append(os.path.join(root, file_name))
        for dir_name in ds:
            dirs.append(os.path.join(root, dir_name))

    if allow:
        files = [f for f in files if any(word in f for word in allow)]
        dirs = [d for d in dirs if any(word in d for word in allow)]

    return files, dirs


# files, dirs = get_files_dirs(r'D:\Dropbox\Public\games\gif', ['.gif'])
# for f in files:
#     print(f)

eel.start('app.html', size=(700, 500))
