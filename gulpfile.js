/********************************************************
Dependencies
********************************************************/
var gulp = require('gulp');
		$ = require('gulp-load-plugins')();
		browserSync = require('browser-sync');
		del = require('del');
		runSequence = require('run-sequence');
		neat = require('node-neat').includePaths;

/********************************************************
Config
********************************************************/
// dev paths
var dev = 'app/';
var paths = {
  js: dev + 'scripts/**/*.js',
  css: dev + 'styles/**/*.css',
	scss: dev + 'styles/**/*.scss',
  html: dev + '**/*.html',
	image: dev + 'images/**/*.+(png|jpg|jpeg|gif|svg)',
	font: dev + 'fonts/**/*',
	icon: dev + 'icons/**/*.svg'
};

// plugin vars
var reload = browserSync.reload;
var autoPrefixerBrowsers = ['last 3 versions', 'ie 8', 'ie 9', '> 5%'];
// better error handling when plumber stops pipes breaking
var onErr = function (err) {
	$.util.beep();
	$.util.log($.util.colors.red(err));
	this.emit('end');
};

/********************************************************
Styles
********************************************************/

// sass+normalize+bourbon/neat, sourcemaps, autoprefixr
gulp.task('styles', function() {
  return gulp.src([
			'app/styles/**/*.scss', 'app/styles/**/*.css'
		])
		.pipe($.plumber({errorHandler: onErr}))
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
		// sass: normalize, neat, user styles
    .pipe($.sass({
      includePaths: require('node-normalize-scss').with(['styles'].concat(neat))
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(autoPrefixerBrowsers))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.if('*.css', $.minifyCss()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/styles'));
});

/********************************************************
Scripts
********************************************************/

// uglify scripts, add sourcemap, pipe to dist
gulp.task('scripts', function() {
	gulp.src('app/scripts/**/*.js')
	.pipe($.plumber({errorHandler: onErr}))
	.pipe($.sourcemaps.init())
	.pipe(gulp.dest('.tmp/scripts'))
	.pipe($.if('*.js', $.uglify()))
	.pipe($.sourcemaps.write('.'))
	.pipe($.size({title: 'scripts'}))
	.pipe(gulp.dest('dist/scripts'));
});

/********************************************************
Injecting
********************************************************/

// Inject styles and scripts into HTML
gulp.task('inj', function() {
	gulp.src('app/index.html')
	.pipe($.plumber({errorHandler: onErr}))
  .pipe($.inject(gulp.src(['app/scripts/**/*.js', '.app/styles/**/*.css'], {read: false}), {relative: false}))
  .pipe(gulp.dest('app'));
});

// combine svgs into sprite sheet and inject into HTML
gulp.task('icons', function () {
  var svgs = gulp.src(paths.icon)
	.pipe($.svgmin())
  .pipe($.svgstore({ fileName: 'icons.svg', inlineSvg: true }))
	.pipe($.cheerio({
    run: function ($, file, done) {
      $('svg').addClass('hide');
      $('[fill]').removeAttr('fill');
			done();
    },
    parserOptions: { xmlMode: true }

  }))
	.pipe(gulp.dest('dist/icons')); // pipes sprite sheet to dist, not required for icon injection but may as well
  function fileContents (filePath, file) {
    return file.contents.toString();
  }
  return gulp.src('app/index.html')
  .pipe($.inject(svgs, { transform: fileContents }))
	.pipe($.size({title: 'icons'}))
  .pipe(gulp.dest('app'));
});

/********************************************************
Images
********************************************************/

gulp.task('images', function(){
	return gulp.src(paths.image)
	.pipe($.plumber({errorHandler: onErr}))
	// cache images
	.pipe($.cache($.imagemin({
		interlaced: true
	})))
	.pipe($.size({title: 'images'}))
	.pipe(gulp.dest('dist/images'));
});

/********************************************************
Fonts
********************************************************/

gulp.task('fonts', function(){
	return gulp.src(paths.font)
	.pipe($.plumber({errorHandler: onErr}))
	.pipe($.size({title: 'fonts'}))
	.pipe(gulp.dest('dist/fonts'));
});

/********************************************************
Build
********************************************************/

// all html files
gulp.task('html', function() {
	gulp.src('app/**/*.html')
	.pipe($.plumber({errorHandler: onErr}))
	.pipe($.size({title: 'html'}))
	.pipe(gulp.dest('dist'));
});

// all rando files at root including hidden
gulp.task('rootfiles', function() {
	gulp.src(['app/*','!app/*.html', '!app/styles','app/.*'])
	.pipe($.plumber({errorHandler: onErr}))
	.pipe($.size({title: 'files'}))
	.pipe(gulp.dest('dist'));
});

/********************************************************
Main tasks
********************************************************/

// watch (scss/css,js,html,images)
gulp.task('serve', ['scripts', 'styles'], function() {
	// browsersync
	browserSync({
		server: ['.tmp', 'app'],
		options: {
		},
		notify: false
	});

	gulp.watch(['app/styles/**/*'], ['styles', reload]);
	gulp.watch([paths.html], reload);
	gulp.watch([paths.js], ['scripts', reload]);
	gulp.watch([paths.image], reload); // check
	gulp.watch([paths.icon], ['icons', reload]);
});

// clean dist dir (add images exclusion back if needed)
gulp.task('clean', function() {
	del(['dist/*', '.tmp/*', '!dist/.git']);
	return $.cache.clearAll();
});

// build - td: inj after styles if its useful
gulp.task('build', function(callback) {
	runSequence('clean', ['styles', 'scripts'],
	['html', 'images', 'rootfiles', 'fonts'],
		callback
	);
});

// default task
gulp.task('default', ['serve']);
