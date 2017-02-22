default: build-prod

build-dev:
	npm run build-js-dev
build-prod:
	npm run build-js-prod
posts:
	./make-post-list.py entries/
test:
	npm test
watch:
	npm run watch-js
