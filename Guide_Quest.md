**.quest file format**

Filename : ***id.quest***

Contents :

1. *name:* The name printed out to the player

2. *description*: The initial message the player will receive when the quest starts
3. *onStart*: Series of Event separated by the pipe character : `|` . They trigger sequentially when the quest starts.
4. *onResolve*: Series of Event separated by the pipe character : `|` . They trigger sequentially when the quest ends.
5. *steps*: Series of quest IDs separated by the pipe character : `|` . Their completion is required for this quest to be resolved. Step quests can also have steps, recursively.
6. *conditions*: Series of Condition separated by the pipe character : `|` . These are simple conditions that should all return True when met in order to complete this quest.
7. *next*: Series of quest IDs separated by the pipe character : `|` . These quests will become available as soon as this quest is resolved.

Example:

```json
name: Example Quest
description: This quest is an example. You have to create a Rock in the Parc to complete it.
onStart: RemoveEntity(Rock("Parc"))|CreateCharacter(Character("Rock_Lover","Parc",[HP(5)]))
onResolve: NpcToPlayer("Rock_Lover",["completed_example"])
steps: none
conditions: EntityExists(Rock("Parc"))
next: anotherQuest
```

This quest contains a lot of use cases. Let's tear them down :

**Events**

An event is an action performed by the game. Here you can see RemoveEntity performed on Start, which can be performed with any Entity. Rock is an Entity like many others. Characters are also Entities, but more complex.

The next event is CreateCharacter, which is a bit more like CreateEntity but will also generate the Character's code. It uses a Character object, which will be detailed later.

To create an Event:

 `Event(Entity())`

**Entities**

An entity is a *.py* file in the *world/* folder. It has a name and can be created or removed. If there is code in it, it might be executed as an interaction.

To create an Entity:

 `Rock("World/Path")` if the implementation of *Rock* allows it.

*World/Path* represents the folder where you cant this entity to be placed. For example "Parc/Bin" will create the entity in the `Bin` directory in the `Parc` directory, which in its turn is in the global `world` directory. The player cannot go outside of `world`.

or generally:

 `Entity("Name","World/Path")`

**Characters**

Characters are advanced Entities. They have built-in dialogue and characteristics features such as Health Points.

To create a character:

`Character("Name","World/Path",[Array of Characteristics])`

This one requires more understanding of python.

*name* will be used to create a class corresponding to this unique character. There should be only one Character with this name, and it needs to respect some naming conventions : Must start with a letter (not case sensitive), can contain numbers and `-`. Any other symbol might not work.

`Array of Characteristics` is Characteristics separated by commas `,` more on this later.

Characters have dialogues, designed with a precise data structure. A special section is dedicated to this.

**Characteristic**

A Characteristic is just an attribute to a Character. It is an integer value and can be set for future, more advanced use.

Example of an array of Characteristics, as passed to a Character:

`[HP(10),Speed(5),Strength(5)]`

These are theoretical and are not yet implemented in the game.

**Dialogues**

Dialogues in their current form are complex to design, but are a very powerful tool.

Here is what a simple prettified JSON dialogue tree looks like:

```json
{
    "completed_example": [
        "I love Rocks ! Thank you for creating this Rock.",
        {
            "You are welcome, enjoy !": [
                "Thank you again, have a nice day !",
                {}
            ],
            "(Wow, such a weirdo..) Do you love Rocks that much ?": [
                "Yes, I do love them ! Thank you again !",
                {}
            ],
        }
    ]
}
```

The logic is the following:

```json
{
    "Player Choice": [
        "NPC answer",
        {	// Dictionnaries of choices
            "Next Player Choice": [ // Array of consequences for this choice
                "NPC's answer when the player makes this choice", // NPC answer
                {} // No possible answer, but we can add recursively, see next choice
            ],
            "Other player Choice": [
                "NPC's answer when the player makes this choice",
                {
                    "Deeper choice": [
                        "NPC's answer when the player makes this choice",
                        {}
                    ],
                }
            ],
        }
    ]
    // Possibly another introductory choice ! More on that later.
}
```

The progress of the player's dialogues is saved automatically, so that he can continue talking to the NPC and still be at the same progress, even if he talks to other NPCs in the meantime.

Soon, Events will be implemented like this :

```json
{
	"Player Choice": [
       "NPC's answer when the player makes this choice",
       {}, // No possible answer
       [CreateEntity(Rock("Parc")),NpcToPlayer("Rock_Lover",["other_example"])]
  	]
}
```

As you can see, a third element was added to the player's Choice Item. These events will be performed right after the NPC has said his line.

Also, notice the last event, `NpcToPlayer`. This event is very useful for quests progression and dynamic interactions with NPCs. The Array of Strings passed as the second Parameter, `["other_example"]`, will replace the player's current dialogue tree. For example, see this tree : 

```json
{
    "": [
        "I love Rocks ! Thank you for creating this Rock.",
        {
            "You are welcome, enjoy !": [
                "Thank you again, have a nice day !",
                {},
               "[CreateEntity(Rock('Parc')),NpcToPlayer('Rock_Lover',['other_example'])]"
            ],
            "(Wow, such a weirdo..) Do you love Rocks that much ?": [
                "Yes, I do love them ! Thank you again !",
                {},
               "[CreateEntity(Rock('Parc')),NpcToPlayer('Rock_Lover',['other_example'])]"
            ]
        }
    ],
    "other_example": [
        "Hey, it's good to see you since there was this NpcToPlayer event !",
        {
            "Right, now we can use a brand new tree to talk !": [
                "I hope I don't forget you next time ...",
                {},
                "[RemoveEntity(Rock('Parc')),NpcToPlayer('Rock_Lover',['completed_example'])]"
            ]
        }
    ]
}
```

If you read this correctly, you will notice that it's a sad infinite loop for the Rock Lover...

First, we need to create the Rock Lover Character, so we use the Character constructor :

`Character()`

Then we need to tell its name and location

`Character("Name","Parc")`

Then, add its characteristics.

`Character("Name","Parc",[HP(5)])`

Finally, create a `JSON`file in the Dialogues directory, with the name `<Character_name>.json`. It will automatically be added to the character upon its creation.

Thank you for reading.