const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🔥 السيرفر شغال بنجاح!");
});

app.listen(PORT, () => {
  console.log("Server started...");
});
