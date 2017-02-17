default: build-prod

build-dev:
	npm run build-js-dev
build-prod:
	npm run build-js-prod
watch:
	npm run watch-js
posts:
	./make-post-list.py entries/
