module.exports = {
    multipass: true,
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeTitle: false,
                    removeViewBox: false
                }
            }
        },
        'removeDimensions',
        {
            name: 'removeAttrs',
            params: {
                attrs: [
                    'data-name'
                ]
            }
        }
    ]
};
