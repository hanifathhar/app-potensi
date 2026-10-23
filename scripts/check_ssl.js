const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  console.log('=== CHECK SSL & CERTIFICATES ON BASTION ===');
  await runCmd(bastion, 'ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No /etc/letsencrypt/live"');
  await runCmd(bastion, 'ls -la /etc/ssl/certs/ | grep -i tapsel || echo "No tapsel certs in /etc/ssl/certs"');
  await runCmd(bastion, 'grep -rn "ssl_certificate" /etc/nginx/ 2>/dev/null || echo "No ssl_certificate in nginx"');
  await runCmd(bastion, 'grep -rn "tapselkab.go.id" /etc/ 2>/dev/null || echo "No other mentions"');

  console.log('=== DNS CHECK FOR dalihan.tapselkab.go.id ===');
  await runCmd(bastion, 'nslookup dalihan.tapselkab.go.id || dig dalihan.tapselkab.go.id || host dalihan.tapselkab.go.id || ping -c 1 dalihan.tapselkab.go.id || true');

  bastion.end();
}

main().catch(console.error);
