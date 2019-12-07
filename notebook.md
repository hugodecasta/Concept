# Project Notebook
## projecte initialized by Hugo Castaneda - 28/11/2019
### The goal of this project is to offer a way to graphically manipulate concpet, notes keywords. This project comes from the will to facilitated note taking will lectures or to help prepare a state of the art.

---
## Basic ideas
Multiple notes can be taken and will be classified in type.
Pre-list of types:
 * Keywords
 * Concept
 * Notes
 * Foundings

(boolMaster will be used to store data)
The system can found recurrent keywords and propose to look for them more in detail.

One great thing to do is not only link keyword litterals to their concepts but also be able to link elements between them maybe with properties (like oriented). It would be good also to be able to see the concrete links.

This is now done by 
 * default when a keyword as the same name of a pre-existing concept or by
 * giving the name of a pre-existing concept while conceptualizing a keyword (the keyword text will be associated to this concept in the future and forever)

---
## New ideas about associations
 * Show links between concepts or create visual cluster automaticaly `[ DONE ]`

Using canvas one could show the links between concepts. It would be good too to propose a concepts placement in space based on this linking. It would be good to be able to see the importance of concepts based on their links.

One can show and hide links between concepts by pressing "s".

 * Create story telling system `[ DONE ]`

One good idea would be to create a story telling system with which one can follow the concept path by pressing ctrl and go forward with the telling. Each time one press the ctrl key it jump to the "next" concept from a pre-determined list. This list could be created by a simple algo making it retrieavable on the flight every time.

 * Change from info to keyword and vice-verso `[ DONE ]`

Would be cool to use one key to change an item from keyword list to infos list and vice-versa. And/or to copy to the other list

One can now move info to keyword and vice-verso by using the "m" key (as move)

 * A quick one-time tutorial `[ DONE ]`

Create a simple visual tutoriel telling the user which key to press for what reason. Maybe create an alternate git project ... !

The project is now uses the "helpme" submodule allowing to create a tutorial for begginners

---
## Sharing work

A greate idea would be the possibility to share work with other people. Two options:
 * Share with every one (work part of a global array)
 * Share with specific users
   * this would require to store all user data in a global array to allow for sharing
   * or we can generate random one time url to share with invited users that they can use and it will generate a sharing token ... (let's see later)

If we work with user identification, it is needed to create a hashable more secure way to share to google user id.

Sharing can be done by changing the BM prefix to "share" for example and the whole js will access to the same keys but on the "share" namespace. We just need, when activating the "draw_concept" method to activate the share prefix instead of user+work prefix. OR we can modify the profile prefix to be "share".

One problem though, when selecting a concept or keyword for example, it will select it for everyone working on the project. This is a problem. We need to be able to select which key will be connected to which prefix and which will be checked for update. Maybe allow BM to record custom prefix per key !

It is now possible to share work but all shared work are public shared work which mean that every one can see your work and act on it and everyone can delete it ...

### next step
 * share work with wanted user
 * remember the shared work you were working on !

The sharing system has been removed because of unwanted file leaks and errors in automatic graphic updates.

The next step is allowing sharing user to user with as much security as possible.
 * One idea was to save all user in a global user file but it suffers a great security problem (storing in a global accessible file user data)
 * The other idea is creating token that can be copied by sharing user to access a file (add them to their work library).
   * This idea is good, we have to make sure that the file name is shared by all user. Maybe create a global boolMaster redirecter ?
   * The main idea is that when we have to access user id, they give it themself, we do not store them.
   * Maybe they can each keep a file where they store random-generated prefix giving access to the shared file

Exemple for potential shared_file_name `random_torken,workname` this name is shared by the authorized people to access the file data.

The current sharing system based on the shared token seems to be stable, let's push it and see