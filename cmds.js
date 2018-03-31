const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');

/**
 *  Muestra la ayuda.
 *
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "   h|help - Muestra esta ayuda.");
    log(socket, "   list - Listar los quizzes existentes.");
    log(socket, "   show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket, "   add - Añadir un nuevo quiz interactivamente.");
    log(socket, "   delete <id> - Borrar el quiz indicado.");
    log(socket, "   edit <id> - Editar el quiz indicado.");
    log(socket, "   test <id> - Probar el quiz indicado.");
    log(socket, "   p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "   credits - Créditos.");
    log(socket, "   q|quiz - Salir del programa.");
    rl.prompt();
};

/**
 *  Lista todos los quizzes existentes en el modelo.
 *
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
        .each(quiz => {
            log(socket, `   [${colorize(quiz.id,'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });

};


/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parametro.
 *  - Convierte el parametro en un numero entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id.
 *
 * @param id Parametro con el indice a validar
 */
const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parametro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};


/**
 *  Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 *  @param id Clave del quiz a mostrar
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.showCmd = (socket, rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error()(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, `  [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','red')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Esta funcion convierte la llamada rl.question, que esta basada en callbacks, en una
 * basada en promesas.
 *
 * Esta funcion devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 *      .then(answer => {...})
 *
 * Tambien colorea en rojo el texto de la pregunta, elimina espacios al principio
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl,text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text,'red'), answer => {
            resolve(answer.trim());
        });
    });
};

/**
 *  Añade un nuevo quiz al modelo.
 *  Pregunta interactivamente por la pregunta y la respuesta.
 *
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.addCmd = (socket, rl) => {
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(g => {
            return makeQuestion(rl, 'Introduzca la respuesta: ')
                .then(a => {
                    return {question: g, answer: a};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket, ` ${colorize('Se ha añadido','magenta')}: ${question} ${colorize('=>','red')} ${answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(socket, message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })

    //log('Añadir un nuevo quiz.');
};

/**
 *  Borrar un quiz del modelo.
 *
 *  @param id Clave del quiz a borrar en el modelo
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.deleteCmd = (socket,rl,id) => {
    validateId(id)
        .then(id => {
            models.quiz.destroy({where: {id}})
        })
        .then(quiz => {
            log(socket, ` ${colorize('Se ha eliminado ','magenta')}: ${quiz.question} ${colorize('=>','red')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

/**
 *  Edita un quiz del modelo.
 *
 *  @param id Clave del quiz a editar
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.editCmd = (socket,rl,id) => {

   validateId(id)
       .then(id => models.quiz.findById())
       .then(quiz => {
           if (!quiz) {
               throw new Error(`No existe un quiz asociado al id=${id}.`);
           }

           process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
           return makeQuestion(rl, 'Introduzca una pregunta')
               .then( q => {
                   process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                   return makeQuestion(rl, 'Introduzca la respuesta')
                       .then( a => {
                           quiz.question = q;
                           quiz.answer = a;
                           return quiz;
                       });
               });
       })
       .then(quiz => {
           return quiz.save();
       })
       .then(quiz => {
           log(socket,`Se ha cambiado el quiz ${colorize(quiz.id,'magenta')} por: ${quiz.question} ${colorize('=>','red')} ${quiz.answer}`);
       })
       .catch(Sequelize.ValidationError, error => {
           errorlog(socket,'El quiz es erroneo');
           error.errors.forEach(({message}) => errorlog(socket,message));
       })
       .catch(error => {
           errorlog(socket,error.message);
       })
       .then(() => {
           rl.prompt();
       })
};

/**
 *  Prueba un quiz.
 *  Hace una pregunta del modelo a la que debemos contestar.
 *
 *  @param id Clave del quiz a mostrar
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.testCmd = (socket,rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, colorize('¿' + quiz.question + '? ', 'red'))
                .then(a => {
                    //quiz.answer = a;
                    //log("La respuesta introducida es " + a);

                    if (quiz.answer.toLowerCase() === a.toLowerCase()) {
                        log(socket,"Correcto","green");
                        //biglog("Correcto","green");
                    } else {
                        log(socket,"Incorrecto","red");
                        //biglog("Incorrecto","red");
                    }
                    return quiz;
                });
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        })
};


/**
 *  Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 *  Se gana si se contesta a todos correctamente.
 *
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.playCmd = (socket,rl) => {
    let toBeResolved = [];
    //let id = Math.floor(Math.random() * 5);
    let score = 0;
    models.quiz.findAll({
        raw:true,
    })
        .then(quizzes => {
            toBeResolved = quizzes;
        })


    const play = () => {
        return Promise.resolve()
            .then(() => {
                if(toBeResolved.length <= 0) {
                    log(socket,'No hay mas preguntas');
                    log(socket,'Fin del juego. Aciertos: ' + score);
                    biglog(socket,score,'magenta');
                    rl.prompt();
                }

                let posicion = Math.floor(Math.random()*toBeResolved.length);
                let quiz = toBeResolved[posicion];
                toBeResolved.splice(posicion,1);
                return makeQuestion(rl, quiz.question + ': ')
                    .then(respuesta => {
                        if(respuesta.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                            score++;
                            log(socket,'CORRECTO - LLeva ' + score + ' aciertos.');
                            play();
                        } else {
                            log(socket,'INCORRECTO.');
                            log(socket,'Fin del juego. Aciertos: ' + score);
                            biglog(socket,score,'magenta');
                            rl.prompt();
                        }
                    })
            })
    }
    models.quiz.findAll({
        raw:true,
    })
        .then(quizzes => {
            toBeResolved = quizzes;
        })
        .then(() => {
            return play();
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket,'El quiz es erroneo');
            error.errors.forEach(({message}) => errorlog(socket,message));
        })
        .then(() => {
            rl.prompt();
        })

   /* let score = 0;
    let toBeResolved = [];
    let ordenArray = 0;

    for(let i=0; i < quizzes.length; i++) {
        toBeResolved[i]=quizzes[i];
        log(toBeResolved[i],'blue');
    }

    const playOne = () => {
        if(toBeResolved.length === 0) {
            log('¡No hay preguntas que responder!','red');
            log('Fin del examen. Aciertos: ');
            biglog(score,'red');
            rl.prompt();

        } else {
            //let quiz = toBeResolved.splice(Math.floor(Math.random() * (3)));

            let id = Math.floor(Math.random() * toBeResolved.length);

            let quiz = toBeResolved[id];
            //log(quiz);

            rl.question(colorize('¿'+ quiz.question + '? ','red'),resp => {
                if(resp.toLowerCase() === quiz.answer.toLowerCase()) {
                    score++;
                    log('CORRECTO - Lleva ' + score + ' aciertos');
                    toBeResolved.splice(id,1);
                    //log(toBeResolved);
                    playOne();
                } else {
                    log('INCORRECTO.');
                    log('Fin del examen. Aciertos:')
                    biglog(score,'red');
                    rl.prompt();
                }
            });
        }
    };
    playOne();
*/
   //log("  --- Metodo sin implementar ---",'blue')

};


/**
 *  Muestra el nombre del autor de la prática.
 *
 *  @param rl Objeto readline usado para implementar el CLI
 */
exports.creditsCmd = (socket,rl) => {
    log(socket,'Autor de la práctica:');
    log(socket,'ALBERTO');
    rl.prompt();
};


/**
 *  Termina la ejecución.
 */
exports.quitCmd = (socket,rl) => {
    rl.close();
    socket.end();
};