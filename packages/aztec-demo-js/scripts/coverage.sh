echo "Using Mocha " ./node_modules/.bin/mocha --version

NODE_ENV=TEST ./node_modules/.bin/nyc ./node_modules/.bin/mocha ./resources --trace-warnings --exit --colors --recursive --reporter spec
