"""
    Qpost

    Python Eel application that analyzes images from a folder and create a Qbot
    compatible json ready to be used.
"""

import eel
import time

eel.init('web')


@eel.expose
def cleantime():
    return str(round(time.time()))


print(cleantime())
eel.start('app.html', size=(600, 300))
