const { criarApp } = require('./app');
const config = require('./config');

const app = criarApp();
app.listen(config.porta, () => {
  console.log(`API do Clínica+ rodando em http://localhost:${config.porta}`);
});
