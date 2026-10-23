const { Client } = require('ssh2');

console.log('Connecting to bastion root@103.167.12.53...');

const jump = new Client();
const target = new Client();

jump.on('ready', () => {
  console.log('Jump host connected (root@103.167.12.53)');
  jump.forwardOut('127.0.0.1', 12345, '192.168.1.101', 22, (err, stream) => {
    if (err) {
      console.error('ForwardOut error:', err);
      jump.end();
      return;
    }
    console.log('ForwardOut to 192.168.1.101 established');
    target.on('ready', () => {
      console.log('Target VM connected (hnf@192.168.1.101)');
      target.exec('uptime && uname -a && whoami && pwd && ls -la', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Command closed with code:', code);
          target.end();
          jump.end();
          process.exit(code || 0);
        }).on('data', (data) => {
          console.log('STDOUT:\n' + data.toString());
        }).stderr.on('data', (data) => {
          console.log('STDERR:\n' + data.toString());
        });
      });
    }).on('error', (err) => {
      console.error('Target VM error:', err);
      jump.end();
      process.exit(1);
    }).connect({
      sock: stream,
      username: 'hnf',
      password: '@programmer',
      readyTimeout: 15000,
    });
  });
}).on('error', (err) => {
  console.error('Jump host error:', err);
  process.exit(1);
}).connect({
  host: '103.167.12.53',
  port: 22,
  username: 'root',
  password: '@#Tim1t42026',
  readyTimeout: 15000,
});
