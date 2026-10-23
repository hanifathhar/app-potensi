const jwt = require('jsonwebtoken');
const { connectBastion } = require('./remote_exec');

const keys = {
  key: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAgIiFFtQW0P2bvB3YYyBunVNxtVET7aqeVSKu0Y7I7Q92WuUz
7xVbaD4aJLFNADgUbqTcphccRTHhl5XWFq1RhyyoHYjL22ItPuq35nRmhouZ1NBJ
AQDEjww2Q/y1B+PahCn/Q7UyofJqZz/GnkCeDdRXgFh8dNayY0RSgC41X6tAx0Sl
q9wjoXRVvOK2gsCw18CkzSQtvZUNM0x2N6z42iO0CEIfyEon+WXnFCmc6n91ai7Z
jNj14kp6FTxG2iZ0pvFT1S6V6A0MDWmFurb7105I4774kqJGobJOk32k263R5c6Q
9Abkx0vaE929cewhjSqofauro5raoTaa2+CNYwIDAQABAoIBAEHrwrZumDUfnNvi
QrS0UYcG4O6pYpsmQoZPf3Gi1ZIfuAfuPbCFN5hDIY1oEaHnITOOAkx81db3OkhQ
ZLjEs2esk5xyKHuf4qy+HQto75xZxM/M82Q8TJNBJCPCW+ZsCgp2r6C+MfW1KrVB
lFBdu7JEEYyV1V7nLh6TT+zFxkIGCYoloBcqp3RvlIM3/gzUlltHsBljIDwC5VpC
mLlVXlk5rtk4EZfmNOh8+tXJLC383jIv0aveFX+r+xL7xNlTymFnAVlyuUAt5OUY
YDxZUQ56+iTfDr+LS12yhmyD35tDfEO5ShAg3AKn92K1RNa5OIWpFCQimhblCH8b
SIMB3CECgYEA20j5jR/oVqrawohSak6hQVnqY0eSHxbljKXKNN5fG9YzA1i8rlhh
Da+eDarhrRmKrr62VUlwJ/Lu1tEj1nYfk4H9mm3hXfvqbKkaWmaoF3Nl5TECr0uJ
IdtN8P91ArvM0yVdNHVzOaMtxk+RevmJj6vbYrJGNLl98FN+AW+iMqcCgYEAlg26
+ll7G4pNllo3Bk9WtK3lR7KyEF0eUxb3+yB4bQFR54gTsddPtCXgzjWcnYksAh1l
S0uq18MM1WOqlRfUCPvfzzaWSL9jYjml7KAOqw5cZYb6aGyGR1h1dKXWo4hSJZnc
pYJNQxsRyL2mxomVDn3jn/442KqRqbdQxsSqkuUCgYBA1Acq6Kb4kFRSNJkg4pQb
zOhVZ4BUfqFofk8UaDV39lBoieBmLqyqriOs6LsFQMrWNH2VIzvsI47mpTfSHGPj
aQe/kwKQlXxNmYS3+ydwn2YdZurjRhKJltspB2zhXQIF3kL60ko5XPuYaEebMpCv
j+AxAoFs7vXDiftzkzxBewKBgAWeYf/51chEN3+HxUOxONfvIwS6Rjyin/4QgByh
LKE4SW7YA5THMS7XtEFEdKbZehJiM2bMYItPvG1JHBwVFlV3yPujWaFDuV72NaZU
n/f7w63xjfLXDXgicdN6Wj0pX5oU1tRDuszmeJYBs/r/L9upDxrwlARY7rdiK94l
gxWZAoGBAKjkQx7dUSlt3LoHONJw6wOytpFkm/dfDkfkslfn5riI0JXVqn0Q56Wz
yUldFTR5X91VTxQkJsirloPSlx5E6xqxWmWYip0buPByXi7WyyyL/OjrFHHdAxDt
zPZFFG8puHW2/nQW4my0Wn503K0enOvMqppAGkAMQdSkCC8qeIcf
-----END RSA PRIVATE KEY-----`
};

function signToken() {
  return jwt.sign(
    {
      iss: 'api',
      attrs: { id: 1 },
      scope: ['user']
    },
    keys.key,
    {
      algorithm: 'RS256',
      expiresIn: '2h'
    }
  );
}

function runCurl(bastion, method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = ['Content-Type: application/json'];
    if (token) headers.push(`Authorization: Bearer ${token}`);
    const headerStr = headers.map(h => `-H "${h}"`).join(' ');
    
    let cmd = `curl -s -X ${method} "http://192.168.1.106:81/api${path}" ${headerStr}`;
    if (data) {
      const escaped = JSON.stringify(data).replace(/'/g, "'\\''");
      cmd += ` -d '${escaped}'`;
    }

    bastion.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => errOut += d);
      stream.on('close', code => {
        try {
          resolve(JSON.parse(out));
        } catch (e) {
          resolve({ raw: out, errOut, code });
        }
      });
    });
  });
}

async function main() {
  const bastion = await connectBastion();
  console.log('Connected to bastion (103.167.12.53)');

  const token = signToken();
  console.log('Signed admin JWT token successfully.');

  // 1. Check existing hosts
  console.log('\n--- Step 1: Checking existing hosts ---');
  const hosts = await runCurl(bastion, 'GET', '/nginx/proxy-hosts', null, token);
  let existing = null;
  if (Array.isArray(hosts)) {
    existing = hosts.find(h => h.domain_names && h.domain_names.includes('dalihan.tapselkab.go.id'));
  }

  let hostId;
  if (existing) {
    console.log(`Host dalihan.tapselkab.go.id already exists with ID ${existing.id}`);
    hostId = existing.id;
  } else {
    console.log('Creating new proxy host for dalihan.tapselkab.go.id -> 192.168.1.101:3008 (HTTP initial)...');
    const createData = {
      domain_names: ['dalihan.tapselkab.go.id'],
      forward_scheme: 'http',
      forward_host: '192.168.1.101',
      forward_port: 3008,
      access_list_id: 0,
      certificate_id: 0,
      ssl_forced: 0,
      caching_enabled: 0,
      block_exploits: 0,
      advanced_config: '',
      meta: {},
      allow_websocket_upgrade: 1,
      http2_support: 0,
      hsts_enabled: 0,
      hsts_subdomains: 0
    };
    const createRes = await runCurl(bastion, 'POST', '/nginx/proxy-hosts', createData, token);
    console.log('Create result:', createRes);
    if (!createRes.id) {
      throw new Error('Failed to create proxy host: ' + JSON.stringify(createRes));
    }
    hostId = createRes.id;
  }

  console.log('\n--- Step 2: Checking existing certificate schema ---');
  const allCerts = await runCurl(bastion, 'GET', '/nginx/certificates', null, token);
  console.log('Sample cert:', allCerts && allCerts[0]);

  console.log('\n--- Requesting Let\'s Encrypt Certificate ---');
  // In NPM, the schema for POST /nginx/certificates with letsencrypt:
  // Let's test with minimal or standard properties
  const certData = {
    provider: 'letsencrypt',
    nice_name: 'dalihan.tapselkab.go.id',
    domain_names: ['dalihan.tapselkab.go.id'],
    meta: {
      letsencrypt_email: 'hanifconsultans@gmail.com',
      letsencrypt_agree: true,
      dns_challenge: false
    }
  };

  console.log('Sending certificate request to Let\'s Encrypt (may take 10-30s)...');
  const certRes = await runCurl(bastion, 'POST', '/nginx/certificates', certData, token);
  console.log('Certificate response:', certRes);

  let certId = certRes.id;
  if (!certId) {
    console.log('Checking existing certificates to see if already issued...');
    const allCerts = await runCurl(bastion, 'GET', '/nginx/certificates', null, token);
    if (Array.isArray(allCerts)) {
      const match = allCerts.find(c => c.domain_names && c.domain_names.includes('dalihan.tapselkab.go.id'));
      if (match) {
        console.log(`Found existing certificate ID ${match.id}`);
        certId = match.id;
      }
    }
  }

  if (certId) {
    console.log(`\n--- Step 3: Enabling SSL (Certificate ID ${certId}) on host ID ${hostId} ---`);
    const updateData = {
      domain_names: ['dalihan.tapselkab.go.id'],
      forward_scheme: 'http',
      forward_host: '192.168.1.101',
      forward_port: 3008,
      access_list_id: 0,
      certificate_id: certId,
      ssl_forced: 1,
      caching_enabled: 0,
      block_exploits: 0,
      advanced_config: '',
      meta: {},
      allow_websocket_upgrade: 1,
      http2_support: 1,
      hsts_enabled: 1,
      hsts_subdomains: 0
    };
    const updateRes = await runCurl(bastion, 'PUT', `/nginx/proxy-hosts/${hostId}`, updateData, token);
    console.log('Update result:', updateRes);
  } else {
    console.warn('Certificate ID could not be obtained automatically, please check certRes error details.');
  }

  // 4. Update Bastion Nginx for port 3008: server_name dalihan.tapselkab.go.id 103.167.12.53
  console.log('\n--- Step 4: Updating Bastion Nginx config for port 3008 ---');
  const nginxConf = `server {
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
  const updateBastionCmd = `cat << 'EOF' > /etc/nginx/sites-available/app-potensi-3008\n${nginxConf}EOF\nnginx -t && systemctl reload nginx`;
  await new Promise((resolve, reject) => {
    bastion.exec(updateBastionCmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => {
        console.log('Nginx reload output:', out);
        resolve();
      });
    });
  });

  bastion.end();
  console.log('\nDeployment steps completed!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
