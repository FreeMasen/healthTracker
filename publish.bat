./node_modules/.bin/ng build --prod --output-path docs --base-href /healthTracker/
./node_modules/.bin/webpack
echo '' > ./docs/.nojekyll
cp ./docs/index.html ./docs/404.html
bash 'git add . && git commit -m "publish" && git push'