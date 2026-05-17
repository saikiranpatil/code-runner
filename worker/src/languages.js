const languages = {
    javascript: {
        image: 'node:alpine',
        cmd: ['node', '--input-type=module', '-']
    },
    python: {
        image: 'python:alpine',
        cmd: ['python3', '-']
    },
    ruby: {
        image: 'ruby:alpine',
        cmd: ['ruby', '-']
    },
    php: {
        image: 'php:alpine',
        cmd: ['php', '-']
    },
};

module.exports = languages;
