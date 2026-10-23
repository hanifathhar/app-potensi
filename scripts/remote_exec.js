const { Client } = require('ssh2');

function connectBastion() {
  return new Promise((resolve, reject) => {
    const bastion = new Client();
    bastion.on('ready', () => resolve(bastion));
    bastion.on('error', reject);
    bastion.connect({
      host: '103.167.12.53',
      port: 22,
      username: 'root',
      password: '@#Tim1t42026',
      readyTimeout: 25000,
    });
  });
}

function connectVM(bastion) {
  return new Promise((resolve, reject) => {
    bastion.forwardOut('127.0.0.1', 12345, '192.168.1.101', 22, (err, stream) => {
      if (err) return reject(err);
      const vm = new Client();
      vm.on('ready', () => resolve({ bastion, vm }));
      vm.on('error', reject);
      vm.connect({
        sock: stream,
        username: 'hnf',
        password: '@programmer',
        readyTimeout: 15000,
      });
    });
  });
}

function runCmd(client, cmd) {
  return new Promise((resolve, reject) => {
    client.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      stream.on('data', (d) => {
        const str = d.toString();
        stdout += str;
        process.stdout.write(str);
      });
      stream.stderr.on('data', (d) => {
        const str = d.toString();
        stderr += str;
        process.stderr.write(str);
      });
    });
  });
}

module.exports = { connectBastion, connectVM, runCmd };
