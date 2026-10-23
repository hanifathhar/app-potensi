const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  console.log('Connected to bastion');

  console.log('1. Enabling debian.sources...');
  await runCmd(bastion, "sed -i 's/Enabled: false/Enabled: true/' /etc/apt/sources.list.d/debian.sources");
  
  console.log('2. Running apt-get update...');
  await runCmd(bastion, "apt-get update");

  console.log('3. Installing certbot and python3-certbot-nginx...');
  await runCmd(bastion, "apt-get install -y certbot python3-certbot-nginx");

  bastion.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
