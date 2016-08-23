var gulp = require('gulp');
var argv = require('yargs').argv;
var del = require('del');
var replace = require('gulp-replace');

var ENV_NAME = "";
var secrets = "";
var path = {};
if (argv.debug) {
    ENV_NAME = 'debug';
    path.distPath = './build_debug';
} else {
    ENV_NAME = 'prod';
    path.distPath = './build_product';
}
secrets = require('./' + ENV_NAME + '-config.json');

gulp.task('clean-debug', function() {
    return del(['**',
        '!node_modules/**'
    ], {
        cwd: path.distPath
    });
});

gulp.task('clean-product', function() {
    return del(['**'], {
        cwd: path.distPath
    });
});

gulp.task('copy', function() {
    return gulp.src(['./src/**'])
        .pipe(replace('<server.port>', secrets.server.port))
        .pipe(replace('<weixin.devId>', secrets.weixin.devId))
        .pipe(replace('<weixin.appId>', secrets.weixin.appId))
        .pipe(replace('<weixin.appSecret>', secrets.weixin.appSecret))
        .pipe(replace('<weixin.openId>', secrets.weixin.openId))
        .pipe(replace('<api.wxGetToken>', secrets.api.wxGetToken))
        .pipe(replace('<api.wxGetUserInfo>', secrets.api.wxGetUserInfo))
        .pipe(replace('<api.wxGetUserAccount>', secrets.api.wxGetUserAccount))
        .pipe(gulp.dest(path.distPath));
});

gulp.task('debug', gulp.series('clean-debug', 'copy'));

gulp.task('default', gulp.series('clean-product', 'copy'));

gulp.task('debug-watch', () => {
    var watcher_server = gulp.watch(['./src/**'], gulp.series('copy'));
    watcher_server.on('change', function() {
        console.log('File ' + arguments[0] + ' was updated, running tasks...');
    });
});