const fs = require('fs');
let content = fs.readFileSync('backend/server.js', 'utf8');

const startIdx = content.indexOf("if (process.env.NODE_ENV !== 'test') {");
const beforeDbInit = content.slice(0, startIdx);

const dbInitBlock = content.slice(startIdx);
const lessonsHeader = "// ==========================================";
const lessonsStartIdx = dbInitBlock.indexOf(lessonsHeader);

let cleanLessons = "";
if (lessonsStartIdx !== -1) {
  const lessonsBlock = dbInitBlock.substring(lessonsStartIdx);
  cleanLessons = lessonsBlock.split(" app.listen(PORT")[0];
}

const cleanInit = `if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: false })
    .then(() => {
      console.log('✅ Connection to database established successfully. Database synced.');
      return umzug.up();
    })
    .then((migrations) => {
      if (migrations.length > 0) {
        console.log(\`✅ Executed \${migrations.length} migrations\`);
      } else {
        console.log('✅ Database is up to date');
      }
      app.listen(PORT, '0.0.0.0', () => {
        console.log(\`🚀 Server running on port \${PORT} and listening on 0.0.0.0\`);
      });
    })
    .catch(err => {
      console.error('❌ Error during database initialization:', err);
    });
}

module.exports = app;
`;

const finalContent = beforeDbInit + cleanLessons + "\n" + cleanInit;
fs.writeFileSync('backend/server.js', finalContent);
