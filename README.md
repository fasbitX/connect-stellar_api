# Setup and Run Admin and Apis 

1- Install docker
  * Run apt-get update
  * Run apt-get install docker.io 

2- Install docker compose 
  * https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04
  
3- Download docker-compose.yml file https://github.com/fasbitX/connect-stellar_api/blob/master/docker/docker-compose.yml

4- Download .env file and change it https://github.com/fasbitX/connect-stellar_api/blob/master/.env

5- Run command 
  * docker-compose up -d
  
6- After one minute, open this link in the browser to create admin account http://165.227.77.160:4000/admin/address (You have to change the ip to the server ip) # Open this link ONLY one time
