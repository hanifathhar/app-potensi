const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  console.log('Testing SSH to 192.168.1.106 with various credentials...');
  
  // Try root with @#Tim1t42026
  console.log('--- Trying root@192.168.1.106 ---');
  await runCmd(bastion, "sshpass -p '@#Tim1t42026' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@192.168.1.106 'hostname; whoami' || true");

  // Try root with @programmer
  console.log('--- Trying root@192.168.1.106 with @programmer ---');
  await runCmd(bastion, "sshpass -p '@programmer' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@192.168.1.106 'hostname; whoami' || true");

  // Try hnf with @programmer
  console.log('--- Trying hnf@192.168.1.106 with @programmer ---');
  await runCmd(bastion, "sshpass -p '@programmer' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 hnf@192.168.1.106 'hostname; whoami' || true");

  // Try admin with @programmer
  console.log('--- Trying admin@192.168.1.106 with @programmer ---');
  await runCmd(bastion, "sshpass -p '@programmer' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 admin@192.168.1.106 'hostname; whoami' || true");

  bastion.end();
}

main().catch(console.error);
