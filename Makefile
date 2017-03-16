test:
       @./node_modules/.bin/mocha  "./dist/tests/*.js" && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js --verbose
       
.PHONY: test
