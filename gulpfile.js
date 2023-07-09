var gulp = require('gulp');
var runSequence = require('run-sequence');
var webpack = require('webpack');
var notify = require('gulp-notify');
var rm = require('rimraf');
var imagemin = require('gulp-imagemin');
var scsslint = require('gulp-scss-lint');

//http://www.browsersync.cn/docs/recipes/
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var src = './src/';
var dest = './dist/';
var homepage = 'index.html';

var config = {
	src: src,
	dest: dest,
	webServer: {
		server: './dist',
		index: homepage,
		port: 3000,
		logLevel: 'debug',
		logPrefix: 'JHW',
		open: true,
		files: [dest + '/*.js', './index.html']
	},
	scss: {
		src: src + '**/*.scss'
	},
	script: {
		entry: {
			'entry': src + 'main.js'
		},
		output: {
			path: dest, //js
			filename: 'bundle.js'
		},
		sourceMap: true,
		watch: src + '**/*.js'
	},
	html: {
		watchHome: homepage,
		watchAll: src + '**/*.html'
	}
}

var webpackConfig = require('./webpack.config')(config);
gulp.task('webpack', function(cb) {
	webpack(webpackConfig, function(err, stats) {
		if (err) {
			handleErrors();
			console.error(stats);
		}
		if (stats.compilation.errors.length) {
			console.error(stats.compilation.errors[0].toString());
		}
		cb();
	});
});

gulp.task('img:dev', ['clean'], function() {
	return gulp.src([src + '/images/**'])
		.pipe(watch())
		.pipe(reload());
});

gulp.task('img', ['clean'], function() {
	return gulp.src([src + '/images/**'])
		.pipe(imagemin())
		.pipe(gulp.dest(dest + '/images'));
});

function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	notify.onError({
		title: 'compile error',
		message: '<%= error.message %>'
	}).apply(this, args);
	this.emit('end');
}

gulp.task('web-server', ['build'],function() {
	browserSync.init(config.webServer);
});

gulp.task('watch', ['web-server'], function() {
	gulp.watch(config.script.watch, ['webpack']).on('change', reload);
	gulp.watch(config.scss.src, ['webpack']).on('change', reload);
	gulp.watch(config.src + '/**/*.vue', ['webpack']).on('change', reload);
	gulp.watch(config.html.watchHome, ['html']).on('change', reload);
	gulp.watch(config.html.watchAll, ['html']).on('change', reload);
});

gulp.task('scss-lint', function() {
	return gulp.src(src+'**/*.scss')
		.pipe(scsslint({
			'config': 'scsslint.yml',
		}));
});

gulp.task('static', function() {
	return gulp.src([src + 'static/**'])
		.pipe(gulp.dest(dest + 'static'));
});

gulp.task('datajson', function() {
	return gulp.src([src + 'data.json'])
		.pipe(gulp.dest(dest));
});

gulp.task('gatheringdata', function() {
	return gulp.src([src + 'gathering/**'])
		.pipe(gulp.dest(dest + 'gathering'));
});

gulp.task('icons', function() {
	return gulp.src([src + 'icons/**'])
		.pipe(gulp.dest(dest + 'icons'));
});

gulp.task('html', function() {
	return gulp.src([src + '**/*.html'])
		.pipe(gulp.dest(dest));
});

gulp.task('clean', function(next) {
	rm(dest, function() {
		next();
	});
});

gulp.task('default', ['watch']);
gulp.task('run', ['watch']);

gulp.task('build', function(callback) {
	runSequence('clean', 'img', 'webpack', 'static', 'datajson', 'gatheringdata', 'icons', 'html',callback);
});

gulp.task( 'download-images', function() {
	var data = require('./scripts/download-images');
});

// Require extra gulp tasks
try {
	require('./gulptasks/upload.js')(gulp);
} catch(err) {
	// Don't error if we don't have extra tasks, they're only for deploy right now
}
