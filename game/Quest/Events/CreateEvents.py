import sys
import os
sys.path.append("..")
from Quest.Event import Event
from Entity.Entity import Entity
from GetGame import GetGame

class CreateLock(Event):
    def __init__(self, path, message="Cet endroit est verrouillé."):
        self.path = path
        self.message = message
        pass

    def do(self):
        with open(self.path+"/.lock", 'w') as f:
            f.write(self.message)

class CreateLore(Event):
    def __init__(self, path, message):
        self.path = path
        self.message = message
        pass

    def do(self):
        with open(os.path.abspath(GetGame.game.root+"/"+self.path+"/.lore"), 'w', encoding='utf-8') as f:
            f.write(self.message)

    def printItself(self):
        super()
        print(":CreateLore")

class CreateEntity(Event):
    def __init__(self, entity):
        self.entity = entity
        pass

    def do(self):
        self.entity.create()

    def printItself(self):
        super()
        print(":CreateEntity")

class CreateCharacter(Event):
    def __init__(self, charac):
        self.charac = charac
        pass

    def do(self):
        self.charac.toFile()

    def printItself(self):
        super()
        print(":CreateCharacter")