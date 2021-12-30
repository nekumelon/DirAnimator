# DirAnimator
A vscode extension to animate the writing of directories.

# Packaging (Building/Installing)
First you need to install vsce, the vscode extension packager, by running `npm install -g vsce`. Then go to the build directory and run `vsce package`. This will package the extension into a .vsix file. Go to the vscode extensions explorer and click the 3 dots on the top right. There should be an option that says "Install from VSIX". Click the button and in the file explorer it opens, navigate to the .vsix file that was packaged. Open the file in the explorer and it should install the extension.

# Usage 
Configure the extension by clicking on the gear icon to the right of the extension in the extensions explorer.
After configuring, open a workspace with the directory you want to animate open. then click Ctrl + Shift + P, type "animate directory" and click Enter.
That's it. Thanks for coming to my TED talk.