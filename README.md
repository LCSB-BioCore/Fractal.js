[![Build Status](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/badges/master/build.svg)](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/builds/)

### About
This is the front-end component of the Fractalis project. It is responsible for the communication with the back-end and the visualisation of analysis results.

### Demo
Please have a look at this playlist to see a demo of the visual aspects of Fractalis: [Playlist](https://www.youtube.com/playlist?list=PLNvp9GB9uBmH1NNAf-qTyj_jN2aCPISFU).

### Installation
- Install npm
- Run `npm install` within the project to install all dependencies.
- Run `npm run-script devserver`, which will run a local web server to serve the project to you.
- Open the shown URL and navigate to the test charts in 'test/charts' to play around or do your own development.
- Please note that the test charts might not always be up-to-date. They are really just playground for developers and work-in-progress charts.

### I don't use webpack or similar tools. How can I include Fractalis in my project?
Just run `npm run-script build` to create a single .js file that you can include/import however you want.

### Usage
Please refer to the [main.js file](https://git-r3lab.uni.lu/Fractalis/fractal.js/blob/master/src/main.js). It is the only file directly exposed to your code.
Basically you initialize a FractalisJS instance by calling the init method and subsequently use the available methods listed in this file to control front and back-end.

### Citation
Manuscript is in preparation.
