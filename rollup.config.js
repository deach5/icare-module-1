import copy from 'rollup-plugin-copy';

export default [
    
    {
        input: 'src/functions.js',
        context: 'window',
        external: [ 'jQuery', 'rebus_config' ],
        output: {
            file: 'js/functions.min.js',
            sourcemap: true,
            interop: false,
            format: 'iife',
            name: 'rebus',
            globals: {
                '$': 'jQuery',
                rebus_config: 'rebus_config'
            }
        },
        plugins: [
            copy({
              targets: [
                { src: [
                        'src/iefixes.min.js',
                        'src/ofi.min.js',
                        'src/screen-reader.js',
                        'src/scormdriver.js',
                        'src/svg4everybody.min.js',
                        'src/jspdf.min.js'
                    ], dest: 'js' },
                { src: 'src/rebus.*.js', dest: 'js' },
                { src: 'src/api', dest: 'js' }
              ]
            })
        ]
    },
    {
        input: 'src/jquery.libs.min.js',
        context: 'window',
        output: {
            file: 'js/jquery.libs.min.js',
            name: 'jQuery',
            format: 'umd',
        }
    },
    {
        input: 'src/bootstrap.js',
        context: 'window',
        output: {
            file: 'js/bootstrap.min.js',
            sourcemap: true,
            name: 'bootstrap',
            format: 'umd'
        }
    }
];
