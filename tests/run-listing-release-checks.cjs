/* Local-only regression runner. No production credentials, database writes or deployment. */
const {spawnSync}=require("node:child_process");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const suites=["listing-master-regression.cjs","listing-advertising-behaviour.cjs","admin-listing-review-behaviour.cjs","photo-approval-server-behaviour.cjs"];
for(const suite of suites){
 console.log("\n=== "+suite+" ===");
 const result=spawnSync(process.execPath,[path.join(__dirname,suite)],{cwd:root,stdio:"inherit"});
 if(result.error||result.status!==0){console.error("Release check failed:",suite,result.error||result.status);process.exit(1);}
}
if(process.argv.includes("--browser")){
 const result=spawnSync(process.env.PYTHON||"python3",[path.join(__dirname,"listing-browser-layout.py")],{cwd:root,stdio:"inherit"});
 if(result.error||result.status!==0){console.error("Browser check failed",result.error||result.status);process.exit(1);}
}else console.log("\nBrowser layout suite skipped; use --browser with Playwright and Chromium installed.");
console.log("\nLocal checks passed. Separate read-only SQL declaration checks and authenticated integration tests are still required. No deployment performed.");
