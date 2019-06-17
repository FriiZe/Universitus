import os
import subprocess
import importlib
from io import StringIO
from GetGame import GetGame
from Quest.Events.DialogueEvents import *
from Quest.Events.RemoveEvents import *
from Quest.Events.MoveEntity import *
from Quest.Events.CreateEvents import *

class Command:

    def __init__(self):
        pass

    def perform(self, args):
        output = subprocess.check_output(args, shell=True)
        return output

    def inbounds(self, path, noLock = False):
        curr = os.getcwd()
        full = os.path.abspath(path)
        if(os.path.isfile(full)):
            full = os.path.dirname(full)

        if not noLock:
            lockhere = curr+"/.lock"
            lock = full+"/.lock"
            
            if lockhere != lock:
                if os.path.exists(lockhere):
                    with open(lockhere,'r') as l:
                        for line in l.readlines():
                            print(line)
                    return False
                if os.path.exists(lock):
                    with open(lock,'r') as l:
                        for line in l.readlines():
                            print(line)
                    return False
        return os.path.abspath(GetGame.game.root) in full

class cd(Command):

    def perform(self, args):
        try:
            destination = args[1]
            try:
                if(self.inbounds(destination)):
                    os.chdir(destination)
                    if(os.path.isfile(".lore")):
                        destroy = False
                        with open(".lore",'r', encoding='utf-8') as f:
                            for line in f.readlines():
                                if(line == "destroy" or line == "destroy\n"):
                                    destroy = True
                                else:
                                    print(line, end = '')
                            print("\n")
                        if destroy:
                            os.remove(".lore")
                else:
                    print("Impossible d'aller ici.")
            except:
                print("Vous ne pouvez pas vous diriger vers \""+destination+"\"")
        except:
            print("Cette destination est invalide.")

class cat(Command):

    def perform(self, args):
        try:
            destination = args[1]
            try:
                if(self.inbounds(destination)):
                    super.perform(args)
                else:
                    print("Impossible de voir ce qui se trouve à l'intérieur.")
            except:
                print("Cet endroit est inaccessible.")
        except:
            print("Cet objet est invalide.")

class ls(Command):
    pass

class touch(Command):

    def perform(self, args):
        try:
            destination = args[1]
            try:
                if(self.inbounds(destination)):
                    open(destination,'a').close()
            except:
                print("Vous ne pouvez pas créer \""+destination+"\"")
        except:
            print("L'endroit auquel vous tentez d'accéder est incorrect.")

class talk(Command):

    def perform(self, args):
        try:
            destination = args[1]
            try:
                if(self.inbounds(destination)):
                    name = destination[:-3]
                    if(destination[-3:] == ".py"):
                        try:
                            with open(destination,'r', encoding="utf-8") as f:
                                text = ''.join(f.readlines())
                                exec(text)
                                character = eval(name+"()")

                                if(name in GetGame.game.dialogues.keys()):
                                    # Continue talk
                                    said = GetGame.game.dialogues[name]
                                else:
                                    said = [""]

                                dialogueTree = character.dialogue
                                finalTree = dialogueTree
                                next = character.dialogue

                                for choice in said:
                                    dialogueTree = next[choice]
                                    finalTree = dialogueTree
                                    next = dialogueTree[1]


                                if len(args) > 2:
                                    # No choice given
                                    try:
                                        i = 1
                                        for choice,response in dialogueTree[1].items():
                                            if i == int(args[2]):
                                                said.append(choice)
                                                finalTree = response
                                                break
                                            i += 1
                                    except Exception as e:
                                        print("Choix invalide. ( "+str(e)+" )")
                                        return
                                        
                                GetGame.game.dialogues[name] = said
                                character.talk(said)

                                events = []

                                if(len(finalTree)>2):
                                    for ev in finalTree[2].split("|"):
                                        events.append(eval(ev))
                                    for event in events:
                                        event.do()
                        except Exception as e:
                            print("*Bruits inintelligibles*")
                            print("Quelque chose ne va pas avec cette créature... ( "+str(e)+" )")
                    else:
                        print("Ceci ne peut parler !")
            except:
                print("Vous ne pouvez pas vous adresser à "+destination)
        except:
            print("La personne à qui vous tentez de vous adresser est hors de portée.")

class restart(Command):
    def perform(self, args):
        exit()

class edit_(Command):

    def perform(self, args):
        try:
            command = ' '.join(args)
            text = ('"'.join(('"'.join(command.split('"')[1:]).split('"'))[:-1])).replace('\\n','\n').replace('\\r','\r')
            f_out = os.path.abspath(command.split(">")[-1].strip())

            try:
                
                if(self.inbounds(f_out)):
                    with open(f_out, 'w', encoding="utf-8") as f:
                        f.write(text)
                    print("Fichier sauvegardé.")
                else:
                    print("Vous n'avez pas accès à cet objet.")
            except Exception as e:
                print("Vous ne pouvez pas modifier cet objet. "+str(e))
        except:
            print("L'objet que vous tentez de modifier est invalide.")

class edit(Command):

    def perform(self, args):
        try:
            destination = args[1]
            try:
                if(self.inbounds(destination)):
                    if(not os.path.isfile(destination)):
                        with open(destination,mode='w') as f:
                            f.write('')
                            
                    with open(destination,mode='r', encoding="utf-8") as f:
                        return bytes(f.read(), 'utf-8')+bytes("\\eof", 'utf-8')
                else:
                    print("Vous n'avez pas accès à cet objet.")
            except:
                print("Vous ne pouvez pas modifier cet objet.")
        except:
            print("L'objet que vous tentez de modifier est invalide.")