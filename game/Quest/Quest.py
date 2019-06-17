from Quest.Event import Event
from Quest.Condition import Condition
from Quest.Conditions.EntityExists import EntityExists
from Quest.Conditions.PlaceExists import PlaceExists
from Quest.Conditions.CurrentPlayerDirectory import CurrentPlayerDirectory
from Quest.Conditions.CurrentDialogueChoice import CurrentDialogueChoice
from Quest.Events.CreateEvents import *
from Quest.Events.RemoveEvents import *
from Quest.Events.DialogueEvents import *
from Quest.Events.MoveEntity import MoveEntity
from Entity.Items.Common import *
from Entity.Character import *
from Entity.Characteristic import *
from enum import Enum

class QuestStatus(Enum):
    UNAVAILABLE = 0 # Cannot be started
    AVAILABLE = 1 # Can be started (unlocked by other quests)
    STARTED = 2
    ENDED = 3

class Quest :
    def __init__(self, filename) :
        evalSeparator = '|'

        with open("Quests/"+filename, encoding="UTF-8") as file:
            self.status = QuestStatus.UNAVAILABLE
            self.onStart = []
            self.onResolve = []
            self.steps = []
            self.conditions = []
            self.next = []


            for line in file.readlines():
                parts = line.split(':')
                attr = parts.pop(0)
                left = (":".join(parts)).strip()
                
                if(attr == "name"):
                    if(left != 'none'):
                        self.name = left.split('\n')[0]
                    else:
                        raise Exception
                    continue
                if(attr == "description"):
                    if(left != 'none'):
                        self.description = left.split('\n')[0]
                    continue
                if(attr == "onStart"):
                    if(left != 'none'):
                        for event in left.split(evalSeparator):
                            self.onStart.append(eval(event))
                if(attr == "onResolve"):
                    if(left != 'none'):
                        for event in left.split(evalSeparator):
                            self.onResolve.append(eval(event))
                if(attr == "steps"):
                    if(left != 'none'):
                        for quest in left.split(evalSeparator):
                            self.steps.append(quest)
                if(attr == "conditions"):
                    if(left != 'none'):
                        for condition in left.split(evalSeparator):
                            self.conditions.append(condition)
                if(attr == "next"):
                    if(left != 'none'):
                        for quest in left.split(evalSeparator):
                            self.next.append(quest)
                    continue

    def setAvailable(self):
        self.status = QuestStatus.AVAILABLE

    def evalConditions(self):
        evals = []
        for condition in self.conditions:
            invert = False
            toEval = condition

            sp = condition.split(' ')
            check = sp[0]
            if(check == "not"):
                invert = True
                sp.pop(0)
                toEval = "".join(sp)

            cond = eval(toEval)
            met = cond.met()
            evals.append((not invert and met) or (invert and not met))
            
        for ev in evals:
            if not ev:
                return False
        return True

    def isResolved(self):
        if self.status == QuestStatus.ENDED:
            return True
        if not self.evalConditions():
            return False
        
        for step in self.steps:
            if not step.isResolved():
                return False

        return True

    def tryResolve(self):
        if not self.status == QuestStatus.ENDED and self.isResolved():
            nextQuests = self.resolve()
            return True,nextQuests
        return False,[]

    def start(self):
        if self.status == QuestStatus.AVAILABLE:
            self.status = QuestStatus.STARTED
            for event in self.onStart:
                event.do()

    def resolve(self):
        nextQuests = []

        if self.status == QuestStatus.STARTED:
            self.status = QuestStatus.ENDED

            print(u"\u001b[32mQuête complétée : \u001b[0m"+self.name)

            for event in self.onResolve:
                event.do()

            for quest in self.next:
                nextQuests.append(quest)
            
        return nextQuests

            
    
