JSCS = node_modules/.bin/jscs
JSHINT = node_modules/.bin/jshint
MOCHA = node_modules/.bin/mocha --harmony
NPM_ENV_VARS = npm_config_registry=https://registry.npmjs.org/
NPM = $(NPM_ENV_VARS) npm
XYZ = $(NPM_ENV_VARS) node_modules/.bin/xyz --branch master --repo git@github.com:plaid/npmserve-server.git

SRC = $(shell find . -name '*.js' -not -path './node_modules/*' -not -path './data/*')
TEST_SRC = $(shell find test -name '*.js')
ETE_TEST_SRC = $(shell find endtoend -name '*.js')

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


.PHONY: test-endtoend
test-endtoend:
	$(MOCHA) --timeout 120000 -- $(ETE_TEST_SRC)
