/**
 * THREE.GCodeLoader is used to load gcode files usually used for 3D printing or CNC applications.
 *
 * Gcode files are composed by commands used by machines to create objects.
 *
 * @class THREE.GCodeLoader
 * @param {Manager} manager Loading manager.
 * @author tentone
 * @author joewalnes
 */

import { Vector3 } from 'three/src/math/Vector3';
import { DefaultLoadingManager } from 'three/src/loaders/LoadingManager';
import { FileLoader } from 'three/src/loaders/FileLoader';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

var GCodeLoader = function(manager) {
  this.manager = (manager !== undefined) ? manager : DefaultLoadingManager;
  this.splitLayer = false;
};

GCodeLoader.prototype = {
  constructor: GCodeLoader,

  load: function(url, onLoad, onProgress, onError) {
    var self = this;

    var loader = new FileLoader(self.manager);

    if (self.requestHeader) loader.setRequestHeader(self.requestHeader);
    if (self.withCredentials) loader.setWithCredentials(self.withCredentials);

    loader.setPath(self.path);
    loader.load(
      url,
      function(text) {
        onLoad(self.parse(text));
      },
      onProgress,
      onError
    );
  },

  setRequestHeader: function(requestHeader) {
    this.requestHeader = requestHeader;
    return this;
  },

  setWithCredentials: function(withCredentials) {
    this.withCredentials = withCredentials;
    return this;
  },

  setPath: function(value) {
    this.path = value;
    return this;
  },

  parse: function(data) {
    var state = {
      x: 0,
      y: 0,
      z: 0,
      e: 0,
      f: 0,
      extruding: false,
      relative: false,
    };

    let paths = new Array([]);
    let layers = new Array([]);
    let layerIndices = new Array();

    let currentZ = undefined;

    function delta(v1, v2) {
      return state.relative ? v2 : v2 - v1;
    }

    function absolute(v1, v2) {
      return state.relative ? v1 + v2 : v2;
    }

    var lines = data.replace(/;.+/g, "").split("\n");

    for (var i = 0; i < lines.length; i++) {
      var tokens = lines[i].split(" ");
      var cmd = tokens[0].toUpperCase();

      //Argumments
      var args = {};
      tokens.splice(1).forEach(function(token) {
        if (token[0] !== undefined) {
          var key = token[0].toLowerCase();
          var value = parseFloat(token.substring(1));
          args[key] = value;
        }
      });

      //Process commands
      //G0/G1 – Linear Movement
      if (cmd === "G0" || cmd === "G1") {
        var line = {
          x: args.x !== undefined ? absolute(state.x, args.x) : state.x,
          y: args.y !== undefined ? absolute(state.y, args.y) : state.y,
          z: args.z !== undefined ? absolute(state.z, args.z) : state.z,
          e: args.e !== undefined ? absolute(state.e, args.e) : state.e,
          f: args.f !== undefined ? absolute(state.f, args.f) : state.f
        };

        //Layer change detection is or made by watching Z, it's made by watching when we extrude at a new Z position
        if (delta(state.e, line.e) > 0) {
          line.extruding = delta(state.e, line.e) > 0;

          if (currentZ == undefined || line.z != currentZ) {
            newLayer(line);
            layerIndices.push(i);
          }
        }

        // addSegment(state, line);
        addPath(state, line);
        state = line;
      } else if (cmd === "G2" || cmd === "G3") {
        //G2/G3 - Arc Movement ( G2 clock wise and G3 counter clock wise )
        //console.warn( 'THREE.GCodeLoader: Arc command not supported' );
      } else if (cmd === "G90") {
        //G90: Set to Absolute Positioning
        state.relative = false;
      } else if (cmd === "G91") {
        //G91: Set to state.relative Positioning
        state.relative = true;
      } else if (cmd === "G92") {
        //G92: Set Position
        var line = state;
        line.x = args.x !== undefined ? args.x : line.x;
        line.y = args.y !== undefined ? args.y : line.y;
        line.z = args.z !== undefined ? args.z : line.z;
        line.e = args.e !== undefined ? args.e : line.e;
        state = line;
      } else {
        //console.warn( 'THREE.GCodeLoader: Command not supported:' + cmd );
      }
    }

    function newLayer(line) {
      currentZ = line.z;
      layers.push(paths);
      paths = new Array([]);
    }

    function addPath(p1, p2) {
      if (line.extruding) {
        paths[paths.length - 1].push(new Vector3(p1.x, p1.y, p1.z));
        paths[paths.length - 1].push(new Vector3(p2.x, p2.y, p2.z));
      } else {
        if (paths[paths.length - 1].length > 0) paths.push([]);
      }
    }

    return [layers, layerIndices];
  }
};

export default GCodeLoader;
