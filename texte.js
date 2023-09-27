const a = [
    {
      titulo: 'TESTE',
      corpo: 'Bom dia, \n\nEmail para teste do API.',
      assinatura: '\nRafael Pinho Medeiros',
      imagem_url: 'https://portais.univasf.edu.br/ccicomp/home/@@collective.cover.banner/bf130974-29b9-4bdc-88d4-e7792d92d4c7/@@images/b12027ff-4965-442b-a199-9429582da88e.jpeg'
    }
  ]

  let  titulo, corpo, assinatura, imagem_url;
  ({ titulo, corpo, assinatura, imagem_url } = a[0]);



  console.log(titulo)

