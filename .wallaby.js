module.exports = function (wallaby) {
  var fs = require('fs');
  var path = require('path');
  process.env.NODE_PATH +=
    ':' + path.join(wallaby.localProjectDir, 'tests', 'wallaby', 'node_modules') +
    ':' + path.join(wallaby.localProjectDir, '.meteor', 'local', 'build', 'programs', 'server', 'node_modules');

  var serverNpmFolderPath = path.join(wallaby.localProjectDir, '.meteor', 'local', 'build', 'programs', 'server', 'npm');
  fs.readdirSync(serverNpmFolderPath).forEach(function (packageName) {
    process.env.NODE_PATH += ':' + path.join(serverNpmFolderPath, packageName, 'node_modules');
  });

  return {
    files: [
      '.meteor/local/build/programs/server/*',
      '.meteor/local/build/programs/server/app/**/*',
      '.meteor/local/build/programs/server/assets/**/*',
      '.meteor/local/build/programs/server/packages/**/*',
      '.meteor/local/build/programs/web.browser/**/*',
      '.meteor/local/build/main.js'
      // TODO: Add isopacks folder
    ],

    tests: [
      'tests/wallaby/**/*Spec.js'
    ],

    env: {
      // use 'node' type to use node.js or io.js
      type: 'node',
      // Make sure you use node.js 0.10.x
      runner: 'node',
      params: {
        runner: '--harmony --harmony_arrow_functions',
        // You need to start a local MongoDB server
        env: 'MONGO_URL=mongodb://localhost:27017/meteor-wallaby-sandbox;ROOT_URL=http://localhost:3000'
      }
    },

    testFramework: 'mocha@2.1.0',

    bootstrap: function (wallaby) {
      wallaby.delayStart();
      var path = require('path');
      var Fiber = require('fibers');
      Fiber(function () {
        require(path.join(wallaby.projectCacheDir, '.meteor', 'local', 'build', 'main.js'));

        var expect = require('expect');
        global.expect = expect;
        global.spyOn = expect.spyOn.bind(expect);

        // Bind to Fiber
        var generateBoundFunction = function (func) {
          var boundFunction = Meteor.bindEnvironment(func);
          if (func.length > 0) {
            // Async test
            return function (done) {
              return boundFunction.apply(this, arguments);
            };
          } else {
            // Sync test
            return function () {
              return boundFunction.call(this);
            };
          }
        };

        ['describe', 'it'].forEach(function (word) {
          var originalFunction = global[word];
          global[word] = function (/* arguments */) {
            arguments[1] = generateBoundFunction(arguments[1]);
            return originalFunction.apply(this, arguments);
          }
        });

        // FIXME: Run tests in the Meteor Fiber created in boot.js
        wallaby.start();
      }).run();
    }
  };
};
