# laudspeaker API
run services:
docker-compose up

run backend and front end:
npm install
npm run start

stop all running services:
postgres: sudo systemctl stop postgresql.service
redis: /etc/init.d/redis-server stop
mongo: sudo systemctl stop mongod

remove compose conatiners
 docker-compose down --volumes