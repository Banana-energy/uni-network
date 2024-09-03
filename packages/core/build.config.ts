import { appendFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ["./src/index"],
  hooks: {
    "build:done": async (ctx) => {
      const outDir = ctx.options.outDir;
      const promises = [];
      // remove empty files
      const emptyBuildEntries = ctx.buildEntries.filter(
        (entry) => entry.exports?.length === 0,
      );
      promises.push(
        emptyBuildEntries.map((entry) => unlink(resolve(outDir, entry.path))),
      );
      // patch cjs entries
      const cjsBuildEntries = ctx.buildEntries.filter(
        (entry) =>
          entry.exports?.length &&
          entry.exports.length > 0 &&
          entry.path.endsWith(".cjs"),
      );
      promises.push(
        cjsBuildEntries.map((entry) =>
          appendFile(
            resolve(outDir, entry.path),
            "module.exports = Object.assign(exports.default || {}, exports);",
          ),
        ),
      );
    },
  },
  rollup: {
    dts: {
      // https://github.com/unjs/unbuild/issues/135
      respectExternal: false,
    },
    emitCJS: true,
    esbuild: {
      target: "es2017",
    },
    inlineDependencies: true,
  },
});