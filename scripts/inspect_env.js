const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  console.log('=== 1. CONNECTING TO BASTION ===');
  const bastion = await connectBastion();
  console.log('Bastion connected!');

  console.log('\n=== 2. INSPECTING BASTION (103.167.12.53) ===');
  console.log('--- Nginx & Certbot on Bastion ---');
  await runCmd(bastion, 'which nginx || echo "No nginx on bastion"; which certbot || echo "No certbot on bastion"');
  console.log('--- IPTABLES NAT RULES ---');
  await runCmd(bastion, 'iptables -t nat -L -n -v | grep -E "3008|3000|80|443|192.168.1.101" || echo "No matching nat rules"');
  console.log('--- Active Listening Ports on Bastion ---');
  await runCmd(bastion, 'ss -tulpn | grep -E "3008|80|443" || echo "No ports 3008/80/443 on bastion"');

  console.log('\n=== 3. CONNECTING TO TARGET VM (192.168.1.101) ===');
  const { vm } = await connectVM(bastion);
  console.log('Target VM connected!');

  console.log('\n=== 4. INSPECTING TARGET VM ===');
  console.log('--- System & Tools ---');
  await runCmd(vm, 'whoami && pwd && node -v && npm -v && which pm2 || echo "No pm2"');

  console.log('--- App directory search ---');
  await runCmd(vm, 'find ~ -maxdepth 2 -name "app-potensi" -o -name "pos-app"');
  await runCmd(vm, 'ls -la ~/app-potensi || ls -la ~');

  console.log('--- PM2 / Systemd / Running Node processes ---');
  await runCmd(vm, 'pm2 list || true');
  await runCmd(vm, 'ps aux | grep -E "node|next|npm" | grep -v grep || echo "No node running"');

  console.log('--- Listening Ports on VM ---');
  await runCmd(vm, 'ss -tulpn || netstat -tulpn || echo "Cannot check ports"');

  console.log('--- Nginx & Certbot on VM ---');
  await runCmd(vm, 'which nginx || echo "No nginx on VM"; which certbot || echo "No certbot on VM"');

  bastion.end();
  vm.end();
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
