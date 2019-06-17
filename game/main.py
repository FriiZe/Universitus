#!/usr/bin/python3
# coding=utf-8

import os
from Game import *
import os

DEBUG = False

game = Game() 
os.chdir("world")
game.root = os.getcwd()

while(True):
    try:
        game.start()
    except Exception as e:
        if DEBUG:
            raise e
        print("Restarting...")
