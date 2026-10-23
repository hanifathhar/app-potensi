const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  await runCmd(bastion, 'mkdir -p /var/www/html/.well-known/acme-challenge && echo "challenge-ok" > /var/www/html/.well-known/acme-challenge/test.txt');
  console.log('Testing localhost:');
  await runCmd(bastion, 'curl -i http://localhost/.well-known/acme-challenge/test.txt');
  console.log('Testing public IP:');
  await runCmd(bastion, 'curl -i -H "Host: dalihan.tapselkab.go.id" http://103.167.12.53/.well-known/acme-challenge/test.txt');
  bastion.end();
}

main().catch(console.error);
