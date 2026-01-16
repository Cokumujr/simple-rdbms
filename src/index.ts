import { startREPL } from "./repl/repl";


startREPL().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1);
})