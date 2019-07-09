ng build --prod --output-path docs --base-href /healthTracker/
./node_modules/.bin/webpack
echo "just say no to jekyll\
" > ./docs/.nojekyll
cp ./docs/index.html ./docs/404.html
git add . && git commit -m "publish" && git push