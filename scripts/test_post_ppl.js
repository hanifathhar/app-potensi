const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  console.log("Testing POST authorization for PPL roles...");
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
      // POST Perikanan oleh PPL Pertanian -> harus 403
      const res1 = await fetch("http://localhost:3008/api/perikanan", {
        method: "POST",
        headers: { "Authorization": "Bearer " + tokenPplTani, "Content-Type": "application/json" },
        body: JSON.stringify({ nm_kolam: "Test Kolam", kd_kecamatan: "12.03.01", kd_desa: "12.03.01.2001" })
      });
      console.log("POST perikanan by PPL Pertanian:", res1.status);

      // POST Pertanian oleh PPL Perikanan -> harus 403
      const res2 = await fetch("http://localhost:3008/api/pertanian", {
        method: "POST",
        headers: { "Authorization": "Bearer " + tokenPplIkan, "Content-Type": "application/json" },
        body: JSON.stringify({ nama: "Test Kebun", kd_kecamatan: "12.03.01", kd_desa: "12.03.01.2001" })
      });
      console.log("POST pertanian by PPL Perikanan:", res2.status);

      // POST Peternakan oleh PPL Perikanan -> harus 403
      const res3 = await fetch("http://localhost:3008/api/peternakan", {
        method: "POST",
        headers: { "Authorization": "Bearer " + tokenPplIkan, "Content-Type": "application/json" },
        body: JSON.stringify({ namaPeternakan: "Test Ternak", kd_kecamatan: "12.03.01", kd_desa: "12.03.01.2001" })
      });
      console.log("POST peternakan by PPL Perikanan:", res3.status);
    }

    test().catch(console.error);
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
