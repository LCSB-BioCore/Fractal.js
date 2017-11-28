[![Build Status](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/badges/master/build.svg)](https://git-r3lab.uni.lu/sascha.herzinger/fractal.js/builds/)

### About
This is the front-end component of the Fractalis project. It is responsible for the communication with the back-end and the visualisation of analysis results.

### Installation
Run `npm install` within the project to install all dependencies.
Once this step is finished you can run `./node_modules/webpack-dev-server/bin/webpack-dev-server.js --config webpack.config.js` which will run a local web server to serve the project to you. Open the shown URL and navigate to the test charts in 'test/charts' to play around or do your own development.

### Howto to compile a .js file if you can't use NPM tooling.
Just run `npm run-script build` to create a single .js file that you can include in your project.

### Usage
Please refer to the [main.js file](https://git-r3lab.uni.lu/Fractalis/fractal.js/blob/master/src/main.js). It is the only file directly exposed to your code.
Basically you initialize a FractalisJS instance by calling the init method and subsequently use the available methods listed in this file to control front and back-end.

### Citation
Manuscript is in preparation.
