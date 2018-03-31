
const figlet = require('figlet');
const chalk = require('chalk');

/**
 * Dar color a un string.
 *
 * @param msg   Es string al que hay que dar color.
 * @param color El color con el que pintar el msg
 * @returns {string} Devuelve el string msg con el color indicado.
 */
const colorize = (msg,color) => {
    if(typeof color !== "undefined") {
        msg = chalk[color].bold(msg);
    }
    return msg;
};

/**
 * Escribe un mensaje de log.
 *
 * @param msg   El string a elegir.
 * @param color Color del texto.
 */
const log = (socket,msg,color) => {
    socket.write(colorize(msg,color) + "\n");
};

/**
 * Escribe un mensaje de log grande.
 *
 * @param msg   Texto a escribir.
 * @param color Color del texto.
 */
const biglog = (socket,msg,color) => {
    log(socket,figlet.textSync(msg, {horizontalLayout: 'full\n'}), color);
};

/**
 * Escribe un mensaje de error emsg.
 *
 * @param emsg   Texto mensaje de error.
 */
const errorlog = (socket,emsg) => {
    socket.write(`${colorize("Error","red")}: ${colorize(colorize(emsg,"red"), "bgYellowBright")}`);
};

exports = module.exports = {
    colorize,
    log,
    biglog,
    errorlog
};