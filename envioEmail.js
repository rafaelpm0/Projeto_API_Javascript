function enviarEmailPadrao(host, port, secure = false, user, pass, tls = false, from, to, subject,
    text, imagem, assinatura) {

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
        text: text + assinatura,
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
        <>${texto.replace(/\n/g, "<br>")}</>
        <img src=${imagem} alt="Exemplo de Imagem">
        <br>${assinatura}</>
    </body>
    </html>`

    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email enviado:", info.response);
        }
    })
}
