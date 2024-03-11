Projeto de Envio de E-mails com Tags

Descrição:
Este é um projeto que permite o envio de e-mails personalizados com base em modelos predefinidos e tags associadas aos remetentes ou tag adicionais. 
Ele utiliza Node.js, Express.js e SQLite para gerenciar remetentes, modelos de e-mail e tags, e o Nodemailer para enviar os e-mails.

Configuração:

Requisitos:
- Node.js
- SQLite
- Nodemailer

Instalação:
1. Clone este repositório:
   git clone https://github.com/rafaelpm0/Projeto_API_Javascript
   cd seu-projeto

2. Instale as dependências:
   npm install

3. Crie o banco de dados SQLite:
   npm run create-database


Descrição pratica:

1. Inserção de Remetente: Você adicionará um remetente com informações como nome, e-mail, telefone e campos adicionais ao sistema.

2. Inserção de Tag: Uma tag será adicionada, que pode ser usada para personalizar os e-mails. Todas as tags serão salvas em lowerCase

3. Inserção de Modelo de E-mail: Você criará um modelo de e-mail que contém tags no corpo, utilizando a notação {} para indicar onde 
as tags devem ser inseridas (por exemplo, "{exemplo}" ou "{remetente.email}"). Além disso, lembre-se de que a quebra de linha deve ser 
feita usando \n para formatar o conteúdo do e-mail, permitindo a personalização de mensagens.

4. Associação de Tag a Modelo de E-mail: Você vinculará tags específicas ao modelo de e-mail para usá-las posteriormente.

5. Envio de E-mail com Tags: Você enviará um e-mail personalizado com base no modelo e nas tags associadas, com a capacidade de 
utilizar qualquer campo do remetente (por exemplo, remetente.nome, remetente.email, remetente.telefone) e preencher dinamicamente as 
tags no corpo do e-mail usando a notação {}. Certifique-se de manter a quebra de linha adequada com \n no modelo de e-mail para formatar corretamente o conteúdo.


Uso:

Inserção de Remetente:
- Para inserir um novo remetente, faça uma solicitação POST para `/insert/remetente` com os seguintes dados no corpo da solicitação em formato JSON:

   {
     "nome": "Exemplo Remetente",
     "email": "exemplo@remetente.com",
     "telefone": "(00) 12345-6789",
     "info_ad_1": "Informação Adicional 1",
     "info_ad_2": "Informação Adicional 2",
     "info_ad_3": "Informação Adicional 3"
   }


Pesquisa de Remetente:
- Para pesquisar remetentes, faça uma solicitação GET para `/search/remetente`.

Inserção de Tag:
- Para inserir uma nova tag, faça uma solicitação POST para `/insert/tag` com os seguintes dados no corpo da solicitação em formato JSON:
- Para alterar um valor de retorno, faça uma solicitação PATCH, mantendo 'nome' e 'referencia';
{
  "nome": "exemplo",
  "referencia": "01",
  "retorno": "Valor de Exemplo"
}


Pesquisa de Tag:
- Para pesquisar tags, faça uma solicitação GET para `/search/tag` / `/search/tag/nomeDaTag`.
- Caso informado o '/nomedaTag', ira resultar em todas as tags de um modelo de e-mail específico. Caso omita, ira trazer todas as tags e seus conteudo.

Inserção de Modelo de E-mail:
- Para inserir um novo modelo de e-mail, faça uma solicitação POST para `/insert/modeloEmail` com os seguintes dados no corpo da solicitação em formato JSON:

{
  "nome": "Modelo de Email com Tags",
  "titulo": "Email de Exemplo com Tags",
  "corpo": "Bom dia, \n\nEste é um email de exemplo com tags:\nTag exemplo: {exemplo}\nTag remetente: {remetente.email}\n\n",
  "assinatura": "Atenciosamente, Seu Nome",
  "imagem_url": "https://sua-url-de-imagem.com/imagem.jpg"
}


Pesquisa de Modelo de E-mail:
- Para pesquisar modelos de e-mail, faça uma solicitação GET para `/search/modeloEmail`.

Associação de Tag a Modelo de E-mail:
- Para associar uma tag a um modelo de e-mail, faça uma solicitação POST para `/insert/modeloEmail_tag` com os seguintes dados no corpo da solicitação em formato JSON:

{
  "id_modeloEmail": 1, // Substitua pelo ID do modelo de e-mail criado anteriormente
  "nome_tag": "exemplo" // Substitua pelo nome da tag criada anteriormente
}

Pesquisa de Associação de Tag a Modelo de E-mail:
- Para pesquisar associações de tags a modelos de e-mail, faça uma solicitação GET para `/search/modeloEmail_tag/` /`/search/modeloEmail_tag/id`.
- Caso informado o '/id', ira resultar em todas as tags de um modelo de e-mail específico. Caso omita, ira trazer todas as tags e seus conteudo.

Envio de E-mail Padrão:
- Para enviar um e-mail personalizado com base em um modelo e tags, faça uma solicitação POST para `/send/emailPadrao` com os seguintes dados no corpo da solicitação em formato JSON:

{
  "host": "smtp.gmail.com",
  "port": 587,
  "user": "seu-email@gmail.com",    
  "pass": "sua-senha",
  "from": "seu-email@gmail.com",
  "tags": {"exemplo": "Valor Personalizado", "remetente.email": "exemplo@remetente.com"},
  "remetente": 1, // Substitua pelo ID do remetente criado anteriormente
  "modeloEmail":  1 // Substitua pelo ID do modelo de e-mail criado anteriormente
}



Contribuição:

Instruções:
1. Fork o projeto
2. Crie uma branch para a sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

Licença:

Descrição:
Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para obter detalhes.
