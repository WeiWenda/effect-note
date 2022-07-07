import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import sass from 'rollup-plugin-sass';
import image from '@rollup/plugin-image';
import dts from "rollup-plugin-dts";

const packageJson = require("./package.json");

export default [
    {
        input: "src/share/index.ts",
        output: {
                dir: "dist",
                format: "esm",
                sourcemap: true,
            },
        external: ['react', 'react-dom'],
        plugins: [
            image(),
            nodeResolve({
                extensions: [".js"],
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify( 'development' )
            }),
            babel({
                presets: ["@babel/preset-react"],
            }),
            commonjs(),
            typescript({ tsconfig: "./tsconfig-rollup.json" }),
            sass({
                insert: true
            })
        ],
    },
    {
        input: "dist/types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        plugins: [dts(), ],
        external: [/\.css$/, /\.sass$/],
    },
];
