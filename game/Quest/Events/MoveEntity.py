import sys
sys.path.append("..")
from Quest.Event import Event
from Entity.Entity import Entity

class MoveEntity(Event):
    def __init__(self, entity, destination):
        self.entity = entity
        self.destination = destination
        pass

    def do(self):
        self.entity.move(self.destination)

    def printItself(self):
        super()
        print(":MoveEntity")
