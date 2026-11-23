set -eu
node -e "const fs=require('fs'),c=require('crypto');fs.writeFileSync('.env',['JWT_SECRET','JWT_REFRESH_SECRET','DB_PASSWORD','MONGO_ROOT_PASSWORD'].map(k=>k+'='+c.randomBytes(32).toString('hex')).join('\n'))"
docker compose up --build -d --wait --wait-timeout 180
docker compose ps
curl --fail http://localhost:3000/health
curl --fail http://localhost:3000/ready
curl --fail http://localhost:3000/metrics
node scripts/smoke.js
docker compose logs --no-color > compose.log
