const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt"); // biblioteca pra criptografar a senha
const saltRounds = 10; // regulador da função hash
const multer = require('multer');

const db = mysql.createPool({
    
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projetoEgresso'


    /* serve amazon
    host: 'localhost',
    user: 'root',
    password: 'Ppgcvufrrj@123',
    database: 'projetoEgressoteste'
    */

});


app.use(cors({
    origin: ["http://localhost:3006"],
    methods : ["GET" , "POST"],
    credentials : true
})); // express usar o cors (acho)

/* concertar ligação com o banco de dados da amazon
const db = mysql.createPool({
    
    host: '54.236.88.128:80',
    user: 'root',
    password: 'Ppgcvufrrj@123',
    database: 'projetoEgressoTeste'

});


app.use(cors({
    origin: ["http://54.236.88.128:80"],
    methods : ["GET" , "POST"],
    credentials : true
})); // express usar o cors (acho)
*/
app.use(cookieParser());

app.use(express.json()); // precisa disso pra ler um request feita pelo front end
app.use(bodyParser.urlencoded({extended : true})); // express usar o bodyParser (acho)

app.use(
    session({
      key: "userInfo",
      secret: "indiaGolf999#@", // parece ser uma senha para mexer no cookie, difícil para n ser descoberta por hakers
      resave: false,
      saveUninitialized: false,
      cookie: { // expira em 24 horas
        expires: 60 * 60 * 24,
      },
    })
  );


  const Storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, '../../img/postagemPhoto/')
    },
    filename(req, file, callback) {
      callback(null, file.originalname + Date.now() +'.'+(file.mimetype).slice(-3));
    },
  })
  
  const upload = multer({ 
      storage: Storage,
      
      limits:  2 * 1024 * 1024
 }) // configurando o midolware multer que vai fazer o upload de imagem

// -----*********** Tentar refatorar essa parte****** ---------
 const storagePhoto = multer.diskStorage({ // configuração do multer para guarda a foto de perfil // retaforar para ter apenas uma configuração e ser selecionado depedendo da função que chamou
    destination(req, file, callback) {
      callback(null, '../../img/profilePhoto/')
    },
    filename(req, file, callback) {
      callback(null, file.originalname + Date.now() +'.'+(file.mimetype).slice(-3));
    },
  })
  
  const uploadPhoto = multer({ // configuração do multer para guarda a foto de perfil  // retaforar para ter apenas uma configuração e ser selecionado depedendo da função que chamou
      storage: storagePhoto,
      
      limits:  2 * 1024 * 1024
 }) // configurando o midolware multer que vai fazer o upload de imagem

 const storageComment = multer.diskStorage({ // configuração do multer para guarda a foto de perfil // retaforar para ter apenas uma configuração e ser selecionado depedendo da função que chamou
    destination(req, file, callback) {
      callback(null, '../../img/commentPhoto/')
    },
    filename(req, file, callback) {
      callback(null, file.originalname + Date.now() +'.'+(file.mimetype).slice(-3));
    },
  })
  
  const uploadComment = multer({ // configuração do multer para guarda a foto de perfil  // retaforar para ter apenas uma configuração e ser selecionado depedendo da função que chamou
      storage: storageComment,
      
      limits:  2 * 1024 * 1024
 }) // configurando o midolware multer que vai fazer o upload de imagem
// -----*********** Ate essa parte aki     ****** ---------




//------------------------------------****Funções da Api****---------------------------------
// desculpa a falta de padrão nas query, estava aprendendo enquanto desenvolvia

app.post("/api/addPostagem",upload.single("picture"), (req, res) =>{
    
    
    const userId = req.body.userId;
    const titulo = req.body.titulo;
    const tema   = req.body.tema;
    const texto  = req.body.texto;
    const data   = new Date(); //gerando a data quando for executar a query 

    
    const addPost = "INSERT INTO post ( usuario_id, tema, titulo, texto, data, favorita) VALUES ( ?, ?, ?, ?, ?, 0);"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    const addPicturePost = "INSERT INTO `fotopost` (nomeImagePost, pathPost, tipoPost) VALUES ( ?, ?, ?);";
    const addConnectPictureAndPost = "INSERT INTO `fotorelacao` (`id_post`, `id_fotoPost`) VALUES ( ?, ?);";

    db.query( addPost, //const que ta a query
        [userId ,tema, titulo, texto, data], //parâmetros recebido do frontEnd e colocados nas const acima
        (err, result)=>{
            res.send(result);

            if (req.file){ // se tiver imagem guarda os dados da imagem

            const nome = req.file.filename;   //pegando dados da imagem
            const path = '../../img/postagemPhoto/'+req.file.filename; // criando o path da imagem
            const tipo = (req.file.mimetype).slice(-3);
            
            db.query( addPicturePost, //salvando imagem em uma tabela (caso no futuro troque pra pode colocar mais de uma imagem por post)
              [nome, path, tipo],
              (err2, result2)=>{
                  
                  //res.send(result2);
                  
                  db.query( addConnectPictureAndPost, // conectando o post com a imagem
                      [result.insertId, result2.insertId],
                      (err3, result3)=>{
                          
                      }
                  )
              
              
              }
            )
            }   
            
           
    })

})

app.post("/api/editPhoto",uploadPhoto.single("picture"), (req, res) =>{
    
    
    const userId = req.body.userId;
    const nome = req.file.filename;   //pegando dados da imagem
    const path = '../../img/profilePhoto/'+req.file.filename; // criando o path da imagem
    const tipo = (req.file.mimetype).slice(-3);

    //comparar se te uma foto no banco ja
    const havePhoto = "SELECT * FROM `fotousuario` WHERE `usuario_id` = ?;";  
    //se ja tiver foto troca
    const updatePhoto = "UPDATE `fotousuario` SET `nomeImage` = ?, `path` = ?, `tipo` = ? WHERE `usuario_id` = ?;"; 
    // se não tiver foto coloca uma nova
    const addPhoto = "INSERT INTO `fotousuario`( `usuario_id`, `nomeImage`, `path`, `tipo`) VALUES (?,?,?,?);"; 

    
    
    db.query( havePhoto,
        [userId],
        (err,result)=>{
            
            if(result != ''){
                
                //update de foto de perfil
                console.log('chegou onde n deveria');
                db.query( 
                    updatePhoto,
                    [nome, path, tipo, userId],
                    (err , result)=>{
                        //tratar sucesso de update
                    }

                )
            } else {
                //create de foto de perfil
                db.query( 
                    addPhoto, //const que ta a query
                    [userId , nome, path, tipo], //parâmetros recebido do frontEnd e colocados nas const acima
                    (err, result)=>{
                        res.send(result);   
                       
                })
            }


        }

    )
        
        
    
   
    
    

})

app.get("/api/showTemas", (req, res) => { // retornas os temas
    const showTemas = "SELECT * FROM temas"
    db.query(showTemas, (err, result) => {
        res.send(result)
    })

});


app.post("/api/showComment", (req, res) => { // retorna a tabela de Postagem

    const id = req.body.id;
    const showComment = "SELECT comentario.id, comentario.texto, comentario.data, usuario.nome, usuario.identificacao, fotocomment.nomeImageComment, fotocomment.tipoComment, fotocomment.pathComment , fotousuario.nomeImage, fotousuario.tipo, fotousuario.path, comentario.idPost FROM comentario INNER JOIN usuario ON comentario.usuario_id = usuario.id LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id LEFT JOIN commentrelation ON comentario.id = commentrelation.id_comment LEFT JOIN fotocomment ON commentrelation.id_fotoComment = fotocomment.id WHERE comentario.idPost = ? ORDER BY `comentario`.`data` ASC"; 
    db.query(showComment,
            [id],        
            (err, result) => {
        res.send(result) // a resposta da função retorna um json com o resultado da consulta SQL

    })

});
app.get("/api/showPost", (req, res) => { // retorna a tabela de Postagem

    //em edição
    //SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, 
    //fotopost.nomeImage, 
    //fotopost.tipo, 
    //fotopost.path 
    //FROM post 
    //INNER JOIN usuario ON post.usuario_id = usuario.id 
    //INNER JOIN fotorelacao ON post.id = fotorelacao.id_post 
    //INNER JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id
    //ORDER BY `post`.`data` DESC

    const showPost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, fotopost.nomeImagePost, fotopost.tipoPost, fotopost.pathPost , fotousuario.nomeImage, fotousuario.tipo, fotousuario.path FROM post INNER JOIN usuario ON post.usuario_id = usuario.id LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id ORDER BY `post`.`data` DESC"; 
    db.query(showPost, (err, result) => {
        res.send(result) // a resposta da função retorna um json com o resultado da consulta SQL

    })

});

app.post("/api/showTemaPost", (req, res) => { // retorna a tabela de Postagem

    const tema = req.body.tema;
    const showTemaPost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao,  fotopost.nomeImagePost,  fotopost.tipoPost,  fotopost.pathPost FROM post  INNER JOIN usuario ON post.usuario_id = usuario.id  LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id WHERE post.Tema = ? ORDER BY `post`.`data` DESC"; 
    db.query(showTemaPost,
            [tema],
            (err, result) => {
        res.send(result) // a resposta da função retorna um json com o resultado da consulta SQL

    })

});

app.post("/api/showIdPost", (req, res) => { // retorna os post de um usuario a parti do seu ID
    
    const id = req.body.id;
    const showIdPost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, fotopost.nomeImagePost, fotopost.tipoPost, fotopost.pathPost , fotousuario.nomeImage, fotousuario.tipo, fotousuario.path FROM post  INNER JOIN usuario ON post.usuario_id = usuario.id  LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id WHERE post.usuario_id = ? ORDER BY `post`.`data` DESC"; 
    db.query(showIdPost,
            [id],
            (err, result) => {
        res.send(result) // a resposta da função retorna um json com o resultado da consulta SQL

    })

});

app.post("/api/showOnePost", (req, res) => { // retorna a tabela de Postagem
    
    const id = req.body.id;
    const showOnePost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao,  fotopost.nomeImagePost,  fotopost.tipoPost,  fotopost.pathPost , fotousuario.nomeImage, fotousuario.tipo, fotousuario.path FROM post  INNER JOIN usuario ON post.usuario_id = usuario.id  LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id  LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id WHERE post.id = ?"; 
    db.query(showOnePost,
            [id],
            (err, result) => {
        res.send(result) // a resposta da função retorna um json com o resultado da consulta SQL

    })

});

app.post("/api/showFullProfile", (req, res)=>{

    const id = req.body.id;
    //innerJoin com todas as tabelas de dados de usuario
    const showFullProfile = "SELECT usuario.id, usuario.nome, usuario.identificacao, usuario.email, usuario.phone, usuario.moderador, atividadeprofissional.formacaoProfissional, atividadeprofissional.atividadeProfissional, atividadeprofissional.numEmpregoAP, atividadeprofissional.tempoExercicio, atividadeprofissional.vinculoEmpregaticioAP, condicaoatual.mobilidadeAcademica, condicaoatual.numEmpregoCA, condicaoatual.vinculoEmpregaticioCA, condicaoatual.mudancaAtividade, condicaoatual.aumentoSalarial, condicaoatual.novaFormacao, condicaoatual.instituicaoNova, identificacaousuario.sexo, identificacaousuario.idade, identificacaousuario.deficiencia, identificacaousuario.estadoOrigem, identificacaousuario.graduacao, identificacaousuario.anoConclusaoIU, identificacaousuario.instituicaoGraduacao, programacurso.anoIngresso, programacurso.anoConclusaoPC, programacurso.cota, programacurso.outraFormacao, programacurso.instituicaoOutraForma, situacaoposcurso.expectativaMobilidade, situacaoposcurso.expectativaProfissional, situacaoposcurso.comparacaoProfissional, trajetoriaprofissional.mudancaPosCurso, trajetoriaprofissional.efeitoCurso, fotousuario.nomeImage, fotousuario.path, fotousuario.tipo FROM usuario INNER JOIN atividadeprofissional ON usuario.id = atividadeprofissional.usuario_id INNER JOIN condicaoatual ON usuario.id = condicaoatual.usuario_id INNER JOIN identificacaousuario ON usuario.id = identificacaousuario.usuario_id INNER JOIN programacurso ON usuario.id = programacurso.usuario_id INNER JOIN situacaoposcurso ON usuario.id = situacaoposcurso.usuario_id INNER JOIN trajetoriaprofissional ON usuario.id = trajetoriaprofissional.usuario_id LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id WHERE usuario.id = ?"
    db.query(showFullProfile,
            [id],
            (err, result) =>{
                res.send(result);
        }
    )

})

app.post("/api/findProfile", (req, res) =>{

    const nome          = '%'+req.body.nome+'%'; // "%" antes e depois da variável pra procurar ela como um pedaço da palavra
    
    const findProfile = "SELECT usuario.id, usuario.nome, usuario.identificacao, fotousuario.nomeImage, fotousuario.path, fotousuario.tipo FROM `usuario` LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id WHERE nome LIKE  ? ;"
    db.query( findProfile,
              [nome],
              (err, result) =>{
                res.send(result);
              }

    )

})

app.post("/api/findPost", (req, res) =>{

    const nome          = '%'+req.body.nome+'%'; // "%" antes e depois da variável pra procurar ela como um pedaço da palavra
    //SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao  FROM post INNER JOIN usuario ON post.usuario_id = usuario.id WHERE titulo LIKE  ? ORDER BY `post`.`data` DESC
    
    // essa query funciona direto no phpmyadm
    //SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, fotopost.nomeImagePost, fotopost.tipoPost, fotopost.pathPost FROM post INNER JOIN usuario ON post.usuario_id = usuario.id LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id WHERE post.titulo LIKE '%vaga%'ORDER BY `post`.`data` DESC
    
    const findPost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, fotopost.nomeImagePost, fotopost.tipoPost, fotopost.pathPost FROM post INNER JOIN usuario ON post.usuario_id = usuario.id LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id WHERE (post.titulo LIKE ? OR post.texto LIKE ?) ORDER BY `post`.`data` DESC"
    db.query( findPost,
              [nome, nome],
              (err, result) =>{
                
                res.send(result);
              }

    )

})

app.post("/api/findPostTema", (req, res) =>{

    const nome          = '%'+req.body.nome+'%'; // "%" antes e depois da variável pra procurar ela como um pedaço da palavra
    const tema          = req.body.tema;
    //SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao  FROM post INNER JOIN usuario ON post.usuario_id = usuario.id WHERE titulo LIKE  ? ORDER BY `post`.`data` DESC
    
    // essa query funciona direto no phpmyadm
    //SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao, fotopost.nomeImagePost, fotopost.tipoPost, fotopost.pathPost FROM post INNER JOIN usuario ON post.usuario_id = usuario.id LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id WHERE post.titulo LIKE '%vaga%'ORDER BY `post`.`data` DESC
    
    const findPost = "SELECT post.id, post.tema, post.titulo, post.texto, post.data, post.favorita, usuario.nome, usuario.identificacao,  fotopost.nomeImagePost,  fotopost.tipoPost,  fotopost.pathPost FROM post  INNER JOIN usuario ON post.usuario_id = usuario.id  LEFT JOIN fotorelacao ON post.id = fotorelacao.id_post LEFT JOIN fotopost ON fotorelacao.id_fotoPost = fotopost.id WHERE post.titulo LIKE  ?  AND post.tema = ? ORDER BY `post`.`data` DESC;"
    db.query( findPost,
              [nome, tema],
              (err, result) =>{
                
                res.send(result);
              }

    )

})

app.post("/api/showProfile", (req, res) =>{

    const id          = req.body.id;; // "%" antes e depois da variável pra procurar ela como um pedaço da palavra
    
    const showProfile = "SELECT usuario.id, usuario.nome, usuario.identificacao, usuario.email, usuario.phone, usuario.moderador, fotousuario.nomeImage, fotousuario.path, fotousuario.tipo FROM `usuario` LEFT JOIN fotousuario ON usuario.id = fotousuario.usuario_id WHERE usuario.id = ?;"
    db.query( showProfile,
              [id],
              (err, result) =>{
                res.send(result);
              }

    )

})
app.post("/api/addTema", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const newTema          = req.body.newTema;
    
    const addTema = "INSERT INTO temas ( nome ) VALUES ( ? );"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    db.query( addTema, //const que ta a query
              [newTema], //parâmetros recebido do frontEnd e colocados nas const acima
              (err, result)=>{
    });
});

app.post("/api/delTema", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const id          = req.body.id;
    const nome        = req.body.nome;
    
    const attPosts= "UPDATE `post` SET `tema` = 'Outros' WHERE `tema` = ?;"
    const delTema = "DELETE FROM `temas` WHERE `temas`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
   
    // atualizar postagens q tem esse tema para o tema "Oustros"
    db.query( attPosts, //const que ta a query
            [nome], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{

        // apagar tema 
        db.query( delTema, //const que ta a query
            [id], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
    });

});

    
});

app.post("/api/delPost", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const id          = req.body.id;
    
    const delPost = "DELETE FROM `post` WHERE `post`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    db.query( delPost, //const que ta a query
              [id], //parâmetros recebido do frontEnd e colocados nas const acima
              (err, result)=>{
    });
});
app.post("/api/addUser", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const user          = req.body.user;
    const password      = req.body.password;
    const nome          = req.body.nome;
    const identificacao = req.body.identificacao;
    const email         = req.body.email;
    const tel           = req.body.tel;
    
    const addUser = "INSERT INTO usuario ( login, password, nome, identificacao, email, phone, moderador, newNotification, completeProfile) VALUES ( ?, ?, ?, ?, ?, ?, 0, 0,0);"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    bcrypt.hash(password, saltRounds, (err, hash) => { // criptografando a senha antes de ir para o banco de dados

        db.query( addUser, //const que ta a query
                  [user, hash, nome, identificacao, email, tel], //parâmetros recebido do frontEnd e colocados nas const acima
                  (err, result)=>{
                      //res.send(result.insertId);
                      res.send(result);
                      // descobrir como colocar esse valor abaixo em uma variável e usar pra fazer as querry de adição das outras tabela referentes ao usuario
                      
                     
    })

    });
});

app.post("/api/addUserInfo", (req, res) => { // adiciona um usuário


    //com certeza da pra fatorar isso aqui, mas ...
    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const userId          = req.body.userId;
    
    const addUserAP  ="INSERT INTO `atividadeprofissional` (`id`, `usuario_id`, `formacaoProfissional`, `atividadeProfissional`, `numEmpregoAP`, `tempoExercicio`, `vinculoEmpregaticioAP`) VALUES (NULL, ? , NULL, NULL, NULL, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addUserCA  ="INSERT INTO `condicaoatual` (`id`, `usuario_id`, `mobilidadeAcademica`, `numEmpregoCA`, `vinculoEmpregaticioCA`, `mudancaAtividade`, `aumentoSalarial`, `novaFormacao`, `instituicaoNova`) VALUES (NULL, ? , NULL, NULL, NULL, NULL, NULL, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addUserIU  ="INSERT INTO `identificacaousuario` (`id`, `usuario_id`, `sexo`, `idade`, `deficiencia`, `estadoOrigem`, `graduacao`, `anoConclusaoIU`, `instituicaoGraduacao`) VALUES (NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addUserPC  ="INSERT INTO `programacurso` (`id`, `usuario_id`, `anoIngresso`, `anoConclusaoPC`, `cota`, `outraFormacao`, `instituicaoOutraForma`) VALUES (NULL, ?, NULL, NULL, NULL, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addUserSPC ="INSERT INTO `situacaoposcurso` (`id`, `usuario_id`, `expectativaMobilidade`, `expectativaProfissional`, `comparacaoProfissional`) VALUES (NULL, ?, NULL, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addUserTP  ="INSERT INTO `trajetoriaprofissional` (`id`, `usuario_id`, `mudancaPosCurso`, `efeitoCurso`) VALUES (NULL, ?, NULL, NULL);"  // cria o dado com valor nulo em tudo exceto o usuario referente
    const addNotification = "INSERT INTO `notificacaorelacao` (`id`, `id_user`, `nova`, `completeProfile`) VALUES (NULL, ?, '1', '0');" // cria usuario com status de notificação nova e perfil ainda incompleto
     
 
    
        db.query( addUserAP, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addUserCA, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addUserIU, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addUserPC, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addUserSPC, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addUserTP, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })
        db.query( addNotification, //const que ta a query
            [userId], //
            (err, result)=>{
            //tratamento de erro 
        })

   
});


app.post("/api/login", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const user          = req.body.user;
    const password      = req.body.password;
    
    
    const login = "SELECT * FROM usuario WHERE login = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
   
    //bcrypt.hash(password, saltRounds, (err, hash) => { // criptografando a senha antes de ir para o banco de dados
    
    db.query( login, //const que ta a query
            [user], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
            
                if(result.length > 0){
                    bcrypt.compare(password, result[0].password, (err, response) => {
                        if (response){
                            req.session.user = result; // criando a sessão e devolvendo os dados do usuario logado || "user" é o nome da sessão
                            res.send(result);
                        } else {
                            res.send({message : "Senha Inválida"})
                        }
                    })
                } else {
                    
                    res.send({message : "Esse usuário não existe"})
                }
                
    })

    
});

app.get("/api/isLogin", (req, res) => {
    if (req.session.user) {
      res.send({ loggedIn: true, user: req.session.user});
    } else {
      res.send({ loggedIn: false });
    }
  });

app.get("/api/logout", (req, res) => {
    req.session.destroy(); // destruindo a sessão
    res.send({message: "Tudo Ok"}) 

    }) ; 

app.post("/api/admStatusTroca", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
   
    const id              = req.body.id;
    const trocaAdm        = req.body.trocaAdm;
    
    const trocaStatusAdm = "UPDATE `usuario` SET `moderador` = ? WHERE `usuario`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo

    db.query( trocaStatusAdm, //const que ta a query
                [trocaAdm, id], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 
    
app.post("/api/attInformacoes", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const nome          = req.body.nome;
    const identificacao = req.body.identificacao;
    const userId        = req.body.userId;
    
    const attInfo = "UPDATE `usuario` SET `nome` = ?, `identificacao` = ? WHERE `usuario`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo

    db.query( attInfo, //const que ta a query
                [nome, identificacao, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attContatos", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const telefone      = req.body.telefone;
    const email         = req.body.email;
    const userId        = req.body.userId;
    
    const attContatos= "UPDATE `usuario` SET `phone` = ?, `email` = ? WHERE `usuario`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo

    db.query( attContatos, //const que ta a query
                [telefone, email, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 
  
app.post("/api/attIdentificacao", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const sexo             = req.body.sexo;
    const idade            = req.body.idade;
    const estadoOri        = req.body.estadoOri;
    const graduacao        = req.body.graduacao;
    const anoConc          = req.body.anoConc;
    const instiGraduacao   = req.body.instiGraduacao;
    const deficiencia      = req.body.deficiencia;
    const userId           = req.body.userId;


    const attProgCurso = "UPDATE `identificacaousuario` SET `sexo` = ?, `idade` = ?, `estadoOrigem` = ?, `graduacao` = ?, `anoConclusaoIU` = ?, `instituicaoOutraForma` = ?, `deficiencia` = ? WHERE `usuario_id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    db.query( attProgCurso, //const que ta a query
                [sexo, idade, estadoOri, graduacao, anoConc, instiGraduacao, deficiencia, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attProgCurso", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const anoIngre      = req.body.anoIngre;
    const anoConcl      = req.body.anoConcl;
    const cota          = req.body.cota;
    const outraForm     = req.body.outraForm;
    const instOutra     = req.body.instOutra;
    const userId        = req.body.userId;


    
    const attProgCurso = "UPDATE `programacurso` SET `anoIngresso` = ?, `anoConclusaoPC` = ?, `cota` = ?, `outraFormacao` = ?, `instituicaoOutraForma` = ? WHERE `usuario_id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    db.query( attProgCurso, //const que ta a query
                [anoIngre, anoConcl, cota, outraForm, instOutra, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attAtivProfi", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const formProf      = req.body.formProf;
    const numEmpregoAP  = req.body.numEmpregoAP;
    const tempoExerc    = req.body.tempoExerc;
    const atvAntes      = req.body.atvAntes;
    const vinculoAP     = req.body.vinculoAP;
    const userId        = req.body.userId;

    
    const attAtivProfi = "UPDATE `atividadeprofissional` SET `formacaoProfissional` = ?, `numEmpregoAP` = ?, `tempoExercicio` = ?, `atividadeProfissional` = ?, `vinculoEmpregaticioAP` = ? WHERE `usuario_id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    db.query( attAtivProfi, //const que ta a query
                [formProf, numEmpregoAP, tempoExerc, atvAntes, vinculoAP, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attExpectativa", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const expcMob       = req.body.expcMob;
    const expcProf      = req.body.expcProf;
    const comparacao    = req.body.comparacao;
    const userId        = req.body.userId;

      
    const attExpectativa = "UPDATE `situacaoposcurso` SET `expectativaMobilidade` = ?, `expectativaProfissional` = ?, `comparacaoProfissional` = ? WHERE `usuario_id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    db.query( attExpectativa, //const que ta a query
                [expcMob, expcProf, comparacao, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attCodAtual", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const numEmpregoCA       = req.body.numEmpregoCA;
    const setNewForm         = req.body.setNewForm;
    const setInstiNewForm    = req.body.setInstiNewForm;
    const mobAca             = req.body.mobAca;
    const vinculoCA          = req.body.vinculoCA;
    const mudancaAti         = req.body.mudancaAti;
    const aumSalarial        = req.body.aumSalarial;
    const userId             = req.body.userId;

     
    
    const attCodAtual = "UPDATE `condicaoatual` SET `numEmpregoCA` = ?, `novaFormacao` = ?, `instituicaoNova` = ?, `mobilidadeAcademica` = ?, `vinculoEmpregaticioCA` = ?, `mudancaAtividade` = ?, `aumentoSalarial` = ? WHERE `usuario_id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    db.query( attCodAtual, //const que ta a query
                [numEmpregoCA, setNewForm, setInstiNewForm, mobAca, vinculoCA, mudancaAti, aumSalarial, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/attAvaliacao", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const mudancaPosCurso      = req.body.mudancaPosCurso;
    const efeitoCurso         = req.body.efeitoCurso;
    const userId        = req.body.userId;
    
    const attAvaliacao= "UPDATE `trajetoriaprofissional` SET `mudancaPosCurso` = ?, `efeitoCurso` = ? WHERE `usuario`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo

    db.query( attAvaliacao, //const que ta a query
                [mudancaPosCurso, efeitoCurso, userId], //parâmetros recebido do frontEnd e colocados nas const acima
                (err, result)=>{
                res.send("sucesso");
                // tratamento de erro/sucesso
                      
                     
    })

}); 

app.post("/api/addComment",uploadComment.single("picture"), (req, res) => {
    const texto  = req.body.texto;
    const userId = req.body.userId;
    const idPost = req.body.idPost;
    const data   = new Date(); //gerando a data quando for executar a query 

    
    const addPost = "INSERT INTO comentario ( usuario_id, texto, idPost, data) VALUES ( ?, ?, ?, ?);"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    const addPicturePost = "INSERT INTO `fotocomment` (nomeImageComment, pathComment, tipoComment) VALUES ( ?, ?, ?);";
    const addConnectPictureAndPost = "INSERT INTO `commentrelation` (`id_comment`, `id_fotoComment`) VALUES ( ?, ?);";

    db.query( addPost, //const que ta a query
        [userId , texto, idPost, data], //parâmetros recebido do frontEnd e colocados nas const acima
        (err, result)=>{
            res.send("sucesso");

            if (req.file){ // se tiver imagem guarda os dados da imagem

            const nome = req.file.filename;   //pegando dados da imagem
            const path = '../../img/commentPhoto/'+req.file.filename; // criando o path da imagem
            const tipo = (req.file.mimetype).slice(-3);
            
            db.query( addPicturePost, //salvando imagem em uma tabela (caso no futuro troque pra pode colocar mais de uma imagem por post)
              [nome, path, tipo],
              (err2, result2)=>{
                  
                  //res.send(result2);
                  
                  db.query( addConnectPictureAndPost, // conectando o post com a imagem
                      [result.insertId, result2.insertId],
                      (err3, result3)=>{
                          
                      }
                  )
              
              
              }
            )
            }   
            
           
    })

})

app.post("/api/showNotification", (req, res) => { // retornas os temas

    const id = req.body.id;

    const identification = "SELECT * FROM usuario WHERE id = ?;";
    const showNotification = "SELECT * FROM notificacao WHERE notificacao.alvo = ? OR notificacao.alvo = 'Ambos' ORDER BY `notificacao`.`id` DESC"

    
    db.query(identification,
            [id],
            (err, result) => {
                if (result.length > 0 ){
                    
                    const userIdentification = result[0].identificacao
                     db.query(showNotification,
                        [userIdentification],
                        (err, result2) => {
                    res.send(result2)
                    })

                }else {
                    // sinceramente não sei, se n colocar esse if/else n consigo ler o raw data como objeto
                }
               
    }

    )

    

});

app.post("/api/addNotification", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const newNotification    = req.body.newNotification;
    const link               = req.body.link;
    const alvo               = req.body.alvo;   
    const userCreate         = req.body.userCreate;
    const data   = new Date(); //gerando a data quando for executar a query   
    
    const addNotification = "INSERT INTO `notificacao` ( `usuario_id`, `nome`, `link`, `alvo`, `ativa`, `data`) VALUES ( ?, ? , ?, ?, 1, ?);"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
    db.query( addNotification, //const que ta a query     
              [userCreate, newNotification, link, alvo, data], //parâmetros recebido do frontEnd e colocados nas const acima
              (err, result)=>{
    });

    const attNotificationSingle = "UPDATE usuario SET newNotification = 1 WHERE identificacao = ?"
    const attNotificationDouble = "UPDATE usuario SET newNotification = 1"

    if (alvo != 'Ambos'){
        db.query( attNotificationSingle, //const que ta a query     
            [alvo], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
         });   
    }else {
        db.query( attNotificationDouble, //const que ta a query     
             //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
         }); 
    }

});

app.post("/api/delNotification", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const id          = req.body.id;
    
    
    
    const delNotification = "DELETE FROM `notificacao` WHERE `notificacao`.`id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
   
   

        // apagar notificação
        db.query( delNotification, //const que ta a query
            [id], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
    });



    
});

app.post("/api/hasNotification", (req, res) => { // adiciona um tema

    //NÃO ESTA SENDO USADA!!!!!!!!!!!!!1

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const id          = req.body.id;
    
    
    
    const hasNotification = "SELECT `newNotification`,`completeProfile` FROM `usuario` WHERE `id` = ?"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
   
   

        // apagar notificação
        db.query( hasNotification, //const que ta a query
            [id], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
                console.log(result)
                res.send(result)
                
    });



    
});

app.post("/api/viuNotification", (req, res) => { // adiciona um tema

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    const id          = req.body.id;
    
    
    
    const viuNotification = "UPDATE usuario SET newNotification = 0  WHERE `id` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo
   
   

        // apagar notificação
        db.query( viuNotification, //const que ta a query
            [id], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
                res.send(result)
                
    });



    
});

app.post("/api/matchUserEmail", (req, res) =>{

    const user          = req.body.user;
    
    const matchUserEmail = "SELECT usuario.login, usuario.email FROM `usuario` WHERE usuario.login = ?;"
    db.query( matchUserEmail,
              [user],
              (err, result) =>{
                res.send(result);
              }

    )

});

app.post("/api/changePassword", (req, res) => { // adiciona um usuário

    // pegando o valor dentro do jason que o axio enviou do frontend e colocando cada valor em uma variável
    
    const user           = req.body.user;
    const newPassword    = req.body.newPassword;
    
    const attPassword= "UPDATE `usuario` SET `password` = ? WHERE `usuario`.`login` = ?;"; // interrogação para passar os parâmetros q vai receber(do frontEnd) com a função abaixo


    bcrypt.hash(newPassword, saltRounds, (err, hash) => { // criptografando a senha antes de ir para o banco de dados

        db.query( attPassword, //const que ta a query
            [hash,  user], //parâmetros recebido do frontEnd e colocados nas const acima
            (err, result)=>{
            res.send("sucesso");
            // tratamento de erro/sucesso

    });              
                     
    })

}); 

app.listen(3006, ()=>{ 
    console.log('rodando na porta 3006');
});