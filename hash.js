const bcrypt = require('bcryptjs');

const run = async () => {
  const hashed = await bcrypt.hash("Test12345", 10);
  console.log("Hashed password:", hashed);
};

run();
