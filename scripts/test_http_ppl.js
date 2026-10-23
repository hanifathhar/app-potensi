const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  console.log("Testing Peternakan Access for PPL Pertanian & PPL Perikanan...");
  await runCmd(vm, `cd /home/hnf/app-potensi && node -e '
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "rahasia-super-aman";

    const tokenPplTani = jwt.sign({
      id: "test-ppl-tani",
      nama: "Budi PPL Pertanian",
      username: "ppltani",
      peran: "PPL_PERTANIAN",
      role: "PPL_PERTANIAN",
      kd_kecamatan: "12.03.01",
      kd_desa_list: ["12.03.01.2001"]
    }, secret, { expiresIn: "1h" });

    const tokenPplIkan = jwt.sign({
      id: "test-ppl-ikan",
      nama: "Joko PPL Perikanan",
      username: "pplikan",
      peran: "PPL_PERIKANAN",
      role: "PPL_PERIKANAN",
      kd_kecamatan: "12.03.01",
      kd_desa_list: ["12.03.01.2001"]
    }, secret, { expiresIn: "1h" });

    async function test() {
      // Test 5: PPL Pertanian access /api/peternakan (should be 200)
      const res5 = await fetch("http://localhost:3008/api/peternakan", {
        headers: { "Authorization": "Bearer " + tokenPplTani }
      });
      console.log("PPL Pertanian -> /api/peternakan:", res5.status);

      // Test 6: PPL Perikanan access /api/peternakan (should be 403 Forbidden)
      const res6 = await fetch("http://localhost:3008/api/peternakan", {
        headers: { "Authorization": "Bearer " + tokenPplIkan }
      });
      const data6 = await res6.json();
      console.log("PPL Perikanan -> /api/peternakan:", res6.status, data6.error || data6);
    }

    test().catch(console.error);
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
