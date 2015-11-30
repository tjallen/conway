/*************************************************************
Dependencies
*************************************************************/
var gulp = require('gulp');
		sass = require('gulp-sass');
		browserSync = require('browser-sync');
		uglify = require('gulp-uglify');
		gulpIf = require('gulp-if');
		minifyCss = require('gulp-minify-css');
		imagemin = require('gulp-imagemin');
		cache = require('gulp-cache');
		del = require('del');
		runSequence = require('run-sequence');
		autoprefixer = require('gulp-autoprefixer');
		sourcemaps = require('gulp-sourcemaps');
		neat = require('node-neat').includePaths;
		plumber = require('gulp-plumber');
		gutil = require('gulp-util');
		inject = require('gulp-inject');

/*************************************************************
Config
*************************************************************/
// dev paths
var dev = 'app/';
var paths = {
  js: dev + 'js/**/*.js',
  css: dev + 'css/**/*.css',
	scss: dev + 'scss/**/*.scss',
  html: dev + '**/*.html',
	image: dev + 'images/**/*.+(png|jpg|jpeg|gif|svg)'
};
// dist/build/deploy paths
var dist = 'dist';
// plugin vars
var reload = browserSync.reload;
var autoPrefixerBrowsers = ['last 3 versions', 'ie 8', 'ie 9', '> 5%'];
// better error handling when plumber stops pipes breaking
var onErr = function (err) {
	gutil.beep();
	gutil.log(gutil.colors.red(err));
	this.emit('end');
};

/*************************************************************
Styles
*************************************************************/

// SCSS (sourcemaps+autoprefixer+sass)
gulp.task('styles', function() {
	return gulp.src([paths.scss])
	.pipe(plumber({errorHandler: onErr}))
	//.pipe(sourcemaps.init())
	.pipe(sass({
		includePaths: ['styles'].concat(neat)}))
	.pipe(autoprefixer({
		browsers: autoPrefixerBrowsers}))
	.pipe(gulp.dest('.tmp/css'))
	.pipe(gulpIf('*.css', minifyCss()))
	//.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('dist/css'));
});

/*************************************************************
Scripts
*************************************************************/

gulp.task('scripts', function() {
	gulp.src('app/js/**/*.js')
	.pipe(plumber({errorHandler: onErr}))
	.pipe(sourcemaps.init())
	.pipe(gulp.dest('.tmp/js'))
	.pipe(gulpIf('*.js', uglify()))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('dist/js'));
});

/*************************************************************
Inject stuff
*************************************************************/

// inject css/js into html
gulp.task('index', function() {
	gulp.src('./app/index.html')
	.pipe(plumber({errorHandler: onErr}))
  .pipe(inject(gulp.src(['./app/**/*.js', './app/**/*.css'], {read: false}), {relative: true}))
  .pipe(gulp.dest('./app'));
});

/*************************************************************
Images
*************************************************************/

gulp.task('images', function(){
	return gulp.src(paths.image)
	.pipe(plumber({errorHandler: onErr}))
	// cache images
	.pipe(cache(imagemin({
		interlaced: true
	})))
	.pipe(gulp.dest('dist/images'));
});

/*************************************************************
Build
*************************************************************/

// all html files
gulp.task('html', function() {
	gulp.src('app/**/*.html')
	.pipe(plumber({errorHandler: onErr}))
	.pipe(gulp.dest('dist'));
});

// all rando files at root including hidden
gulp.task('rootfiles', function() {
	gulp.src(['app/*','!app/*.html', '!app/scss','app/.*'])
	.pipe(plumber({errorHandler: onErr}))
	.pipe(gulp.dest('dist'));
});

/*************************************************************
Main tasks
*************************************************************/
gulp.task('stylesinj', function(cb) {
	runSequence('styles','inj', cb);
});

// watch (scss/css,js,html,images)
gulp.task('serve', ['scripts', 'styles'], function() {
	// browsersync
	browserSync({
		server: ['.tmp', 'app'],
		options: {
		},
		notify: false
	});

	gulp.watch(['app/scss/**/*.scss', 'app/css/**/*.css'], ['styles', reload]);
	gulp.watch([paths.html], reload);
	gulp.watch([paths.js], ['scripts', reload]);
	gulp.watch([paths.image], reload); // check
});

// clean dist dir (add images exclusion back if needed)
gulp.task('clean', function() {
	del(['dist/*', '.tmp/*', '!dist/.git']);
	return cache.clearAll();
});

// build (clean->styles->useref->images)
gulp.task('build', function (callback) {
	runSequence('clean',
		['html', 'styles', 'scripts', 'index', 'images', 'rootfiles'],
		callback
	);
});

// default (styles->bs->watch atm)
gulp.task('default', function (callback) {
	runSequence(['styles','browserSync', 'serve'],
		callback
	);
});
