const emailPadrao = require('./emailPadrao');

async function criarBancoPadrao(){
    const db = await emailPadrao.abrirBanco();
    await emailPadrao.criarBase(db);
    await emailPadrao.fecharBanco(db);
}

criarBancoPadrao();