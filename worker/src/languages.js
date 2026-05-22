const languages = {
    js: {
        image: 'node:alpine',
        cmd: ['node', '--input-type=module', '-']
    },
    ts: {
        image: 'ts-node:alpine',
        cmd: ['ts-node', '-']
    },
    py: {
        image: 'python:alpine',
        cmd: ['python3', '-']
    },
    rb: {
        image: 'ruby:alpine',
        cmd: ['ruby', '-']
    },
    php: {
        image: 'php:alpine',
        cmd: ['php', '-']
    },
    cpp: {
        image: 'frolvlad/alpine-gxx',
        cmd: ['sh', '-c', 'cat > temp.cpp && g++ temp.cpp -o temp && ./temp']
    },
    c: {
        image: 'alpine',
        cmd: ['sh', '-c', 'apk add --no-cache gcc musl-dev && cat > temp.c && gcc temp.c -o temp && ./temp']
    },
};

module.exports = languages;