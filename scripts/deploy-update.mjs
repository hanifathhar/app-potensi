import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const jumpConfig = {
  host: '103.167.12.53',
  port: 22,
  username: 'root',
  password: '@#Tim1t42026',
  readyTimeout: 30000,
};

const targetConfig = {
  host: '192.168.1.101',
  port: 22,
  username: 'hnf',
  password: '@programmer',
  readyTimeout: 30000,
};

function executeOnTarget(cmd) {
  return new Promise((resolve, reject) => {
    const jumpClient = new Client();
    jumpClient.on('ready', () => {
      jumpClient.forwardOut('127.0.0.1', 12345, targetConfig.host, targetConfig.port, (err, stream) => {
        if (err) {
          jumpClient.end();
          return reject(err);
        }
        const targetClient = new Client();
        targetClient.on('ready', () => {
          targetClient.exec(cmd, (err, execStream) => {
            if (err) {
              targetClient.end();
              jumpClient.end();
              return reject(err);
            }
            let stdout = '';
            let stderr = '';
            execStream
              .on('close', (code) => {
                targetClient.end();
                jumpClient.end();
                resolve({ code, stdout, stderr });
              })
              .on('data', (d) => {
                process.stdout.write(d.toString());
                stdout += d.toString();
              })
              .stderr.on('data', (d) => {
                process.stderr.write(d.toString());
                stderr += d.toString();
              });
          });
        }).connect({ sock: stream, username: targetConfig.username, password: targetConfig.password });
      });
    }).connect(jumpConfig);
  });
}

function uploadFileSFTP(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const jumpClient = new Client();
    jumpClient.on('ready', () => {
      jumpClient.forwardOut('127.0.0.1', 12345, targetConfig.host, targetConfig.port, (err, stream) => {
        if (err) {
          jumpClient.end();
          return reject(err);
        }
        const targetClient = new Client();
        targetClient.on('ready', () => {
          targetClient.sftp((err, sftp) => {
            if (err) {
              targetClient.end();
              jumpClient.end();
              return reject(err);
            }
            sftp.fastPut(localPath, remotePath, (err) => {
              targetClient.end();
              jumpClient.end();
              if (err) return reject(err);
              resolve();
            });
          });
        }).connect({ sock: stream, username: targetConfig.username, password: targetConfig.password });
      });
    }).connect(jumpConfig);
  });
}

async function main() {
  console.log('🚀 Starting deployment of user management updates to server...');

  const filesToUpload = [
    'prisma/schema.prisma',
    'lib/auth.ts',
    'middleware.ts',
    'components/Sidebar.tsx',
    'app/api/auth/login/route.ts',
    'app/api/me/route.ts',
    'app/api/admin/dashboard/route.ts',
    'app/api/pertanian/route.ts',
    'app/api/perikanan/route.ts',
    'app/api/peternakan/route.ts',
    'app/api/pengaturan/pengguna/route.ts',
    'app/(dashboard)/pengaturan/pengguna/PenggunaClientView.tsx',
    'app/(dashboard)/dashboard/page.tsx',
  ];

  for (const file of filesToUpload) {
    const local = path.join(process.cwd(), file);
    const remote = `/home/hnf/app-potensi/${file.replace(/\\/g, '/')}`;
    console.log(`Uploading ${file} -> ${remote}`);
    await uploadFileSFTP(local, remote);
  }

  console.log('✅ All files uploaded successfully.');

  console.log('🔄 Running prisma db push and generate on server...');
  await executeOnTarget(`cd /home/hnf/app-potensi && npx prisma db push --accept-data-loss && npx prisma generate`);

  console.log('🔨 Building Next.js application on server...');
  await executeOnTarget(`cd /home/hnf/app-potensi && npm run build`);

  console.log('🔄 Restarting PM2 process...');
  await executeOnTarget(`cd /home/hnf/app-potensi && pm2 restart app-potensi && pm2 status`);

  console.log('🌐 Testing server response on port 3008...');
  await executeOnTarget(`curl -I http://localhost:3008/login || true`);

  console.log('🎉 Deployment complete!');
}

main().catch((err) => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
