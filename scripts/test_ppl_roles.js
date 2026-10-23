const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  console.log("Testing PPL roles authorization via node script on VM...");
  await runCmd(vm, `cd /home/hnf/app-potensi && node -e '
    const jwt = require("jsonwebtoken");
    const { canAccessSector, isAuthorizedForTerritory } = require("./lib/auth");

    const pplPertanian = {
      id: "test-ppl-tani",
      nama: "Budi PPL Pertanian",
      username: "ppltani",
      peran: "PPL_PERTANIAN",
      role: "PPL_PERTANIAN",
      kd_kecamatan: "12.03.01",
      kd_desa_list: ["12.03.01.2001", "12.03.01.2002"]
    };

    const pplPerikanan = {
      id: "test-ppl-ikan",
      nama: "Joko PPL Perikanan",
      username: "pplikan",
      peran: "PPL_PERIKANAN",
      role: "PPL_PERIKANAN",
      kd_kecamatan: "12.03.01",
      kd_desa_list: ["12.03.01.2001"]
    };

    console.log("=== TEST PPL PERTANIAN ===");
    console.log("Can access pertanian?", canAccessSector(pplPertanian, "pertanian")); // true
    console.log("Can access peternakan?", canAccessSector(pplPertanian, "peternakan")); // true
    console.log("Can access perikanan?", canAccessSector(pplPertanian, "perikanan")); // false

    console.log("Can edit in assigned desa (12.03.01.2001)?", isAuthorizedForTerritory(pplPertanian, "12.03.01", "12.03.01.2001")); // true
    console.log("Can edit in outside desa (12.03.01.2005)?", isAuthorizedForTerritory(pplPertanian, "12.03.01", "12.03.01.2005")); // false
    console.log("Can edit in outside kec (12.03.02)?", isAuthorizedForTerritory(pplPertanian, "12.03.02", "12.03.02.2001")); // false

    console.log("\\n=== TEST PPL PERIKANAN ===");
    console.log("Can access pertanian?", canAccessSector(pplPerikanan, "pertanian")); // false
    console.log("Can access peternakan?", canAccessSector(pplPerikanan, "peternakan")); // false
    console.log("Can access perikanan?", canAccessSector(pplPerikanan, "perikanan")); // true

    console.log("Can edit in assigned desa (12.03.01.2001)?", isAuthorizedForTerritory(pplPerikanan, "12.03.01", "12.03.01.2001")); // true
    console.log("Can edit in outside desa (12.03.01.2002)?", isAuthorizedForTerritory(pplPerikanan, "12.03.01", "12.03.01.2002")); // false
    console.log("Can edit in outside kec (12.03.02)?", isAuthorizedForTerritory(pplPerikanan, "12.03.02", "12.03.02.2001")); // false
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
