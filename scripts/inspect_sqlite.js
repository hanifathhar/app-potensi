const { connectBastion, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const db = '/mnt/vm106/home/procy/nginx-proxy-manager/data/database.sqlite';
  
  console.log('--- USERS ---');
  await runCmd(bastion, `sqlite3 ${db} "SELECT id, email, name, nickname, is_disabled FROM user"`);

  console.log('--- AUTH ---');
  await runCmd(bastion, `sqlite3 ${db} "SELECT id, user_id, type, secret FROM auth"`);

  console.log('--- PROXY HOSTS ---');
  await runCmd(bastion, `sqlite3 ${db} "SELECT id, domain_names, forward_host, forward_port, certificate_id, ssl_forced FROM proxy_host"`);

  console.log('--- CERTIFICATE META ---');
  await runCmd(bastion, `sqlite3 ${db} "SELECT id, nice_name, meta FROM certificate WHERE provider='letsencrypt' LIMIT 3"`);

  bastion.end();
}

main().catch(console.error);
