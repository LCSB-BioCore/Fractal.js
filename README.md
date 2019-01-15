[![Build Status](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/badges/master/build.svg)](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/builds/)

### About
This is the front-end component of the Fractalis project. It is responsible for the communication with the back-end and the visualisation of analysis results. See https://fractalis.lcsb.uni.lu/

### Demo
Please have a look at this playlist to see a demo of the visual aspects of Fractalis: [Playlist](https://www.youtube.com/playlist?list=PLNvp9GB9uBmH1NNAf-qTyj_jN2aCPISFU).

### Installation
- Install npm
- Run `npm install` within the project to install all dependencies.
- Run `npm run-script devserver`, which will run a local web server to serve the project to you.
- Open the shown URL and navigate to the test charts in 'test/charts' to play around or do your own development.
- Please note that the test charts might not always be up-to-date. They are really just playground for developers and work-in-progress charts.

### I don't use webpack or similar tools. How can I include Fractalis in my project?
https://unpkg.com/fractalis/lib/fractal.js

### Usage
Please refer to the [main.js file](https://git-r3lab.uni.lu/Fractalis/fractal.js/blob/master/src/main.js). It is the only file directly exposed to your code.
Basically you initialize a FractalisJS instance by calling the init method and subsequently use the available methods listed in this file to control front and back-end.

### Add new analytics
This paragraph only describes how to add a visualisation/chart to the web library. For statistical analyses please refer to the [Fractalis](git@github.com:LCSB-BioCore/Fractalis.git) repository.

Adding any new chart, custom or not, requires an understanding of [Vue.js](https://vuejs.org/v2/guide/single-file-components.html).
The framework is well documented and might seem familiar to those who have worked with other MVC frameworks before.

In order for Fractalis to recognise a chart one has to put a Vue component into [this folder](https://github.com/LCSB-BioCore/Fractal.js/tree/master/src/vue/charts). 
However, to benefit from several existing helper components, it is somewhat crucial to understand how they interact and what they do.
For this purpose I recommend beginning with a minimal Vue component and including other components (such as DataBox, Chart, ControlPanel), and observing the effect they have on your view.
Once you feel familiar with them, it should be fairly straight forward to write your own visualisation. Feel free to [ask questions](mailto:sascha.herzinger@uni.lu) if you need help with a particular problem.

More documentation will be added if there is a notable interest from the community for it.

### Citation
Manuscript is in preparation.
