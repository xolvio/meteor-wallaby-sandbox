module.exports = function (wallaby) {
  var fs = require('fs');
  var path = require('path');
  process.env.NODE_PATH = process.env.NODE_PATH || '';
  process.env.NODE_PATH +=
    ':' + path.join(wallaby.localProjectDir, 'tests', 'wallaby', 'node_modules') +
    ':' + path.join(wallaby.localProjectDir, '.meteor', 'local', 'build', 'programs', 'server', 'node_modules');

  var serverNpmFolderPath = path.join(wallaby.localProjectDir, '.meteor', 'local', 'build', 'programs', 'server', 'npm');
  fs.readdirSync(serverNpmFolderPath).forEach(function (packageName) {
    process.env.NODE_PATH += ':' + path.join(serverNpmFolderPath, packageName, 'node_modules');
  });

  return {
    debug: true,

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
      'tests/wallaby/**/*Spec.js',
      '!tests/wallaby/client/**/*Spec.js'
    ],

    // TODO: Support parallelism (Maybe we need random ports)
    workers: {
      initial: 1,
      regular: 1,
      recycle: true
    },

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
        process.argv.splice(2, 0, 'program.json');
        process.chdir(path.join(wallaby.projectCacheDir, '.meteor', 'local', 'build', 'programs', 'server'));
        require(path.join(wallaby.projectCacheDir, '.meteor', 'local', 'build', 'programs', 'server', 'boot.js'));

        var expect = require('expect');
        global.expect = expect;
        global.spyOn = expect.spyOn.bind(expect);

        // Bind spec to Fiber
        var generateBoundFunction = function (func) {
          return function (done) {
            var context = this;
            Fiber(function () {
              var isAsyncSpec = func.length > 0;
              if (isAsyncSpec) {
                func.call(context, done);
              } else {
                func.call(context)
                if (typeof done === 'function') {
                  done();
                }
              }
            }).run();
          };
        };

        // Mocha interface that executes tests in Fiber
        var fiberBDDUi = function (suite) {
          require(path.join(__dirname, 'mocha@2.1.0', 'framework', 'lib', 'interfaces', 'bdd'))(suite);

          suite.on('pre-require', function (context, file, mocha) {
            ['describe', 'it'].forEach(function (word) {
              var originalFunction = context[word];
              context[word] = function (/* arguments */) {
                arguments[1] = generateBoundFunction(arguments[1]);
                return originalFunction.apply(this, arguments);
              }
            });
          });
        }

        var mocha = wallaby.testFramework;
        require(path.join(__dirname, 'mocha@2.1.0', 'framework')).interfaces['fiber-bdd'] = fiberBDDUi;
        mocha.ui('fiber-bdd');

        wallaby.start();
      }).run();
    }
  };
};
