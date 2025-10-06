.PHONY: content-export content-migrate content-seed

content-export:
	cd apps/content-editor && npm run export

content-migrate:
	cd apps/content-editor && npm run migrate

content-seed:
	cd apps/content-editor && npm run seed
