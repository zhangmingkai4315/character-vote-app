var gulp = require('gulp');
var gutil= require("gulp-util");
var gulpif =require("gulp-if");
var streamify=require("gulp-streamify");
var autoprefixer =require("gulp-autoprefixer");
var cssmin=require("gulp-cssmin");
var concat=require('gulp-concat');
var babelify = require('babelify');
var browserify = require('browserify');
var less=require("gulp-less");
var watchify=require('watchify');
var uglify=require('gulp-uglify');
var source=require("vinyl-source-stream");
var plumber=require("gulp-plumber");

var production = process.env.NODE_ENV === 'production';

var dependencies = [
  'alt',
  'react',
  'react-router',
  'underscore'
];
//1 使用gulp将所有的库文件合并为一个前端的vendor并根据环境判断是否进行压缩操作
gulp.task('vendor',function () {
  return gulp.src([
    'bower_components/jquery/dist/jquery.js',
    'bower_components/bootstrap/dist/js/bootstrap.js',
    'bower_components/magnific-popup/dist/jquery.magnific-popup.js',
    'bower_components/toastr/toastr.js'
  ]).pipe(concat('vendor.js'))
  .pipe(gulpif(production,uglify({mangle:flase})))
  .pipe(gulp.dest('public/js'));
});

gulp.task('browserify-vendor', function() {
  return browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('vendor.bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'));
});

//编译项目文件以及所有的依赖文件
gulp.task('browserify', ['browserify-vendor'], function() {
  return browserify('app/main.js')
    .external(dependencies)
    //将编译的es6代码转换为es5
    .transform(babelify)
    //合并所有的文件到单一的文件中可加入回调函数
    .bundle()
    //保存流内容并rename到bundle。js
    .pipe(source('bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'));
});

gulp.task('browserify-watch', ['browserify-vendor'], function() {
  var bundler = watchify(browserify('app/main.js', watchify.args));
  // 阻止依赖内容进入此文件external
  bundler.external(dependencies);
  bundler.transform(babelify);
  bundler.on('update', rebundle);
  return rebundle();

  function rebundle() {
    var start = Date.now();
    return bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .on('end', function() {
        gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('public/js/'));
  }
});

/* 编译less文件 */
gulp.task('styles', function() {
  return gulp.src('app/stylesheets/main.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulpif(production, cssmin()))
    .pipe(gulp.dest('public/css'));
});

gulp.task('watch', function() {
  gulp.watch('app/stylesheets/**/*.less', ['styles']);
});

gulp.task('default', ['styles', 'vendor', 'browserify-watch', 'watch']);
gulp.task('build', ['styles', 'vendor', 'browserify']);
