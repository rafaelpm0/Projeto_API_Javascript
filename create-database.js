const emailPadrao = require('./emailPadrao');

async function criar(){
    const db = await emailPadrao.abrirBanco();
    await emailPadrao.criarBase(db);
    await emailPadrao.fecharBanco(db);
}

criar();