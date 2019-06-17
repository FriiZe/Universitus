import os

from Quest.Quest import *
from Command.Command import *
from Entity.Items.Common import *
from GetGame import GetGame

class Game :

    root = ''
    gameRoot = os.getcwd()

    forbiddenCommands = ["help"]

    def __init__(self) :
        GetGame.game = self
        self.user_name = input("Veuillez saisir un nom d'utilisateur: ")
        self.quests = {}
        self.activeQuests = {}
        self.dialogues = {}

        for subdir, dirs, files in os.walk("Quests"):
            for file in files:
                ext = os.path.splitext(file)[-1].lower()
                if ext == ".quest":
                    self.quests[file[:-6]] = Quest(file)

    def startQuest(self, name):
        quest = self.quests[name]
        print(u"\u001b[35mNouvelle quête : \u001b[0m"+quest.name, end="\\n")
        print(quest.description, end="\\n\\n")
        quest.start()
        self.activeQuests[name] = quest

    def checkQuests(self):
        toDelete = []
        toStart = []

        for name, quest in self.activeQuests.items():
            resolved,nextQuests = quest.tryResolve()
            if resolved:
                toDelete.append(name)

            for nextQuest in nextQuests:
                self.quests[nextQuest].setAvailable()
                toStart.append(nextQuest)
        
        for quest in toStart:
            self.startQuest(quest)
        
        for quest in toDelete:
            del self.activeQuests[quest]

    def start(self) :
        GetGame.commands = Command
        GetGame.talk = talk

        # Emulate user command to show lore example
        eval("cd()").perform(['cd',"Bethanie"])

        # If needed, replay all quests
        self.quests["init"].setAvailable()
        self.startQuest("init")

        while(True):
            input_string = input(u"\033[93m"+self.user_name + "@:" + os.getcwd().replace(self.root,'') + u"$ \033[0m")
            args = input_string.split(' ')

            command_string = args[0]

            if command_string in self.forbiddenCommands:
                print("Unknown command \""+command_string+"\"")
            else:
                try:
                    command = eval(command_string+"()")

                    output = command.perform(args)
                    if(output):
                        print(output.decode("utf-8"))
                except Exception as e:
                    if(command_string == "restart"):
                        exit()
                    print("Unknown command \""+command_string+"\"")
                        
                self.checkQuests()
