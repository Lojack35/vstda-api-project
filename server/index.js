const server = require("./app");
const port = process.env.PORT || 8484;

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
