module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> | license: MIT | version: <%= pkg.version %> | build date: <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/queryLib.js',
                dest: 'dist/queryLib.min.js'
            }
        },

        qunit: {
            all: ['test/**/*.html']
        },

        compass: {
            dev: {
                options: {
                    sassDir: 'docs/sass',
                    cssDir: 'docs/css',
                    imagesDir: 'docs/images',
                    environment: 'development',
                    httpGeneratedImagesPath: 'docs/images'
                }
            }
        },

        watch: {
            build: {
                files: ['src/ssm.js'],
                tasks: ['uglify']
            },
            compass: {
                files: ['docs/sass/{,*/}*.{scss,sass}'],
                tasks: ['compass:dev']
            },
        }
    });


    // Required task(s)
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');

    // Default task(s)
    grunt.registerTask('default', ['uglify']);

    // Travis CI tests
    grunt.registerTask('travis', ['qunit']);
};