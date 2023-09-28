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

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            throw new Error("Erro no envio do email: ", error)
        } else {
            console.log("Email enviado:", info.response);
        }
    })
}
 module.exports.enviarEmailPadrao = enviarEmailPadrao;