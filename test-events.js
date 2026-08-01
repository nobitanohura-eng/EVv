import { NewMessage } from "telegram/events/index.js";
console.log(new NewMessage({}).incoming);
console.log(new NewMessage({incoming: true}).incoming);
