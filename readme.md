# IPDC DANA BACKEND

This is the backend repository for IPDC Dana Backend Project.

## Essential command
```
cd existing_repo
git remote add origin https://gitlab.com/asad.pstu/ipdc-dana-backend.git
git checkout -b "YOUR-_BRANCH"
git add .
git commit -m "YOUR COMMIT MESSAGE"
git pull origin Dev
git push 
```

## Run Project
```
npm run code:format
npm run dev

```

## For Docker with Nginx 
Kindly connect with Team Lead.
1. Deploy = `docker-compose up --force-recreate -d `
2. Stop Container = `docker-compose down`
3. See Logs = `docker-compose logs -f`

## Run project on Ngnix
localhost:80

## Deploy Backend without Docker and Nginx
`pm2 start npm --name "IPDC-DANA-BACKEND" -- start`

## KIll PORT
npx kill-port 5000

` "(DESCRIPTION= (ADDRESS_LIST=  (ADDRESS=(PROTOCOL=TCP) (HOST=172.16.19.43)(PORT=1521) ) ) (CONNECT_DATA=(SID=DANADB) ) )",`


## FOLDER CLEANING
shopt -s extglob
rm -Rf !("index.html") Ex. index.html is the file that you dont want to delete except others.




