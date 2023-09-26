const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const envioEmail = require('./envioEmail');

function postEnviarEmailPadrao(){
    app.post('/send/email', (req, res) => {
        console.log(req.body)

        try{
            let {host, port, secure = false, user, pass, tls = false, from, remetente, modeloEmail} = req.body
            const db = abrirBranco();
            db.all(`SELECT email FROM remetente WHERE ID = ${remetente}`,
            [],
            (err, rows) => {
                if((err) || (rows.length ===0)){
                    console.log("Remetente nao cadastrado ", err)
                    res.status(404).json({NotFound: "Remetente nao cadastrado", err})
                }else{
                    console.log(rows)
                    remetente = rows;
                   // console.log(rows[0].email)
                }
            })

            /*host - ok, port - ok, secure = false - ok, user - ok, pass - ok, tls = false - ok, from - ok, to, subject,
    text, imagem, assinatura)*/
                 

        }catch(err) {res.status(404).json({NotFound: "Remetente nao cadastrado", err})}
    })
}

function postRemetente() {
    app.post('/insert/remetente', (req, res) => {

        console.log(req.body);

        try {
            let { nome, email, telefone, info_ad_1, info_ad_2, info_ad_3 } = req.body
            let db = abrirBranco()

            db.run(`INSERT INTO remetente(nome, email, telefone, info_ad_1, info_ad_2, info_ad_3)
                VALUES (?, ?, ?, ?, ?, ?); `,
                [nome, email, telefone, info_ad_1, info_ad_2, info_ad_3],
                err => {
                    if (err) {
                        console.log("Insercao em remetente com erro", err.message);
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Insercao em remetente com sucesso");
                        res.status(201).json({ message: 'User added successfully' });
                    }
                });
            fecharBanco(db);

        } catch (err) { res.status(400).json({ error: err.message }); }
    });
}

function getClieste() {
    app.get('/search/remetente', (req, res) => {

        console.log(req.body);

        try {
            let db = abrirBranco()

            db.all(`SELECT * FROM remetente`,
                [], (err, rows) => {
                    if (err) {
                        console.log("Erro consulta tabela remetente", err.message);
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Sucesso consulta tabela remetente");
                        res.json(rows);
                    }
                });
            fecharBanco(db);
        } catch (err) { res.status(400).json({ error: err.message }); }
    });
}


function postTag() {
    app.post('/insert/tag', (req, res) => {

        console.log(req.body)

        try {
            let { nome, referencia, retorno } = req.body
            let db = abrirBranco()

            db.run(`INSERT INTO tag(nome, referencia, retorno)
            VALUES(?, ?, ?);`,
                [nome, referencia, retorno],
                err => {
                    if (err) {
                        console.log("Insercao em tag com erro")
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Insercao em tag com sucesso")
                        res.status(201).json({ message: 'Tag added successfully' })
                    }
                })
            fecharBanco(db)
        }
        catch (err) { res.status(400).json({ error: err.message }) }

    });
}

function getTag() {  
    try{
    app.get('/search/tag', (req, res) => {
        let db = abrirBranco()

        db.all(`SELECT * FROM tag`,
            [],
            (err, rows) => {
                if (err) {
                    console.log("Erro consulta tabela tag", err.message);
                    res.status(400).json({ error: err.message })
                } else {
                    console.log("Sucesso consulta tabela tag");
                    res.json(rows);
                }
            });
        fecharBanco(db);
    });
    }catch (err) {res.status(400).json({error: err.message})}
}

function postModeloEmail(){
    try{
    app.post('/insert/modeloEmail', (req, res) =>{
        let db = abrirBranco()

        let {nome, titulo, corpo, assinatura, imagem_url} = req.body

        db.run(`INSERT INTO modeloEmail(nome, titulo, corpo, assinatura, imagem_url)
                    VALUES(?,?,?,?,?)`,
                    [nome, titulo, corpo, assinatura, imagem_url],
                    err => {
                        if(err){
                            console.log("Insercao do ModeloEmail com erro ", err)
                            res.status(400).json({error: err.message})
                        }else{
                            console.log("Insercao do ModeloEmail com sucesso")
                            res.status(201).json({message: "ModeloEmail added successufully"})
                        }
                    })
    });
    }catch (err){res.status(400).json({error: err.message})}

}

function getModeloEmail(){
    try{
    app.get('/search/modeloEmail', (req, res) =>{
        let db = abrirBranco()

        db.all(`SELECT * FROM modeloEmail`,
                    [],
                    (err, rows) => {
                        if(err){
                            console.log("Consulta do ModeloEmail com erro ", err)
                            res.status(400).json({error: err.message})
                        }else{
                            console.log("Consulta do ModeloEmail com sucesso")
                            res.status(201).json({rows})
                        }
                    })
    });
    }catch (err){res.status(400).json({error: err.message})}

}
// daqui
function postModeloEmail_tag(){
    try{
    app.post('/insert/ModeloEmail_tag', (req, res) =>{
        let db = abrirBranco()

        let {id_modeloEmail, nome_tag} = req.body

        db.run(`INSERT INTO modeloEmail_tag(id_modeloEmail, nome_tag)
                    VALUES(?,?)`,
                    [id_modeloEmail, nome_tag],
                    err => {
                        if(err){
                            console.log("Insercao do ModeloEmail_tag com erro ", err)
                            res.status(400).json({error: err.message})
                        }else{
                            console.log("Insercao do ModeloEmail_tag com sucesso")
                            res.status(201).json({message: "ModeloEmail_tag added successufully"})
                        }
                    })
    });
    }catch (err){res.status(400).json({error: err.message})}

}

function getModeloEmail_tag(){
    try{
    app.get('/search/modeloEmail_tag', (req, res) =>{
        let db = abrirBranco()

        db.all(`SELECT * FROM modeloEmail_tag`,
                    [],
                    (err, rows) => {
                        if(err){
                            console.log("Consulta do ModeloEmail_tag com erro ", err)
                            res.status(400).json({error: err.message})
                        }else{
                            console.log("Consulta do ModeloEmail_tag com sucesso")
                            res.status(201).json({rows})
                        }
                    })
    });
    }catch (err){res.status(400).json({error: err.message})}

}


/**
 * Esta é uma função para abrir o banco de dados.
 *
 * @returns {Object}- O objeto do banco de dados.
 */
function abrirBranco() {

    try {
        const sqlite3 = require('sqlite3').verbose()
        const db = new sqlite3.Database('banco.db', (err) => {
            if (err) {
                console.error('Erro ao criar ou abrir o banco de dados:', err.message);
            } else {
                console.log('Banco de dados aberto com sucesso.');
            }
        })
        return db
    }
    catch (err) { console.log("Erro ao abrir o banco:", err) }

}

/**
 * Esta é uma função que ira fechar o banco de dados.
 *
 * @param {Object} db - A instancia do banco de dados.
 * @returns {} - retorna uma mensagem de falha ou sucesso no terminar. 
 */
function fecharBanco(db) {

    try {
        db.close(err => {
            if (err) {
                console.log("Erro ao fechar banco de dados: ", err.message)
            } else { console.log("Bando de dados fechado com sucesso") }
        })
    }
    catch (err) { console.log("Erro o fechar o banco ", err) }

}

/**
 * Cria todo as tabelas do banco de dados.
 *
 * @param {Object} db - recebe a instancia do banco de dados.
 *  * @returns {string} - retorna uma mensagem de falha ou sucesso no terminar. 
 */
function criarBase(db) {
    try {
        db.run(`CREATE TABLE IF NOT EXISTS remetente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT,
      telefone TEXT,
      info_ad_1 TEXT,
      info_ad_2 TEXT,
      info_ad_3 TEXT
    )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'remetente'", err.message);
            } else {
                console.log("Tabela 'remetente' criada com sucesso");
            }
        });

        /* retirado por ser redundante
        db.run(`CREATE TABLE IF NOT EXISTS digitaveis (
          digitavel TEXT PRIMARY KEY,
          conteudo TEXT
        )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'digitaveis'", err.message);
            } else {
                console.log("Tabela 'digitaveis' criada com sucesso");
            }
        });
    
        
        db.run(`INSERT INTO digitaveis(digitavel, conteudo)
         VALUES ('cliente', 'string'); `, err => {
            if (err) {
                console.log("Digitavel cliente gerou erro", err.message);
            } else {
                console.log("Digitavel cliente incerida com sucesso");
            }
        }); */

        db.run(`CREATE TABLE IF NOT EXISTS tag (
      nome TEXT NOT NULL,
      referencia TEXT NOT NULL,
      retorno TEXT,
      PRIMARY KEY (nome, referencia)
    )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'tag'", err.message);
            } else {
                console.log("Tabela 'tag' criada com sucesso");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS modeloEmail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      titulo TEXT,
      corpo TEXT,
      assinatura TEXT,
      imagem_url TEXT
    )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'modeloEmail'", err.message);
            } else {
                console.log("Tabela 'modeloEmail' criada com sucesso");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS modeloEmail_tag (
      id_modeloEmail INTEGER,
      nome_tag TEXT,
      FOREIGN KEY(id_modeloEmail) REFERENCES modeloEmail(id),    
      FOREIGN KEY(nome_tag) REFERENCES tag(nome)
      PRIMARY KEY (id_modeloEmail, nome_tag)
    )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'modeloEmail_tag'", err.message);
            } else {
                console.log("Tabela 'modeloEmail_tag' criada com sucesso");
            }
        });
    } catch (err) { console.log("Erro ao criar as tabelas ", err) }

}
db = abrirBranco()
criarBase(db)
fecharBanco(db)


postRemetente();
getClieste();
getTag();
postTag();
postModeloEmail();
getModeloEmail();
postModeloEmail_tag();
getModeloEmail_tag();
postEnviarEmailPadrao();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

