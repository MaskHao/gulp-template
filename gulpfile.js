var gulp = require('gulp'),
    changed = require('gulp-changed'),    // 只编译改动过的文件
    htmlmin = require('gulp-htmlmin'),
    less = require('gulp-less'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssmin = require('gulp-clean-css'),

    eslint = require('gulp-eslint'),          // js 代码检查
    babel = require('gulp-babel'),           // 编译 es6 代码
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),       // 合并文件
    del = require('del'),                     // 删除文件
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'), //深度压缩
    cache = require('gulp-cache'),          //只压缩修改的图片

    // 当发生异常时提示错误 确保本地安装gulp-notify和gulp-plumber
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload;
var autofix = {
    browsers: [
        'ie >= 9',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ],
    cascade: true,
    remove: true
};


gulp.task('move-html', function () {
    gulp.src('./app/**/*html')
        .pipe(changed('./dev'))
        .pipe(gulp.dest('./dev'))
});

gulp.task('minify-html',['move-html'], function () {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    gulp.src('./dev/**/*.html')
        .pipe(htmlmin(options))
        .pipe(gulp.dest('./build'));
});

gulp.task('less', function () {
    gulp.src('./dev/styles/**/*.less')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(less())
        .pipe(autoprefixer(autofix))
        .pipe(cssmin())  //兼容IE7及以下需设置compatibility属性 .pipe(cssmin({compatibility: 'ie7'}))
        .pipe(gulp.dest('./dev/styles'))
        .pipe(reload({ stream:true }));
});

// 编译 sass --> (/dev)
gulp.task('sass', function () {
    gulp.src(['./dev/styles/**/*.scss','!./dev/styles/normalize.scss'])
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sass())
        .pipe(autoprefixer(autofix))
        .pipe(gulp.dest('./dev/styles'))
        .pipe(reload({ stream: true }));
});

// 压缩 css --> (/build)
gulp.task('minify-css', ['less','sass'], function () {
    gulp.src('./dev/styles/**/*.css')
        .pipe(cssmin({
            compatibility: 'ie8',
            keepSpecialComments: '*'
        }))                //兼容IE7及以下需设置compatibility属性 .pipe(cssmin({compatibility: 'ie7'}))
        .pipe(gulp.dest('./build/styles'))
        //.pipe(md5(10, './build/**/*.html'));   // 查找对应文件，替换为添加md5的文件名
});


// 编译 js --> (/dev)
gulp.task('babel-js', () => {
    return gulp
        .src('./app/scripts/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())  // 错误格式化输出
        .pipe(changed('./dev/scripts'))
        .pipe(babel({
            presets: ['es2015', 'stage-1']
        }))
        .pipe(gulp.dest('./dev/scripts'))
        .pipe(reload({stream: true}));
})

gulp.task('minify-js', ['babel-js'], function () {
    gulp.src('./dev/scripts/**/*.js')
        .pipe(uglify({
            mangle: {
                except: ['require', 'exports', 'module', '$']
            }
        }))
        .pipe(gulp.dest('dist/js'))
        // .pipe(md5(10, './build/**/*.html'));
});

// gulp.task('testConcat', function () {
//     gulp.src('src/js/*js')
//         .pipe(concat('all.js'))
//         .pipe(gulp.dest('dist/js'))
// });



// 转移图片 --> (/dev)
gulp.task('move-img', function () {
    gulp.src('./app/imgs/**/*.{png,jpg,gif,ico}')
        .pipe(changed('./dev/imgs'))
        .pipe(gulp.dest('./dev/imgs'))
        .pipe(reload({ stream:true }))

});

// 压缩图片 --> (/build)
gulp.task('minify-img', ['move-img'], function () {
    gulp.src('./dev/imgs/**/*.{png,jpg,gif,ico}')
        .pipe(cache(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true, //类型：Boolean 默认：false 多次优化svg直到完全优化
            svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
            use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        })))
        .pipe(gulp.dest('./build/imgs'))
        // .pipe(md5(10, './build/**/*.{css,js,html,json}'));
});

// json 转移 --> (/dev)
gulp.task('move-json', () => {
    return gulp
        .src('./app/_data/*.json')
        .pipe(gulp.dest('./dev/_data'))
        .pipe(reload({stream: true}));
});

// json 转移至 build --> (/build)
gulp.task('build-json', () => {
    return gulp
        .src('./app/_data/*.json')
        .pipe(gulp.dest('./build/_data'))
        // .pipe(md5(10, './build/**/*.js'));
});

// 转移 libs 插件 (libs 中引入的都是压缩后的文件)
gulp.task('move-libs-dev', () => {
    return gulp.src('./app/libs/**/*')
        .pipe(gulp.dest('./dev/libs'));
});

gulp.task('move-libs-build', () => {
    return gulp.src('./app/libs/**/*')
        .pipe(gulp.dest('./build/libs'))
        // .pipe(md5(10, './build/**/*.html'))
});

// 清空文件夹
gulp.task('clean-dev', (cb) => {
    return del(['./dev/**/*'], cb);
});

gulp.task('clean-build', (cb) => {
    return del(['./build/**/*'], cb);
});

gulp.task('serve',['less','sass','jsmin','testHtmlmin','testImagemin'], function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch("app/*.html").on('change', reload); //监听html文件的变化，自动重新载入
    gulp.watch('dist/css/!*.css').on('change', browserSync.reload); //监听css文件的变化，自动重新载入
    gulp.watch('dist/js/!*.js').on('change', browserSync.reload); //监听js文件的变化，自动重新载入
    gulp.watch('src/img/*.{png,jpg,gif,ico}').on('change', browserSync.reload); //监听js文件的变化，自动重新载入
});
gulp.task('default', ['serve','testHtmlmin']);
