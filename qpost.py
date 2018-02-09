"""
    Qpost

    Python Eel application that analyzes images from a folder and create a Qbot
    compatible json ready to be used.
"""

import eel

eel.init('web')
eel.start('app.html', size=(550, 300))
