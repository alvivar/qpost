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
def get_files_dirs(path):
    """
        Return a tuple with 2 values, first a list of all files, second a list
        of all directories.
    """

    files = []
    dirs = []
    for root, ds, fs in os.walk(path, topdown=False):
        for file_name in fs:
            files.append(os.path.join(root, file_name))
        for dir_name in ds:
            dirs.append(os.path.join(root, dir_name))

    return files, dirs


eel.start('app.html', size=(600, 300))

# print(get_files_dirs(r'D:\Dropbox\Public\games\gif'))
