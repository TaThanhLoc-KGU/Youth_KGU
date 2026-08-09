const fs = require("fs");
const path = require("path");

const wwwAssets = path.join(__dirname, "../www/assets");
const files = fs.readdirSync(wwwAssets);

const js = files.find((f) => f.endsWith(".js") || f.endsWith(".module.js"));
const css = files.find((f) => f.endsWith(".css"));

const config = {
  app: {
    title: "Youth KGU",
    statusBar: { color: "#1e40af", type: "dark" },
    headerTextColor: "white",
    headerBackgroundColor: "#1e40af",
    backgroundColor: "#f5f5f5",
    backgroundImage: "",
  },
  // Whitelist domain để mini app được phép gọi API và load ảnh
  domains: [
    "tuoitre.vnkgu.edu.vn",
    "h5.zadn.vn",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
  ],
  listCSS: css ? [`assets/${css}`] : [],
  listSyncJS: js ? [`assets/${js}`] : [],
  listAsyncJS: [],
  pages: [],
};

const content = JSON.stringify(config, null, 2);

// app-config.json ở root (CLI đọc ở đây trước)
fs.writeFileSync(path.join(__dirname, "../app-config.json"), content);
// app-config.json trong www/ (CLI fallback)
fs.writeFileSync(path.join(__dirname, "../www/app-config.json"), content);

console.log("app-config.json generated:", config);
