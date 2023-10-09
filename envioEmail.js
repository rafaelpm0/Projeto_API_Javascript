const { promises } = require('nodemailer/lib/xoauth2');

/**
 * Envia um e-mail padrão usando o Nodemailer.
 *
 * @param {string} host - O servidor SMTP para envio do e-mail.
 * @param {number} port - A porta do servidor SMTP.
 * @param {boolean} secure - Define se a conexão é segura (SSL/TLS).
 * @param {string} user - O nome de usuário para autenticação SMTP.
 * @param {string} pass - A senha para autenticação SMTP.
 * @param {boolean} tls - Define se o TLS deve ser ativado (apenas se `secure` for falso).
 * @param {string} from - O endereço de e-mail remetente.
 * @param {string} to - O endereço de e-mail destinatário.
 * @param {string} subject - O assunto do e-mail.
 * @param {string} text - O corpo do e-mail em formato de texto.
 * @param {string} imagem_url - A URL da imagem a ser incluída no corpo do e-mail.
 * @param {string} signature - A assinatura a ser incluída no corpo do e-mail.
 * @throws {Error} Lança um erro em caso de falha no envio do e-mail.
 */
function enviarEmailPadrao(host, port, secure = false, user, pass, tls = false, from, to, subject,
    text, imagem_url, signature) {
     
     text = text.replace(/\n/g, "<br>");
     signature = signature.replace(/\n/g, "<br>");     

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: user,
            pass: pass
        },
        tls: { rejectUnauthorized: tls }
    })

    const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: text + signature,
        html: `
     <!DOCTYPE html>
     <html lang="pt-br">
     <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
    </head>
    <body>
        <div>
        ${text}
        </div>
        <img src=${imagem_url} alt="Exemplo de Imagem">
        <br>
        <div>
        ${signature}
        </div>
        </>
    </body>
    </html>`

    }

    return new Promise((resolve, rejec)=>{

        transporter.sendMail(mailOptions, (error, info) =>{
            if (error) {
                console.log(error);
                rejec(error)
            } else {
                resolve(info.response)
            }
        })

    })

}
 module.exports.enviarEmailPadrao = enviarEmailPadrao;