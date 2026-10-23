const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  console.log('=== BASTION NGINX CONFIGS ===');
  await runCmd(bastion, 'ls -la /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ || true');
  await runCmd(bastion, 'cat /etc/nginx/conf.d/*.conf /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/nginx.conf');

  console.log('\n=== VM PM2 STATUS ===');
  await runCmd(vm, 'pm2 status || true');

  console.log('\n=== VM ECOSYSTEM CONFIG ===');
  await runCmd(vm, 'cat /home/hnf/app-potensi/ecosystem.config.js || true');

  console.log('\n=== VM .ENV (censored) ===');
  await runCmd(vm, 'grep -E "PORT|DATABASE_URL|NEXTAUTH_URL" /home/hnf/app-potensi/.env || true');

  console.log('\n=== VM GIT STATUS ===');
  await runCmd(vm, 'cd /home/hnf/app-potensi && git status && git log -n 1 --oneline');

  bastion.end();
  vm.end();
}

main().catch(console.error);
