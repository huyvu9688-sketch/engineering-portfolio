import { del } from "@vercel/blob";

const pathname = process.argv[2];
if (!pathname) {
  console.error("usage: node scripts/delete-blob-asset.mjs <pathname>");
  process.exit(1);
}

await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
console.log("deleted:", pathname);
