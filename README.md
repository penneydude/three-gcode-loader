# three-gcode-loader

[THREE.GCodeLoader](https://threejs.org/examples/js/loaders/GCodeLoader.js) from the official repo examples repackaged as a node module, with request header and credentials support


# Install

`npm i --save three`

`npm i --save three-gcode-loader`


## Usage

```js

import * as THREE from 'three';
import GCodeLoader from 'three-gcode-loader';

var loader = new GCodeLoader()

loader.setRequestHeader({ Authorization: 'Bearer token' });
loader.setWithCredentials(true);

loader.load('https://secured-api/path/to/file.gcode', function (object) {
  scene.add(object);
});

```
