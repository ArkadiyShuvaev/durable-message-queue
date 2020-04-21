import del from "del";
import gulp from "gulp";
import ts from "gulp-typescript";


const tsProject = ts.createProject("tsconfig.json");
const dist_folder = "./dist/";
const src_folder = "./src/";
const src_lua_folder = src_folder + "luaScripts/";
const dist_lua_folder = dist_folder + "luaScripts/";

gulp.task("clear", () => del([ dist_folder ]));

gulp.task("ts", function () {
  return tsProject.src()
      .pipe(tsProject())
      .js.pipe(gulp.dest(dist_folder));
});

gulp.task("lua", () => {
    return gulp.src([ src_lua_folder + "*.lua" ], { since: gulp.lastRun("lua") })
      //.pipe(strip())
      .pipe(gulp.dest(dist_lua_folder));
  });

gulp.task("build", gulp.series("clear", "lua", "ts"));

gulp.task("dev", gulp.series("lua", "ts"));

gulp.task("default", gulp.series("build"));
