./node_modules/.bin/webpack
ng build --prod --output-path docs --base-href /healthTracker/
touch ./docs/.nojekyll
cp ./docs/index.html ./docs/404.html