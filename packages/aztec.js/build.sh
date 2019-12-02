echo $CHANGED_MODULES;

if [ "$CI" = true ] && [ ! -d "dist" ] || [[ "aztec.js" =~ $CHANGED_MODULES ]]; then
  echo "Re-building bundle";
  ./node_modules/.bin/webpack --config ./webpack.dev.js;
fi