var gulp = require('gulp');
var del = require('del');

function makeDeps(deps, modifier) {
  return gulp.series.apply(gulp, deps.map(function(dep) {
    return dep + ':run';
  }));
}

function getWatch(task, parent) {
  var watch = task.watch || task.src;

  return (watch ? (parent || []).concat(watch) : parent || []);
}

function make(tasks) {
  var runList = [];
  var watchList = [];

  Object.keys(tasks).forEach(function(key) {
    var task = tasks[key];

    var runKey = key + ':run';
    var watchKey = key + ':watch';
    var cleanKey = key + ':clean';

    if (task.clean) {
      gulp.task(cleanKey, function(cb) {
        del(task.clean, cb);
      });
    }

    var run = function runWrap(cb) {
      return task.run(cb);
    };

    gulp.task(runKey, task.deps ? gulp.series(makeDeps(task.deps), run) : run);

    var watchGlobs = getWatch(task);

    if (task.deps) {
      task.deps.forEach(function(dep) {
        var depTask = tasks[dep];

        depTask.global = false;
        watchGlobs = getWatch(depTask, watchGlobs);
      });
    }

    task.watch = watchGlobs;

    if (watchGlobs && watchGlobs.length) {
      gulp.task(watchKey, function() {
        gulp.watch(
          watchGlobs,
          task.clean ? gulp.series(cleanKey, runKey) : gulp.series(runKey)
        );
      });

      task.watchKey = watchKey;
    }

    task.runKey = runKey;
  });

  Object.keys(tasks).forEach(function(key) {
    var task = tasks[key];

    if (task.global !== false) {
      runList.push(task.runKey);
      task.watchKey && watchList.push(task.watchKey);
    }
  });

  return {
    run: runList,
    watch: watchList
  };
}

module.exports = make;