var gulp = require('gulp'),
    less = require('gulp-less');
gulp.task('testLess', function () {
    gulp.src('src/less/*.less')
        .pipe(less())
        .pipe(gulp.dest('src/css'));
});
gulp.task('default', ['testLess'])