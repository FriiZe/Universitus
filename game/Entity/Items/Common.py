import sys
sys.path.append("..")
from Entity.Entity import Entity

class Rock(Entity):
    def __init__(self, worldPath):
        Entity.__init__(self, "Rock", worldPath)
        pass

class Paper(Entity):
    def __init__(self, worldPath):
        Entity.__init__(self, "Paper", worldPath)
        pass

class Scissors(Entity):
    def __init__(self, worldPath):
        Entity.__init__(self, "Scissors", worldPath)
        pass