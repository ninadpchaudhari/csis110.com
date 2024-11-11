const path = require('path');

module.exports = {
    entry: './audio-wav.js', // Your main JavaScript file
    output: {
        filename: 'audio-wav.bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'production'
};