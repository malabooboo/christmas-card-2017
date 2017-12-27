import del from 'del';
import gulp from 'gulp';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import imageResize from 'gulp-image-resize';
import inlinesource from 'gulp-inline-source';
import minify from 'gulp-minify';
import prettify from 'gulp-prettify';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import util from 'gulp-util';
import watch from 'gulp-watch';
import webserver from 'gulp-webserver';
import template from 'gulp-md-template';

var SOURCE = {
  IMG : './data/**/*.jpg',
  SCSS : './dev/**/*.scss',
  CSS : './dev/**/*.css',
  JS : './dev/**/base.js',
  DATA : './data/**/*.*',
  ROOT : './dev/'
};

var DEST = {ROOT : './public/static/'};

/**
 * Copies Images from /dev to /public/static
 * @return {Gulp}
 */
function copyData(watch) {
  if (watch === true) {
    util.log('Data: Watched files changed.');
  }

  return gulp.src(SOURCE.DATA)
      .pipe(changed(DEST.ROOT))
      .pipe(gulp.dest(DEST.ROOT))
      .on('end', function() {
        util.log(util.colors.black.bgGreen('Images: Copied'));
      });
}

/**
 * Compiles CSS.
 * @param {boolean} watch
 * @return {Gulp}
 */
function compileCss(watch) {
  if (watch === true) {
    util.log('CSS: Watched file changed.');
  }

  return gulp.src('./dev/app.scss')
      .pipe(sass({outputStyle : 'compressed'}).on('error', sass.logError))
      .pipe(gulp.dest('./dev/'))
      .on('end',
          function() { util.log(util.colors.black.bgGreen('CSS: Compiled')); });
}

/**
 * Copies CSS libs.
 * @return {Gulp}
 */
function copyCss(watch) {
  if (watch === true) {
    util.log('CSS: Watched file changed.');
  }

  return gulp.src(SOURCE.CSS)
      .pipe(sass({compress : 'true'}).on('error', sass.logError))
      .pipe(gulp.dest(DEST.ROOT))
      .on('end', function() {
        util.log(util.colors.black.bgGreen('CSS libs: Copied'));
      });
}

/**
 * Copies JS.
 * @return {Gulp}
 */
function copyJs(watch) {
  if (watch === true) {
    util.log('JS: Watched file changed.');
  }

  return gulp.src('./dev/**/*-min.js')
      .pipe(gulp.dest(DEST.ROOT))
      .on('end',
          () => { util.log(util.colors.black.bgGreen('JS libs: Copied')); });
}

/**
 * Compiles JS.
 * @return {Gulp}
 */
function compileJs(watch) {
  if (watch === true) {
    util.log('JS: Watched file changed.');
  }

  // return gulp.src(SOURCE.JS).pipe(gulp.dest(DEST.ROOT)).on('end', function()
  // {
  //   util.log(util.colors.black.bgGreen('JS copied'));

  return gulp.src(SOURCE.JS)
      .pipe(babel({presets : [ 'es2015' ]}))
      .pipe(minify({ext : {min : '.min.js'}}))
      .pipe(gulp.dest(DEST.ROOT))
      .on('end',
          () => { util.log(util.colors.black.bgGreen('JS: Compiled')); });
}

/**
 * Copies HTML.
 * @return {Gulp}
 */
gulp.task('copyHtml', () => {
  return gulp.src('./dev/index.html')
      .pipe(template('./dev/partials'))
      .pipe(prettify({indent_size : 2}))
      .pipe(inlinesource())
      .pipe(gulp.dest(DEST.ROOT))
      .on('end',
          function() { util.log(util.colors.black.bgGreen('HTML: Copied')); });
});

gulp.task('clean', () => {
  return del([
    'public/static/index.html', 'public/static/app.css',
    'public/static/base.js', '!public/static/img'
  ]);
});

gulp.task('compile:css', compileCss);
gulp.task('copy:data', [ 'clean' ], copyData);
gulp.task('copy:js', [ 'clean' ], copyJs);
gulp.task('compile:js', [ 'clean' ], compileJs);

gulp.task('default',
          [ 'compile:css', 'copy:js', 'compile:js', 'copyHtml', 'copy:data' ],
          () => {
            gulp.watch('./data/**/*.*', () => { copyData(true); });
            gulp.watch('./dev/**/*.scss', () => { compileCss(true); });
            gulp.watch('./dev/js/base.js', () => { compileJs(true); });
            gulp.watch('./dev/**/*.html', [ 'copyHtml' ]);
            gulp.watch('./dev/**/*.md', [ 'copyHtml' ]);

            return gulp.src(DEST.ROOT).pipe(webserver({
              livereload : false,
              directoryListing : false,
              open : false,
              path : '/'
            }));
          });
