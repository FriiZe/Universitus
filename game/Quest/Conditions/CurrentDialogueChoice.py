import sys
sys.path.append("..")
from Quest.Condition import Condition
from GetGame import GetGame
import os

class CurrentDialogueChoice(Condition):
    def __init__(self, npc, dialogue):
        self.npc = npc
        dialogueTreated = []
        for d in dialogue:
            dialogueTreated.append(d.replace("{username}", GetGame.game.user_name))
        self.dialogue = dialogueTreated
        pass

    def met(self):
        if not self.npc in GetGame.game.dialogues:
            return False
        return GetGame.game.dialogues[self.npc] == self.dialogue

    def printItself(self):
        super()
        print(":CurrentDialogueChoice")
