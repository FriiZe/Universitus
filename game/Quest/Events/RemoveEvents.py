import sys
import os
sys.path.append("..")
from Quest.Event import Event
from Entity.Entity import Entity

class CreateLock(Event):
    def __init__(self, path):
        self.path = path
        pass

    def do(self):
        os.remove(self.path)

    def printItself(self):
        super()
        print(":RemoveLock")

class RemoveLore(Event):
    def __init__(self, path):
        self.path = path
        pass

    def do(self):
        os.remove(self.path)

    def printItself(self):
        super()
        print(":RemoveLore")

class RemoveEntity(Event):
    def __init__(self, entity):
        self.entity = entity
        pass

    def do(self):
        self.entity.remove()

    def printItself(self):
        super()
        print(":RemoveEntity")
