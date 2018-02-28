
const readline = require('readline');

const {log, biglog, errorlog, colorize} = require("./out");

const model = require('./model');
const cmds = require("./cmds");


// Mensaje inicial
biglog('CORE Quiz','green');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: colorize("quiz > ", 'blue'),
    completer: (line) => {
        const completions = 'h help add delete edit list test p play credits quit q'.split(' ');
        const hits = completions.filter((c) => c.startsWith(line));
        // show all completions if none found
        return [hits.length ? hits : completions, line];
    }
});
rl.prompt();

rl.
on('line', (line) => {

  var args = line.split(" ");
  var cmd = args[0].toLowerCase().trim();

  switch (cmd) {
      case '':
          rl.prompt();
          break;

    case 'h':
    case 'help':
          cmds.helpCmd(rl);
          break;

    case 'quit':
    case 'q':
        cmds.quitCmd(rl);
        break;

    case 'add':
        cmds.addCmd(rl);
        break;

    case 'list':
        cmds.listCmd(rl);
        break;

    case 'show':
        cmds.showCmd(rl,args[1]);
        break;

    case 'test':
        cmds.testCmd(rl,args[1]);
        break;

    case 'p':
    case 'play':
        cmds.playCmd(rl);
        break;

    case 'delete':
        cmds.deleteCmd(rl,args[1]);
        break;

    case 'edit':
        cmds.editCmd(rl,args[1]);
        break;

    case 'test':
        cmds.testCmd(rl);
        break;

    case 'credits':
        cmds.creditsCmd(rl);
        break;

    default:
      console.log(`Comando desconocido: '${colorize(cmd,'red')}'`);
      console.log(`Use ${colorize('help','green')} help para ver todos los comando disponibles.`);
      rl.prompt();
      break;
  }
  

}).on('close', () => {
  log('Adios!');
  process.exit(0);
});




