import sys
sys.path.append("..")
from Quest.Condition import Condition

class PlaceExists(Condition):
    def __init__(self):
        pass

    def met(self):
        return True # system call to check a folder

    def printItself(self):
        super()
        print(":PlaceExists")
