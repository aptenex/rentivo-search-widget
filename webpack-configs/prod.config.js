const path     = require('path');
const webpack  = require('webpack');
const merge    = require('webpack-merge');
const UglifyJS = require('uglifyjs-webpack-plugin');
const styles   = require('./prod/styles');
const fonts    = require('./prod/fonts');
const jScript  = require('./prod/jScript');

const PATHS = {
    source:  path.join(__dirname, '../src'),
    dist:    path.join(__dirname, '../dist'),
    modules: path.join(__dirname, '../node_modules'),
    docs:    path.join(__dirname, '../docs'),
};

module.exports = function () {
    return merge([
        {
            entry:   [
                `${ PATHS.source }/index.jsx`
            ],
            output:  {
                path:     PATHS.dist,
                filename: 'jquery.rentivo-searchbar.js',
            },
            resolve: {
                extensions: ['.js', '.jsx', '.json'],
                modules:    [PATHS.modules, PATHS.source],
                alias:      {
                    '~core':       path.join(PATHS.source, 'core'),
                    '~components': path.join(PATHS.source, 'components'),
                    '~docs':       PATHS.docs,
                }
            },
        },
        {
            plugins: [
                new webpack.DefinePlugin({
                    'process.env': {
                        NODE_ENV: JSON.stringify('production')
                    }
                }),
                new UglifyJS(),
            ]
        },
        jScript(),
        styles(),
        fonts()
    ])
};