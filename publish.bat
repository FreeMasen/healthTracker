node_modules\.bin\ng.cmd build --prod --output-path docs --base-href /healthTracker/

node_modules\.bin\webpack-cli.cmd

echo '' > .\docs\.nojekyll

xcopy .\docs\index.html .\docs\404.html

bash 'git add . && git commit -m "publish" && git push'