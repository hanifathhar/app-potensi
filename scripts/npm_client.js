const { connectBastion } = require('./remote_exec');

async function execHttp(bastion, method, path, data, token) {
  const headers = ['Content-Type: application/json'];
  if (token) headers.push(`Authorization: Bearer ${token}`);
  const headerArgs = headers.map(h => `-H "${h}"`).join(' ');
  const dataArg = data ? `-d '${JSON.stringify(data).replace(/'/g, "'\\''")}'` : '';
  const cmd = `curl -s -X ${method} http://192.168.1.106:81/api${path} ${headerArgs} ${dataArg}`;
  
  return new Promise((resolve, reject) => {
    bastion.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.on('close', code => {
        try {
          resolve(JSON.parse(out));
        } catch (e) {
          resolve({ raw: out });
        }
      });
    });
  });
}

async function main() {
  const bastion = await connectBastion();
  console.log('Connected to bastion');

  // Login
  console.log('Logging in to NPM...');
  const loginRes = await execHttp(bastion, 'POST', '/tokens', {
    identity: 'baisnasution2@gmail.com',
    secret: '@#2233'
  });

  if (!loginRes.token) {
    console.error('Failed to login:', loginRes);
    bastion.end();
    return;
  }

  const token = loginRes.token;
  console.log('Login successful! Got token.');

  // List existing proxy hosts
  const hosts = await execHttp(bastion, 'GET', '/nginx/proxy-hosts', null, token);
  console.log('Existing proxy hosts:');
  if (Array.isArray(hosts)) {
    for (const h of hosts) {
      console.log(`- ID ${h.id}: ${h.domain_names.join(', ')} -> http://${h.forward_host}:${h.forward_port} (SSL: ${h.certificate_id ? 'Yes (' + h.certificate_id + ')' : 'No'})`);
    }
  } else {
    console.log(hosts);
  }

  // List existing certificates
  const certs = await execHttp(bastion, 'GET', '/nginx/certificates', null, token);
  console.log('\nExisting certificates:');
  if (Array.isArray(certs)) {
    for (const c of certs) {
      console.log(`- ID ${c.id}: ${c.nice_name} (${c.domain_names ? c.domain_names.join(', ') : ''}) expires ${c.expires_on}`);
    }
  } else {
    console.log(certs);
  }

  bastion.end();
}

main().catch(console.error);
