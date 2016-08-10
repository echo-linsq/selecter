var gulp = require('gulp'),
    // 文件操作模块
    fs = require('fs'),
    // 路径模块
    path = require('path'),
    // 清理文件
    clean = require('gulp-clean'),
    // 重命名
    rename = require('gulp-rename'),
    // 混淆js
    uglify = require('gulp-uglify'),
    // 压缩CSS
    minifyCss = require('gulp-minify-css'),
    // 补全CSS浏览器前缀
    autoprefixer = require('gulp-autoprefixer'),
    // SASS/SCSS
    sass = require('gulp-sass'),
    // JS语法检查
    jshint = require('gulp-jshint'),
    // 让gulp任务，可以相互独立，解除任务间的依赖，增强task复用
    runSequence = require('run-sequence');
// dev server
//自动刷新 
var livereload = require('gulp-livereload'),
    // express应用
    express = require('express'),
    // bodyParser基于express用于解析客户端请求的body中的内容,内部使用JSON编码处理,url编码处理以及对于文件的上传处理.
    body = require('body-parser'),
    // 用于打开URL
    openurl = require('openurl'),
    // Tiny LiveReload server，需要bodyParser
    tinylr = require('tiny-lr'),
    // 跑一个服务器
    server = tinylr();

var config = require('./shark-deploy-conf.json');

var appConfig = config;

// webapp
var webappDir = path.join('./', appConfig.webapp);
// build dir
var buildDir = path.join('./', appConfig.build);
// path
var cssPath = appConfig.cssPath;
var jsPath = appConfig.jsPath;
var htmlPath = appConfig.htmlPath;
var scssPath = appConfig.scssPath;
// functions
/**
 * 插入livereload.js到html中
 *
 * @param  {string} html 需要处理的内容
 * @return {string}      处理后的结果
 */
function injectHtml(html) {
    var index = html.lastIndexOf('</body>');
    if (index !== -1) {
        var script1 = '';
        var script2 = '\n<script>document.write(\'<script src="http://\' + (location.host || \'localhost\').split(\':\')[0] + \':' + appConfig.port + '/livereload.js?snipver=1"></\' + \'script>\')</script>\n';
        return html.substr(0, index) + script1 + script2 + html.substr(index);
    } else {
        return html;
    }
}

function headerStatic(staticPath, headers) {
    return function(req, res, next) {
        var reqPath = req.path === '/' ? '/index' : req.path;
        var f = path.join(staticPath, reqPath);

        if (fs.existsSync(f)) {
            if (headers) {
                for (var h in headers) {
                    res.set(h, headers[h]);
                }
            }
            // 处理html格式
            if (/\.html$/.test(reqPath)) {
                res.set('Content-Type', 'text/html');
                // 文本文件
                res.send(injectHtml(fs.readFileSync(f, 'UTF-8')));
            } else {
                if (/\.js$/.test(reqPath)) {
                    res.set('Content-Type', 'text/javascript');
                    res.send(fs.readFileSync(f, 'UTF-8'));
                } else if (/\.css$/.test(reqPath)) {
                    res.set('Content-Type', 'text/css');
                    res.send(fs.readFileSync(f, 'UTF-8'));
                } else {
                    res.send(fs.readFileSync(f));
                }
            }
        } else {
            if (reqPath !== '/livereload.js') {}
            next();
        }
    }
}
// gulp开始

//清理build和临时目录
gulp.task('clean', function() {

    return gulp.src([buildDir], {
            read: false
        })
        .pipe(clean());
});

// 检查JS语法
gulp.task('jshint', function() {
    return gulp.src(path.join(webappDir, jsPath, '**/*.js'))
        .pipe(jshint({
            strict: false,
            es5: false,
            globals: {
                jQuery: true,
                $: true,
                require: true,
                module: true,
                global: true
            }
        }))
        .pipe(jshint.reporter('default'))

});

// 压缩JS
gulp.task('uglifyjs', function() {
    return gulp.src(path.join(webappDir, jsPath, '**/*.js'))
        .pipe(gulp.dest(path.join(buildDir, 'scripts')))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(path.join(buildDir, 'scripts')))

});
// sass/scss
gulp.task('sass:compile', function() {
    return gulp.src(path.join(webappDir, scssPath, '**/*.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.join(webappDir, cssPath)));
    // 替换CSS
});

// css前加浏览器前缀
gulp.task('autoprefixer', function() {
    return gulp.src(path.join(webappDir, cssPath, '**/*.css'))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(path.join(webappDir, 'styles/css')))

});

// 压缩CSS
gulp.task('minifyCss', function() {
    return gulp.src(path.join(webappDir, cssPath, '**/*.css'))
        .pipe(gulp.dest(path.join(buildDir, 'styles/css')))
        .pipe(minifyCss())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(path.join(buildDir, 'styles/css')))


});
//Build
gulp.task('build', function() {
    runSequence(
        'clean',
        'sass:compile',
        'autoprefixer',
        'minifyCss',
        'jshint',
        'uglifyjs'
    );
});

//Server
gulp.task('serve', function() {
    var app = express();
    // js
    app.use(jsPath, headerStatic(path.join(webappDir, jsPath), {}));
    // css
    app.use(cssPath, headerStatic(path.join(webappDir, cssPath), {}));
    // html
    app.use(appConfig.contextPath, headerStatic(webappDir, {}));

    // livereload middleware
    app.use(body()).use(tinylr.middleware({
        app: app
    }));

    app.listen(appConfig.port, function(err) {
        if (err) {
            return console.log(err);
        }
        // 设置了默认打开页面
        if (appConfig.openurl) {
            openurl.open(appConfig.openurl);
        }
        console.log('listening on %d', appConfig.port);
    });
    gulp.watch(path.join(webappDir, scssPath, '**/*.scss'), ['sass:compile']);

    function watchFiles(ext) {
        gulp.watch(path.join(webappDir, '**/*.' + ext), function(event) {
            tinylr.changed(event.path);
        });
    }
    watchFiles('js');
    watchFiles('css');
    watchFiles('html');
});
gulp.task('default', ['build']);