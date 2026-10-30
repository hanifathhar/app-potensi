const { connectBastion, runCmd } = require('./remote_exec');

const nginxConfig = `# 1. Standard HTTPS Port 443 (via SNI stream on 127.0.0.1:8443)
server {
    listen 127.0.0.1:8443 ssl;
    listen [::1]:8443 ssl;
    server_name dalihan.tapselkab.go.id;

    ssl_certificate /etc/letsencrypt/live/dalihan.tapselkab.go.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalihan.tapselkab.go.id/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://192.168.1.101:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# 2. Standard HTTP Port 80 (Redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name dalihan.tapselkab.go.id;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# 3. Direct Port 3008
server {
    listen 3008;
    server_name dalihan.tapselkab.go.id 103.167.12.53;

    client_max_body_size 50M;

    location / {
        proxy_pass http://192.168.1.101:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
`;

async function applyConfig() {
  const bastion = await connectBastion();
  console.log('Backing up existing config...');
  await runCmd(bastion, 'cp /etc/nginx/sites-available/app-potensi-3008 /etc/nginx/sites-available/app-potensi-3008.bak');
  
  console.log('Writing new config...');
  const base64 = Buffer.from(nginxConfig).toString('base64');
  await runCmd(bastion, `echo "${base64}" | base64 -d > /etc/nginx/sites-available/app-potensi-3008`);
  
  console.log('Testing nginx config...');
  const testRes = await runCmd(bastion, 'nginx -t');
  if (testRes.code !== 0) {
    console.error('Nginx test failed! Reverting...');
    await runCmd(bastion, 'cp /etc/nginx/sites-available/app-potensi-3008.bak /etc/nginx/sites-available/app-potensi-3008');
    bastion.end();
    process.exit(1);
  }

  console.log('Reloading nginx...');
  await runCmd(bastion, 'systemctl reload nginx');
  console.log('Nginx reloaded successfully!');
  bastion.end();
}

applyConfig().catch(err => {
  console.error(err);
  process.exit(1);
});
