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
1. `docker-compose up -d`
2. `docker-compose down`

## Deploy Backend without Docker and Nginx
`pm2 start npm --name "IPDC-DANA-BACKEND" -- start`

## KIll PORT
npx kill-port 5000


