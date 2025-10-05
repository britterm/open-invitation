# Content Editor Design

The content editor allows a user to edit the data displayed in the open-invitation application: 
* hero title
* hero description
* hero tiles (hard-coded to 3)
* narrative sections, including image paths, etc.
* scripture passages
  * category of scripture passage
  * badges
  * description
  * detailed study sections
* etc...

All fields that are displayed should be editable in an easy and pleasing way.  

The detailed study sections (exegetical reflections) should NOT be hard-coded, even if they are all the same across different studies.  Make the number of them variable, with any titles and content that I choose.

## Technology stack

### Data storage

Use sqlite to store all of the data.  Figure out an appropriate data model for this task up front.

### Data export

Generate a script to convert the sqlite data into a json file for the static web page.   Also generate a Makefile to call this script.

### Web Server Stack / UI Stack

Whatever is appropriate.

# Use Cases

I want to edit some scripture passages to add some nuance to the study.  I launch the content editor and navigate to the home page.
I click on "scripture studies" and scroll down to the verse i'm looking for, then click "Edit".  I change some of the sections (like "Why context is important") 
and then click save.  Finally I go to the command line and run the make target that converts the sqlite into json.

The content editor is not available when just the static web app is deployed.
