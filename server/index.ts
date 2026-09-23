import {createApp} from './app.js';
const {http,close}=createApp();const port=Number(process.env.PORT)||3001;
http.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`Night Arcade is ready at http://localhost:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void close().then(()=>process.exit(0));});
