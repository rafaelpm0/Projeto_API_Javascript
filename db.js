const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

  // melhorar, colocar um try cacth em abrir e fehcar banco

app.post('/insert/clientes', (req, res) => { 
    
    console.log(req.body);
    
    try {
        let { nome, email, telefone, info_ad_1, info_ad_2, info_ad_3 } = req.body
        let db = abrirBranco()

        db.run(`INSERT INTO clientes(nome, email, telefone, info_ad_1, info_ad_2, info_ad_3)
                VALUES (?, ?, ?, ?, ?, ?); `,
                [nome, email, telefone, info_ad_1, info_ad_2, info_ad_3],
            err => {
                if (err) {
                    console.log("Insercao em clientes com erro", err.message);
                    res.status(400).json({ error: err.message })
                } else {
                    console.log("Insercao em clientes com sucesso");
                    res.status(201).json({ message: 'User added successfully' });
                }
            });
        fecharBanco(db);        

    } catch (err) {res.status(400).json({ error: err.message });}
});

app.get('/search/clientes', (req, res) => {
    
    console.log(req.body);
    
    try {
        let db = abrirBranco()

        db.all(`SELECT * FROM clientes`,
                [],(err, rows) => {
                if (err) {
                    console.log("Erro consulta tabela clientes", err.message);
                    res.status(400).json({ error: err.message })
                } else {
                    console.log("Sucesso consulta tabela clientes");
                    res.json(rows);
                }
            });
        fecharBanco(db);        

    } catch (err) {res.status(400).json({ error: err.message });}
});


app.post('/insert/tag', (req, res) => {

    console.log(req.body)

    try{
    let {nome, referencia, retorno} = req.body
    let db = abrirBranco()    

    db.run(`INSERT INTO tag(nome, referencia, retorno)
            VALUES(?, ?, ?);`,
            [nome, referencia, retorno],
            err => {
                if (err){
                    console.log("Insercao em tag com erro")
                    res.status(400).json({error: err.message})
                }else{
                    console.log("Insercao em tag com sucesso")
                    res.status(201).json({message: 'Tag added successfully'})
                }
            })
    fecharBanco(db)
    }
    catch (err) {res.status(400).json({error : err.message})}

});

app.get('/search/tag', (req, res) =>{
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
    })


/**
 * Esta é uma função para abrir o banco de dados.
 *
 * @returns {Object}- O objeto do banco de dados.
 */
function abrirBranco() {
    const sqlite3 = require('sqlite3').verbose()
    const db = new sqlite3.Database('banco.db', (err) => {
        if (err) {
            console.error('Erro ao criar ou abrir o banco de dados:', err.message);
        } else {
            console.log('Banco de dados aberto com sucesso.');
        }
    })
    return db
};

/**
 * Esta é uma função que ira fechar o banco de dados.
 *
 * @param {Object} db - A instancia do banco de dados.
 * @returns {} - retorna uma mensagem de falha ou sucesso no terminar. 
 */
function fecharBanco(db) {        
    db.close(err => {
        if (err) {
            console.log("Erro ao fechar banco de dados: ", err.message)
        } else { console.log("Bando de dados fechado com sucesso") }
    })

};



/**
 * Cria todo as tabelas do banco de dados.
 *
 * @param {Object} db - recebe a instancia do banco de dados.
 *  * @returns {string} - retorna uma mensagem de falha ou sucesso no terminar. 
 */

function criarBase(db) {
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT,
      telefone TEXT,
      info_ad_1 TEXT,
      info_ad_2 TEXT,
      info_ad_3 TEXT
    )`, err => {
        if (err) {
            console.log("Falha na criação da tabela 'clientes'", err.message);
        } else {
            console.log("Tabela 'clientes' criada com sucesso");
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      referencia TEXT,
      retorno TEXT
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
      id_tag INTEGER,
      FOREIGN KEY(id_modeloEmail) REFERENCES modeloEmail(id),    
      FOREIGN KEY(id_tag) REFERENCES tag(id)
    )`, err => {
        if (err) {
            console.log("Falha na criação da tabela 'modeloEmail_tag'", err.message);
        } else {
            console.log("Tabela 'modeloEmail_tag' criada com sucesso");
        }
    });
};

db = abrirBranco()
criarBase(db)
fecharBanco(db)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });  

