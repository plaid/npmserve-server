JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint
NPM = npm
MOCHA = node_modules/.bin/mocha --harmony
XYZ = node_modules/.bin/xyz --branch master --repo git@github.com:plaid/npmserve-server.git

SRC = $(shell find . -name '*.js' -not -path './node_modules/*' -not -path './data/*')
TEST_SRC = $(shell find test -name '*.js')

.PHONY: lint
lint:
	$(JSHINT) -- $(SRC)
	$(JSCS) -- $(SRC)


.PHONY: release-major release-minor release-patch
release-major release-minor release-patch:
	@$(XYZ) --increment $(@:release-%=%)


.PHONY: setup
setup:
	$(NPM) install


.PHONY: test
test:
	$(MOCHA) --timeout 120000 -- $(TEST_SRC)
