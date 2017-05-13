SHELL := /bin/bash
PATH  := ./node_modules/.bin:$(PATH)

LESS_FILES := $(shell find less -name "*.less")
JS_FILES := $(shell find js -name "*.js")

# List of polyfills to include (sorted manually)
POLYFILLS := polyfills/fetch.js

ROLLUP := rollup -c .rollup.config.js

.PHONY: all clean lint deps

all: build/css/app.css build/js/bundle.js build/js/polyfills.js

clean:
	rm -rf build/

deps:
	npm prune
	npm install

lint:
	standard js/**/*.js
	lessc --lint less/app.less

build/css/app.css: $(LESS_FILES)
	@mkdir -p $(@D)
ifeq ($(BUILD_MODE), release)
	lessc less/app.less | postcss -u autoprefixer -u cssnano -o $@
else
	lessc less/app.less | postcss -u autoprefixer -o $@
endif

build/js/bundle.js: $(JS_FILES)
	@mkdir -p $(@D)
	$(ROLLUP) -o $@ js/app.js

build/js/polyfills.js: $(POLYFILLS)
	@mkdir -p $(@D)
	uglifyjs $+ -o $@

