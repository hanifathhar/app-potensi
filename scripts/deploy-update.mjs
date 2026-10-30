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

function executeOnBastion(cmd) {
  return new Promise((resolve, reject) => {
    const jumpClient = new Client();
    jumpClient.on('ready', () => {
      jumpClient.exec(cmd, (err, execStream) => {
        if (err) {
          jumpClient.end();
          return reject(err);
        }
        let stdout = '';
        let stderr = '';
        execStream
          .on('close', (code) => {
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
    }).on('error', reject).connect(jumpConfig);
  });
}

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
        }).on('error', (e) => {
          jumpClient.end();
          reject(e);
        }).connect({ sock: stream, username: targetConfig.username, password: targetConfig.password, readyTimeout: 30000 });
      });
    }).on('error', reject).connect(jumpConfig);
  });
}

function uploadFileViaStream(targetClient, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(localPath);
    targetClient.exec(`cat > "${remotePath}"`, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Failed writing ${remotePath} (code ${code})`));
        resolve();
      });
      stream.on('data', () => {});
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      stream.end(content);
    });
  });
}

function uploadFilesBatchStream(filePairs) {
  return new Promise((resolve, reject) => {
    const jumpClient = new Client();
    jumpClient.on('ready', () => {
      jumpClient.forwardOut('127.0.0.1', 12345, targetConfig.host, targetConfig.port, (err, stream) => {
        if (err) {
          jumpClient.end();
          return reject(err);
        }
        const targetClient = new Client();
        targetClient.on('ready', async () => {
          try {
            for (const { local, remote } of filePairs) {
              console.log(`Uploading ${path.relative(process.cwd(), local)} -> ${remote}`);
              await uploadFileViaStream(targetClient, local, remote);
            }
            targetClient.end();
            jumpClient.end();
            resolve();
          } catch (e) {
            targetClient.end();
            jumpClient.end();
            reject(e);
          }
        }).on('error', (e) => {
          jumpClient.end();
          reject(e);
        }).connect({ sock: stream, username: targetConfig.username, password: targetConfig.password, readyTimeout: 30000 });
      });
    }).on('error', reject).connect(jumpConfig);
  });
}

async function main() {
  console.log('🚀 Memulai proses deployment app-potensi ke server 192.168.1.101 (via 103.167.12.53)...');

  // 1. Bersihkan proses liar di /dev/shm dan proses orphan di port 3008
  console.log('🧹 Membersihkan proses orphan pada port 3008 & membebaskan memori...');
  await executeOnTarget(`
    sed -i '/redis-sentine/d' ~/.bashrc ~/.profile 2>/dev/null || true
    sed -i '/85.121.176.90/d' ~/.bashrc ~/.profile 2>/dev/null || true
    kill -9 95994 95995 95996 1060 2>/dev/null || true
    rm -rf /dev/shm/x86_64 /tmp/x86_64 2>/dev/null || true
    pm2 stop app-potensi 2>/dev/null || true
    fuser -k 3008/tcp 2>/dev/null || true
    free -m
  `);

  const filesToUpload = [
    'prisma/schema.prisma',
    'package.json',
    'middleware.ts',
    'lib/auth.ts',
    'hooks/useAuthority.ts',
    'components/Sidebar.tsx',
    'components/Header.tsx',
    'components/potensi/LocationPicker.tsx',
    'components/potensi/SpatialBoundaryPicker.tsx',
    'components/potensi/UnitFotoKegiatan.tsx',
    'components/potensi/UnitPendanaan.tsx',
    'components/potensi/UnitSiklusProduksi.tsx',
    'components/dashboard/PotensiMap.tsx',
    'components/dashboard/SingleLocationMap.tsx',
    'components/dashboard/DashboardPertanianView.tsx',
    'components/dashboard/DashboardPerikananView.tsx',
    'components/dashboard/DashboardPeternakanView.tsx',
    'components/landing/PortalMapSection.tsx',
    'app/globals.css',
    'app/layout.tsx',
    'app/page.tsx',
    'app/login/page.tsx',
    'app/profile/page.tsx',
    'app/(dashboard)/dashboard/page.tsx',
    'app/(dashboard)/pertanian/page.tsx',
    'app/(dashboard)/pertanian/PertanianClientView.tsx',
    'app/(dashboard)/pertanian/[id]/page.tsx',
    'app/(dashboard)/pertanian/[id]/PertanianDetailView.tsx',
    'app/(dashboard)/perikanan/page.tsx',
    'app/(dashboard)/perikanan/PerikananClientView.tsx',
    'app/(dashboard)/perikanan/[id]/page.tsx',
    'app/(dashboard)/perikanan/[id]/KolamDetailView.tsx',
    'app/(dashboard)/peternakan/page.tsx',
    'app/(dashboard)/peternakan/PeternakanClientView.tsx',
    'app/(dashboard)/peternakan/[id]/page.tsx',
    'app/(dashboard)/peternakan/[id]/PeternakanDetailView.tsx',
    'app/(dashboard)/pendanaan/page.tsx',
    'app/(dashboard)/pendanaan/PendanaanClientView.tsx',
    'app/(dashboard)/pengaturan/page.tsx',
    'app/(dashboard)/pengaturan/PengaturanClientView.tsx',
    'app/(dashboard)/pengaturan/pengguna/page.tsx',
    'app/(dashboard)/pengaturan/pengguna/PenggunaClientView.tsx',
    'app/api/admin/dashboard/route.ts',
    'app/api/pertanian/route.ts',
    'app/api/perikanan/route.ts',
    'app/api/peternakan/route.ts',
    'app/api/pendanaan/route.ts',
    'app/api/foto/route.ts',
    'app/api/siklus-produksi/route.ts',
    'app/api/pengaturan/pengguna/route.ts',
    'public/tapselbangkitwhite.png',
    'public/images/tapselbangkitwhite.png',
  ];

  const validFiles = filesToUpload.filter((f) => fs.existsSync(path.join(process.cwd(), f)));

  const remoteDirs = Array.from(
    new Set(
      validFiles.map((f) => {
        const dir = path.posix.dirname(`/home/hnf/app-potensi/${f.replace(/\\/g, '/')}`);
        return `"${dir}"`;
      })
    )
  );
  console.log('📁 Memastikan direktori di server tersedia...');
  await executeOnTarget(`mkdir -p ${remoteDirs.join(' ')}`);

  const filePairs = validFiles.map((file) => ({
    local: path.join(process.cwd(), file),
    remote: `/home/hnf/app-potensi/${file.replace(/\\/g, '/')}`,
  }));

  await uploadFilesBatchStream(filePairs);
  console.log('✅ Semua file berhasil diunggah ke server.');

  console.log('🔄 Sinkronisasi skema database Prisma (db push & generate) di server...');
  const dbRes = await executeOnTarget(`cd /home/hnf/app-potensi && npx prisma db push --accept-data-loss && npx prisma generate`);
  if (dbRes.code !== 0) {
    throw new Error(`Prisma db push/generate gagal dengan kode ${dbRes.code}`);
  }

  console.log('🔨 Menjalankan build produksi Next.js di server...');
  const buildRes = await executeOnTarget(`cd /home/hnf/app-potensi && NODE_OPTIONS="--max-old-space-size=1024" npx next build`);
  if (buildRes.code !== 0) {
    throw new Error(`Next.js build gagal dengan kode ${buildRes.code}`);
  }

  console.log('🔄 Menjalankan ulang app-potensi di PM2 pada port 3008...');
  await executeOnTarget(`
    cd /home/hnf/app-potensi
    fuser -k 3008/tcp 2>/dev/null || true
    pm2 delete app-potensi 2>/dev/null || true
    PORT=3008 pm2 start ./node_modules/.bin/next --name "app-potensi" -- start -H 0.0.0.0 -p 3008
    pm2 save
    sleep 3
    pm2 status
    curl -I -s http://127.0.0.1:3008 | head -n 5
  `);

  console.log('🌐 Memastikan Nginx di Bastion (103.167.12.53:3008 & HTTPS dalihan.tapselkab.go.id) meneruskan trafik ke 192.168.1.101:3008...');
  const nginxConf = `# 1. Standard HTTPS Port 443 (via SNI stream on 127.0.0.1:8443)
server {
    listen 127.0.0.1:8443 ssl;
    listen [::1]:8443 ssl;
    server_name dalihan.tapselkab.go.id;

    ssl_certificate /etc/letsencrypt/live/dalihan.tapselkab.go.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalihan.tapselkab.go.id/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://192.168.1.101:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# 2. Standard HTTP Port 80 (Redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name dalihan.tapselkab.go.id;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# 3. Direct Port 3008
server {
    listen 3008;
    server_name dalihan.tapselkab.go.id 103.167.12.53 _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://192.168.1.101:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
`;
  const bastionCmd = `cat << 'EOF' > /etc/nginx/sites-available/app-potensi-3008
${nginxConf}
EOF
ln -sf /etc/nginx/sites-available/app-potensi-3008 /etc/nginx/sites-enabled/app-potensi-3008
nginx -t && systemctl reload nginx
curl -I -s http://103.167.12.53:3008 | head -n 5
`;
  await executeOnBastion(bastionCmd);

  console.log('🎉 Deployment selesai dan aplikasi aktif di http://103.167.12.53:3008 !');
}

main().catch((err) => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
