if [ -e node_modules.tar.gz ]; then
  rm node_modules.tar.gz;
fi;

curl -s -X POST http://localhost:3000/npm/install \
  -H 'content-type: application/x-www-form-urlencoded; charset=utf-8' \
  -d packageJson="$(cat package.json)" \
  -o node_modules.tar.gz;

echo 'testing file integrity'
if gunzip -t node_modules.tar.gz; then
  echo 'file verified'
else
  echo 'server encountered an error'
  echo $(cat node_modules.tar.gz)
  echo 'INSTALL FAILED'
  exit 1
fi

echo 'clear existing node modules'
rm -rf node_modules/*

echo 'decompressing archive'
tar -xmzf node_modules.tar.gz \
  -C node_modules \
  --strip-components=1

echo 'cleaning up'
rm node_modules.tar.gz

exit 0
