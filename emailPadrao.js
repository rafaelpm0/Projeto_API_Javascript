const express = require('express');
const app = express();
const cors = require('cors')
const port = process.env.PORT || 3003;
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    app.use(cors());
    next();
})

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
    app.post('/send/emailPadrao', async (req, res) => {
        console.log(req.body)


        const { host, port, secure = false, user, pass, tls = false, from, remetente, modeloEmail, tags } = req.body
        let to, titulo, corpo, assinatura, imagem_url, retornoTag, tagsObrigatorias;

        const db = await abrirBanco();

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
                res.status(404).json({ NotFound: "ModeloEmail tags não cadastradas", reject });
                fecharBanco(db);
                return;
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
                    res.status(404).json({ NotFound: "Conteudo da tag solicitada não cadastrada: ", tag })
                    await fecharBanco(db);
                    return;
                }
            }

            await fecharBanco(db);


            await envioEmail.enviarEmailPadrao(host, port, secure, user, pass, tls, from, to.email, titulo,
                corpo, imagem_url, assinatura)
                .then(resolve => {
                    console.log("Email enviado com sucesso");
                    res.status(201).json({ message: 'Email enviado com sucesso.' });
                })
                .catch(reject => {
                    console.log("Email rejeitado");
                    res.status(404).json({ Error: 'Email rejeitado: ', reject });
                })

        }

    }
    );
}
/**
 * Envia um e-mail manualmente com base nos parâmetros fornecidos.
 *
 * @param {Object} app - O objeto de aplicação Express.
 * @param {Object} envioEmail - O módulo de envio de e-mail.
 */
function postEmailManual() {
    app.post('/send/manual', async (req, res) => {

        /**
 * Parâmetros da solicitação.
 *
 * @typedef {Object} RequestBody
 * @property {string} host - O endereço do servidor de e-mail.
 * @property {number} port - A porta do servidor de e-mail.
 * @property {boolean} [secure=false] - Indica se deve usar uma conexão segura.
 * @property {string} user - O nome de usuário para autenticação no servidor de e-mail.
 * @property {string} pass - A senha para autenticação no servidor de e-mail.
 * @property {boolean} [tls=false] - Indica se deve usar o protocolo TLS.
 * @property {string} from - O endereço de e-mail remetente.
 * @property {string} to - O nome do remetente.
 * @property {string} title - O assunto do e-mail.
 * @property {string} body - O corpo do e-mail.
 * @property {string} [url=''] - URL opcional a ser incluída no corpo do e-mail.
 * @property {string} signature - A assinatura a ser incluída no e-mail.
 */

        const { host, port, secure = false, user, pass, tls = false, from, to, title, body, url = '', signature = '' } = req.body;
        let valoresObrigatorios = { host, port, user, pass, from, to, title, body, signature };


        if (!Object.values(valoresObrigatorios).some(value => typeof value === 'undefined')) {
            try {
                await envioEmail.enviarEmailPadrao(host, port, secure, user, pass, tls, from, to, title, body, url, signature);
                res.status(201).json({ message: "Email enviado com sucesso." })
            } catch (err) {
                res.status(401).json({ error: "Erro ao enviar e-mail: ", err })
            }
        } else {
            let error = ['Falta as tags: ', Object.keys(valoresObrigatorios).filter(key => typeof valoresObrigatorios[key] === 'undefined').join(', ')]
            res.status(404).json({ error });

        }

    }
    )
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

        try {
            let { nome, email, telefone, info_ad_1, info_ad_2, info_ad_3 } = req.body
            let db = await abrirBanco()

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
function getRemetente() {
    app.get('/search/remetente', async (req, res) => {

        try {
            let db = await abrirBanco()

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

        try {
            let { nome, retorno } = req.body;
            let db = await abrirBanco();


            db.run(`INSERT INTO tag(nome, retorno)
            VALUES(?, ?);`,
                [nome, retorno],
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

function pactchTag() {
    app.patch('/update/tag', async (req, res) => {

        try {
            let { referencia, retorno } = req.body
            let db = await abrirBanco()
            db.run(`UPDATE tag SET retorno = ? where referencia = ?`,
                [retorno, referencia],
                err => {
                    if (err) {
                        console.log("Update da tag com erro")
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Update datag com sucesso")
                        res.status(201).json({ message: 'Tag updated successfully' })
                    }
                })
            await fecharBanco(db)
        }
        catch (err) { res.status(400).json({ error: err.message }) }

    });
}

function pactchRemetente() {
    app.patch('/update/remetente', async (req, res) => {
        // Extrai as informações do corpo da requisição
        const { nome, email, telefone, info_ad_1, info_ad_2, info_ad_3, id } = req.body;

        try {
            // Abre uma conexão com o banco de dados
            let db = await abrirBanco();

            // Executa a query SQL para atualizar o remetente
            db.run(`UPDATE remetente SET nome=?, email=?, telefone=?, info_ad_1=?, info_ad_2=?, info_ad_3=? WHERE id=? `,
                [nome, email, telefone, info_ad_1, info_ad_2, info_ad_3, id],
                err => {
                    if (err) {
                        console.error("Erro ao atualizar Remetente:", err.message);
                        res.status(400).json({ error: "Erro ao atualizar Remetente" });
                    } else {
                        console.log("Remetente atualizado com sucesso");
                        res.status(201).json({ message: "Remetente atualizado com sucesso" });
                    }
                });

            // Fecha a conexão com o banco de dados
            await fecharBanco(db);
        }
        catch (err) {
            console.error("Erro ao atualizar Remetente:", err.message);
            res.status(400).json({ error: "Erro ao atualizar Remetente" });
        }
    });
}

function patchModeloEamil() {
    app.patch('/update/modeloEmail', async (req, res) => {

        try {
            let { id, nome, titulo, corpo, assinatura, imagem_url } = req.body
            let db = await abrirBanco()
            db.run(`UPDATE modeloEmail SET nome=?, titulo=?, corpo=?, assinatura=?, imagem_url=? where id = ?`,
                [nome, titulo, corpo, assinatura, imagem_url, id],
                err => {
                    if (err) {
                        console.log("Update da tag com erro")
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Update datag com sucesso")
                        res.status(201).json({ message: 'Tag updated successfully' })
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
            let db = await abrirBanco()

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

function getTagbyName() {
    try {
        app.get(`/search/tag/:tagName`, async (req, res) => {
            const tagName = req.params.tagName;
            let db = await abrirBanco();

            db.all(`SELECT * FROM tag WHERE NOME = ?`,
                [tagName],
                (err, rows) => {
                    if (err) {
                        console.log(`Erro ao consultar a tabela tag`, err.message);
                        res.status(400).json({ error: err.message });
                    } else {
                        console.log(`Sucesso ao consultar a tabela tags`);
                        res.json(rows);
                    }
                });

            await fecharBanco(db);
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}


function getTagEmpty() {
    try {
        app.get("/search/tagEmpty", async (req, res) => {
            let db = await abrirBanco();
            
            db.all(`SELECT * FROM tag WHERE RETORNO IS NULL`,[],
                (err, rows) => {
                    if (err) {
                        console.log(`Erro ao consultar a tabela tag`, err.message);
                        res.status(400).json({ error: err.message });
                    } else {
                        console.log(`Sucesso ao consultar a tabela tag`);
                        console.log(rows)
                        res.json(rows);
                    }
                });

            await fecharBanco(db);
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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
            let db = await abrirBanco()

            const { nome, titulo, corpo, assinatura, imagem_url } = req.body

            db.run(`INSERT INTO modeloEmail(nome, titulo, corpo, assinatura, imagem_url)
                    VALUES(?,?,?,?,?)`,
                [nome, titulo, corpo, assinatura, imagem_url],
                function(err){
                    if (err) {
                        console.log("Insercao do ModeloEmail com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Insercao do ModeloEmail com sucesso")
                        console.log("LastID: "+ this.lastID);
                        res.status(201).json({message: "ModeloEmail added successufully", id: this.lastID})
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
            let db = await abrirBanco()

            db.all(`SELECT * FROM modeloEmail`,
                [],
                (err, rows) => {
                    if (err) {
                        console.log("Consulta do ModeloEmail com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Consulta do ModeloEmail com sucesso")
                        res.status(201).json(rows)
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
            let db = await abrirBanco()

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
            let db = await abrirBanco()

            db.all("SELECT * FROM modeloEmail_tag",
                [],
                (err, rows) => {
                    if (err) {
                        console.log("Consulta do ModeloEmail_tag com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Consulta do ModeloEmail_tag com sucesso")
                        res.status(201).json(rows)
                    }
                })
            await fecharBanco(db)
        });
    } catch (err) { res.status(400).json({ error: err.message }) }
}

function getModeloEmail_tag_id() {
    try {
        app.get('/search/modeloEmail_tag/:id', async (req, res) => {
            let db = await abrirBanco()
            const id = parseInt(req.params.id);
            let sql = '';

            if (isNaN(id)) {
                // Se nenhum ID foi fornecido, busca todos os registros na tabela
                sql = 'SELECT * FROM modeloEmail_tag';
            } else {
                // Se um ID foi fornecido, busca registros com o ID correspondente
                sql = `SELECT * FROM modeloEmail_tag WHERE id_modeloEmail=${id}`;
            }

            db.all(sql,
                [],
                (err, rows) => {
                    if (err) {
                        console.log("Consulta do ModeloEmail_tag com erro ", err)
                        res.status(400).json({ error: err.message })
                    } else {
                        console.log("Consulta do ModeloEmail_tag com sucesso")
                        res.status(201).json({rows})
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
            let db = await abrirBanco()
            await criarBase(db);
            await fecharBanco(db)
            res.status(201).json({ message: "Banco de dados criado com sucesso" })
        });
    } catch (err) {
        res.status(400).json({ error: "Erro na criacao do banco de dados: ", err })
    }
}


/**
 * Função deleteModeloEmail
 * 
 * Esta função é um endpoint do Express que lida com requisições DELETE para '/delete/modeloEmail'.
 * Ela tenta deletar um modelo de email específico do banco de dados.
 * 
 * @async
 * @function deleteModeloEmail
 * @param {Object} req - O objeto de solicitação do Express.
 * @param {Object} req.body - O corpo da solicitação.
 * @param {number} req.body.id_modeloEmail - O ID do modelo de email a ser deletado.
 * @param {Object} res - O objeto de resposta do Express.
 * @throws {Error} Se houver um erro ao tentar deletar o modelo de email, um erro será lançado e a resposta terá um status 400.
 * @returns {Object} Se bem sucedido, retorna um objeto JSON com uma mensagem de sucesso e a resposta terá um status 201.
 */
function deleteModeloEmail() {
    app.delete('/delete/modeloEmail', async (req, res) => {
        let db = await abrirBanco();

        let {id} = req.body;

        try {
            db.run(`DELETE FROM modeloEmail WHERE id=?`, [id]);

            res.status(201).json({ message: 'ID deletado com sucesso' });
            await fecharBanco(db);
        } catch (err) {
            res.status(400).json({ error: "Erro ao deletar ID: ", err });
            await fecharBanco(db);
        }

    })
}

function deleteRemetente() {
    app.delete('/delete/remetente', async (req, res) => {

        let db = await abrirBanco();

        let { id } = req.body;

        try {
            db.run(`DELETE FROM remetente WHERE id=?`, [id]);

            res.status(201).json({ message: 'ID deletado com sucesso' });
            await fecharBanco(db);
        } catch (err) {
            res.status(400).json({ error: "Erro ao deletar ID: ", err });
            await fecharBanco(db);
        }
    })
}

function deleteTag() {
    app.delete('/delete/tag', async (req, res) => {

        let db = await abrirBanco();

        let { referencia } = req.body;

        try {
            db.run(`DELETE FROM tag WHERE referencia=?`, [referencia]);

            res.status(201).json({ message: 'Valor deletado com sucesso' });
            await fecharBanco(db);
        } catch (err) {
            res.status(400).json({ error: "Erro ao deletar valor: ", err });
            await fecharBanco(db);
        }
    })
}

function deleteModeloEmail_tag() {
    app.delete('/delete/modeloEmail_tag', async (req, res) => {

        let db = await abrirBanco();

        let { id_modeloEmail, nome_tag } = req.body;

        try {

            // Desativar temporariamente as restrições de chave estrangeira
            db.serialize(() => {
                db.run('PRAGMA foreign_keys = OFF');

                // Excluir registros na tabela de destino
                db.run('DELETE FROM modeloEmail_tag WHERE id_modeloEmail = ? AND nome_tag = ?', [id_modeloEmail, nome_tag]);

                // Ativar restrições de chave estrangeira novamente
                db.run('PRAGMA foreign_keys = ON');
            })


            res.status(201).json({ message: 'Valor deletado com sucesso' });
            await fecharBanco(db);
        } catch (err) {
            res.status(400).json({ error: "Erro ao deletar valor: ", err });
            await fecharBanco(db);
        }

    })
}



/**
 * Função para abrir o banco de dados SQLite.
 *
 * Esta função cria ou abre o banco de dados SQLite chamado 'banco.db'.
 *
 * @returns {Promise<Object>} - Uma Promise que resolve com o objeto de banco de dados SQLite.
 * @throws {Error} - Lança um erro em caso de falha na criação ou abertura do banco de dados.
 */

const key = "y94w9uxe02gcmpcy"
const url ="sqlite3-production-43c4.up.railway.app"


function abrirBanco() {

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
                referencia INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                retorno TEXT
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_modeloEmail INTEGER,
            nome_tag TEXT
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


module.exports = {
    abrirBanco,
    criarBase,
    fecharBanco,
    postEnviarEmailPadrao
}


postCriarBanco();
deleteModeloEmail();
deleteRemetente();
deleteTag();
deleteModeloEmail_tag();
postRemetente();
getRemetente();
pactchRemetente();
getTag();
postTag();
postModeloEmail();
postEmailManual();
getModeloEmail();
postModeloEmail_tag();
getModeloEmail_tag();
postEnviarEmailPadrao();
getModeloEmail_tag_id();
getTagbyName();
getTagEmpty();
pactchTag();
patchModeloEamil();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

