export const LANGUAGES = {
  javascript: {
    image: 'node:alpine',
    cmd: ['node', '--input-type=module', '-']
  },
  typescript: {
    image: 'ts-node:alpine',
    cmd: ['ts-node', '-']
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
  cpp: {
    image: 'frolvlad/alpine-gxx',
    cmd: ['sh', '-c', 'cat > main.cpp && g++ main.cpp -o main && ./main']
  },
  c: {
    image: 'gcc:alpine',
    cmd: ['sh', '-c', 'cat > main.c && gcc main.c -o main && ./main']
  },
};