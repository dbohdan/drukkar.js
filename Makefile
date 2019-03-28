default: build-prod

build-dev:
	yarn build-js-dev
build-prod:
	yarn build-js-prod
posts:
	./make-post-list.py entries/
test:
	yarn test
watch:
	yarn watch-js
