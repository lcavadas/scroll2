/*global require:true */
(function () {
  'use strict';

  var build = './';

  var gulp = require('gulp');
  var uglify = require('gulp-uglify');
  var jshint = require('gulp-jshint');
  var concat = require('gulp-concat');
  var minifyCSS = require('gulp-minify-css');

  gulp.task('default', ['css', 'min']);

  gulp.task('min', function () {
    gulp.src('scroll2.js')
      .pipe(jshint())
      .pipe(concat('scroll2.min.js'))
      .pipe(uglify({preserveComments: 'some'}))
      .pipe(gulp.dest(build));
  });

  gulp.task('css', function () {
    gulp.src('scroll2.css')
      .pipe(concat('scroll2.min.css'))
      .pipe(minifyCSS())
      .pipe(gulp.dest(build));
  });

  gulp.task('watch', function () {
    gulp.watch('scroll2.js', ['min']);
    gulp.watch('scroll2.css', ['css']);
  });

}());