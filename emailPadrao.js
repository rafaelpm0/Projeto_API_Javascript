const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const envioEmail = require('./envioEmail');


/**
 * Rota POST para envio de e-mail padrão.
 *
 * Esta rota permite o envio de um e-mail padrão com base nos parâmetros fornecidos no corpo da solicitação.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha no envio do e-mail.
 */
function postEnviarEmailPadrao() {
    app.post('/send/email', async (req, res) => {
        console.log(req.body)


        const { host, port, secure = false, user, pass, tls = false, from, remetente, modeloEmail, tags } = req.body
        let to, titulo, corpo, assinatura, imagem_url, retornoTag, tagsObrigatorias;

        const db = await abrirBranco();

        try {
            to = await consultaDb(db, undefined, "remetente", `id = ${remetente}`)
                .then(resolve => {
                    return resolve[0]
                })
                .catch(reject => {
                    throw new Error(reject)
                })
            console.log(to)

        } catch (err) {
            console.log("Remetente nao cadastrado: ", err)
            res.status(404).json({ NotFound: "Remetente nao cadastrado: ", err });
            await fecharBanco(db);
            return
        }

        try {
            ({ titulo, corpo, assinatura, imagem_url } = await consultaDb(db, "titulo, corpo, assinatura, imagem_url", "modeloEmail", `id = ${modeloEmail}`)
                .then(resolve => {
                    return resolve[0]
                })
                .catch(reject => {
                    throw new Error(reject)
                }))

        } catch (err) {

            console.log("ModeloEmail nao cadastrado ", err);
            res.status(404).json({ NotFound: "ModeloEmail nao cadastrado", err });
            await fecharBanco(db);
            return;
        }

        tagsObrigatorias = await consultaDb(db, "nome_tag", "modeloEmail_tag", `id_modeloEmail = ${modeloEmail}`)
            .then(resolve => {
                return resolve.map(obj => obj.nome_tag)
            })
            .catch(reject => {
                throw new Error(reject)
            })

        console.log(tagsObrigatorias, " - ", tags)

        let testeChaves = tagsObrigatorias.every(chave => chave in tags)

        if (!testeChaves) { // teste para verificar se todas as tags obrigatorias foram preenchidas
            console.log("Tags obrigatorias nao informadas ", tagsObrigatorias);
            res.status(404).json({ Error: "Tags obrigatorias nao informadas: ", tagsObrigatorias });
            await fecharBanco(db);
            return;
        } else {

            for (let remet in to) {  // expressao regex para trocar as tag de remetente no corpo e titulo do e-mail
                let regex = new RegExp("{remetente." + remet + "}", "g")
                corpo = corpo.replace(regex, to[remet])
                titulo = titulo.replace(regex, to[remet])
            }

            for (let tag in tags) {
                try {
                    console.log(tag, tags)
                    retornoTag = await consultaDb(db, "retorno", "tag", `nome = "${tag}" AND referencia = "${tags[tag]}"`).then(resolve => {
                        console.log(resolve)
                        return resolve[0]
                    })
                        .catch(err => {
                            throw new Error(err)
                        })
                        
                    console.log(retornoTag)    
                    let regex = new RegExp("{" + tag + "}", "g") // expressoa regex para trocar as tag no corpo e titulo do e-mail
                    corpo = corpo.replace(regex, retornoTag.retorno)
                    titulo = titulo.replace(regex, retornoTag.retorno)
                } catch (err) {
                    console.log("Conteudo da tag solicitada não cadastrada: ", tag)
                    res.status(404).json({ NotFound: "Conteudo da tag solicitada não cadastrada: ", tag})
                    await fecharBanco(db);
                    return;
                }
            }

            await fecharBanco(db);
            
            
            await envioEmail.enviarEmailPadrao(host, port, secure, user, pass, tls, from, to.email, titulo,
                corpo, imagem_url, assinatura)
                .then(resolve =>{
                    console.log("Email enviado com sucesso"); 
                    res.status(201).json({ message: 'Email enviado com sucesso send successfuly' });
                })
                .catch(reject=>{
                    console.log("Email rejeitado");
                    res.status(404).json({ Error: 'Email rejeitado: ', reject});
                })

        }

    }
    );
}

// modularizando funcao postEnviarEmailPadrao

/**
 * Consulta dados no banco de dados com base em uma condição.
 *
 * @param {Object} db - O objeto de conexão com o banco de dados SQLite.
 * @param {string} [coluns="*"] - As colunas a serem selecionadas na consulta SQL (padrão: todas as colunas).
 * @param {string} table - O nome da tabela na qual a consulta será realizada.
 * @param {string} [condition=""] - A condição de pesquisa da consulta SQL (opcional).
 * @returns {Promise} - Uma Promise que resolve com os resultados da consulta.
 */
function consultaDb(db, coluns = "*", table, condition) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT ${coluns} FROM ${table} WHERE ${condition}`, // selecte email do remetente
            [],
            (err, rows) => {
                if ((err) || (rows.length === 0)) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            });
    }
    )
}
// Inicio das requisoes GET e POST

/**
 * Rota POST para inserção de um novo remetente no banco de dados.
 *
 * Esta rota permite a inserção de um novo remetente no banco de dados com base nos dados fornecidos no corpo da solicitação.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na inserção do remetente.
 */
function postRemetente() {
    app.post('/insert/remetente', async (req, res) => {

        console.log(req.body);

        try {
            let { nome, email, telefone, info_ad_1, info_ad_2, info_ad_3 } = req.body
            let db = await abrirBranco()

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
            await fecharBanco(db);

        } catch (err) { res.status(400).json({ error: err.message }); }
    });
}

/**
 * Rota GET para pesquisa de remetentes no banco de dados.
 *
 * Esta rota permite a pesquisa de remetentes no banco de dados e retorna a lista de remetentes encontrados.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na consulta dos remetentes.
 */
function getClieste() {
    app.get('/search/remetente', async (req, res) => {

        console.log(req.body);

        try {
            let db = await abrirBranco()

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
            await fecharBanco(db);
        } catch (err) { res.status(400).json({ error: err.message }); }
    });
}


function postTag() {
    app.post('/insert/tag', async (req, res) => {

        console.log(req.body)

        try {
            let { nome, referencia, retorno } = req.body
            let db = await abrirBranco()

            nome = nome.toLowerCase()

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
            await fecharBanco(db)
        }
        catch (err) { res.status(400).json({ error: err.message }) }

    });
}

/**
 * Rota POST para inserção de uma nova tag no banco de dados.
 *
 * Esta rota permite a inserção de uma nova tag no banco de dados com base nos dados fornecidos no corpo da solicitação.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na inserção da tag.
 */
function getTag() {
    try {
        app.get('/search/tag', async (req, res) => {
            let db = await abrirBranco()

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
            await fecharBanco(db);
        });
    } catch (err) { res.status(400).json({ error: err.message }) }
}

/**
 * Rota POST para inserção de um novo modelo de e-mail no banco de dados.
 *
 * Esta rota permite a inserção de um novo modelo de e-mail no banco de dados com base nos dados fornecidos no corpo da solicitação.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na inserção do modelo de e-mail.
 */
function postModeloEmail() {
    try {
        app.post('/insert/modeloEmail', async (req, res) => {
            let db = await abrirBranco()

            const { nome, titulo, corpo, assinatura, imagem_url } = req.body

            db.run(`INSERT INTO modeloEmail(nome, titulo, corpo, assinatura, imagem_url)
                    VALUES(?,?,?,?,?)`,
                [nome, titulo, corpo, assinatura, imagem_url],
                err => {
                    if (err) {
                        console.log("Insercao do ModeloEmail com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Insercao do ModeloEmail com sucesso")
                        res.status(201).json({ message: "ModeloEmail added successufully" })
                    }
                })
            await fecharBanco(db)
        });

    } catch (err) { res.status(400).json({ error: err.message }) }

}

/**
 * Rota GET para pesquisa de modelos de e-mail no banco de dados.
 *
 * Esta rota permite a pesquisa de modelos de e-mail no banco de dados e retorna a lista de modelos encontrados.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na consulta dos modelos de e-mail.
 */
function getModeloEmail() {
    try {
        app.get('/search/modeloEmail', async (req, res) => {
            let db = await abrirBranco()

            db.all(`SELECT * FROM modeloEmail`,
                [],
                (err, rows) => {
                    if (err) {
                        console.log("Consulta do ModeloEmail com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Consulta do ModeloEmail com sucesso")
                        res.status(201).json({ rows })
                    }
                })
            await fecharBanco(db)
        });
    } catch (err) { res.status(400).json({ error: err.message }) }

}

/**
 * Rota POST para associar uma tag a um modelo de e-mail no banco de dados.
 *
 * Esta rota permite a associação de uma tag a um modelo de e-mail no banco de dados com base nos dados fornecidos no corpo da solicitação.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na associação da tag ao modelo de e-mail.
 */
function postModeloEmail_tag() {
    try {
        app.post('/insert/ModeloEmail_tag', async (req, res) => {
            let db = await abrirBranco()

            let { id_modeloEmail, nome_tag } = req.body

            db.run(`INSERT INTO modeloEmail_tag(id_modeloEmail, nome_tag)
                    VALUES(?,?)`,
                [id_modeloEmail, nome_tag],
                err => {
                    if (err) {
                        console.log("Insercao do ModeloEmail_tag com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Insercao do ModeloEmail_tag com sucesso")
                        res.status(201).json({ message: "ModeloEmail_tag added successufully" })
                    }
                })
            await fecharBanco(db)
        });
    } catch (err) { res.status(400).json({ error: err.message }) }
}

/**
 * Rota GET para pesquisa de associações de tags a modelos de e-mail no banco de dados.
 *
 * Esta rota permite a pesquisa de associações de tags a modelos de e-mail no banco de dados e retorna a lista de associações encontradas.
 *
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na consulta das associações de tags a modelos de e-mail.
 */
function getModeloEmail_tag() {
    try {
        app.get('/search/modeloEmail_tag', async (req, res) => {
            let db = await abrirBranco()

            db.all(`SELECT * FROM modeloEmail_tag`,
                [],
                (err, rows) => {
                    if (err) {
                        console.log("Consulta do ModeloEmail_tag com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Consulta do ModeloEmail_tag com sucesso")
                        res.status(201).json({ rows })
                    }
                })
            await fecharBanco(db)
        });
    } catch (err) { res.status(400).json({ error: err.message }) }
}

/**
 * Rota POST para criação de um banco de dados e suas tabelas.
 *
 * Esta rota permite a criação de um banco de dados SQLite e das tabelas necessárias para o funcionamento da aplicação.
 * @param {Object} req - O objeto de requisição Express.
 * @param {Object} res - O objeto de resposta Express.
 * @throws {Error} - Lança um erro em caso de falha na criação do banco de dados ou das tabelas.
 */
function postCriarBanco() {
    try {
        app.post('/create/banco', async (req, res) => {
            let db = await abrirBranco()
            await criarBase(db);
            await fecharBanco(db)
            res.status(201).json({ message: "Banco de dados criado com sucesso" })
        });
    } catch (err) {
        res.status(400).json({ error: "Erro na criacao do banco de dados: ", err })
    }
}


/**
 * Função para abrir o banco de dados SQLite.
 *
 * Esta função cria ou abre o banco de dados SQLite chamado 'banco.db'.
 *
 * @returns {Promise<Object>} - Uma Promise que resolve com o objeto de banco de dados SQLite.
 * @throws {Error} - Lança um erro em caso de falha na criação ou abertura do banco de dados.
 */
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
        }).then(res => {
            return res
        }).catch(err => {
            throw new Error(err)
        })

    }
    catch (err) { console.log("Erro ao abrir o banco:", err) }
}

/**
 * Função para fechar o banco de dados SQLite.
 *
 * Esta função fecha a conexão com o banco de dados SQLite.
 *
 * @param {Object} db - A instância do banco de dados SQLite a ser fechada.
 * @returns {Promise<void>} - Uma Promise que resolve quando o banco de dados é fechado com sucesso.
 * @throws {Error} - Lança um erro em caso de falha no fechamento do banco de dados
 */
function fecharBanco(db) {

    try {
        return new Promise((resolve, reject) => {
            db.close(err => {
                if (err) {
                    console.log("Erro ao fechar banco de dados: ", err.message)
                    reject("Erro ao fechar banco de dados: ", err.message)
                } else {
                    console.log("Bando de dados fechado com sucesso")
                    resolve("Bando de dados fechado com sucesso")
                }
            })
        })

    }
    catch (err) { console.log("Erro o fechar o banco ", err) }
}

/**
 * Cria todas as tabelas do banco de dados.
 *
 * @param {Object} db - A instância do banco de dados SQLite onde as tabelas serão criadas.
 * @returns {string} - Retorna uma mensagem de falha ou sucesso na criação das tabelas.
 */
function criarBase(db) {
    return new Promise((resolve, reject) => {
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
                reject(err);
            } else {
                console.log("Tabela 'remetente' criada com sucesso");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS tag (
                nome TEXT NOT NULL,
                referencia TEXT NOT NULL,
                retorno TEXT,
                PRIMARY KEY (nome, referencia)
              )`, err => {
            if (err) {
                console.log("Falha na criação da tabela 'tag'", err.message);
                reject(err)
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
                reject(err)
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
                reject(err)
            } else {
                console.log("Tabela 'modeloEmail_tag' criada com sucesso");
                resolve();
            }
        });

    }).then(resolve => {
        return
    })
        .catch(err => {
            throw new Error(err)
        })
}

postCriarBanco();
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

