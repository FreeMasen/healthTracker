const path = require('path');

module.exports = function config(env) {
    let opts = {
        entry: {
            worker: path.join(__dirname, 'worker.ts'),
            serviceWorker: path.join(__dirname, 'serviceWorker.ts'),
        },
        output: {
            filename: '[name].js',
            path: path.join(__dirname, 'src','assets'),
        },
        resolve: {
            extensions: ['.wasm', '.mjs', '.js', '.json', '.tsx', '.ts', '.jsx']
          },
        module: {
            rules: [{
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: 'ts-loader'
            }]
        },
    };
    opts.devtool = 'source-map';
    if (env === 'prod') {
        opts.mode = 'production';
        opts.output.path = path.join(__dirname, 'docs');
    } else {
        opts.mode = 'development';
        opts.devServer = {
        }
    }
    return opts;
}