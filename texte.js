async function consultaModeloEmail(db, modeloEmail, coluns="*") {
    try {
        const resolve_1 = await new Promise((resolve, reject) => {
            db.all(`SELECT ${coluns} FROM modeloEmail WHERE id = ?`,
                [modeloEmail],
                (err, rows) => {
                    if ((err) || (rows.length === 0)) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
        }).then(res =>{return res})
        
    } catch (reject_1) {
        throw new Error(reject_1);
    }

}

function abrirBranco() {

    try {
        return new Promise((resolve, rejecte) => {

            const sqlite3 = require('sqlite3').verbose()
            const db = new sqlite3.Database('banco.db', (err) => {
                if (err) {
                    console.error('Erro ao criar ou abrir o banco de dados:', err.message);
                    rejecte('Erro ao criar ou abrir o banco de dados:', err.message)
                } else {
                    console.log('Banco de dados aberto com sucesso.');
                    resolve(db)
                }
            })
        }).then((res)=> {
            return res
        }).catch(err=>{
            throw new Error(err)
        })

    }
    catch (err) { console.log("Erro ao abrir o banco:", err) }
}

async function teste(){
    let db = await abrirBranco()
    
    consultaModeloEmail(db, 1)
}


