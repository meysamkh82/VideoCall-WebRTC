const {createServer} = require('http');
const express = require('express');
const {Server} = require('socket.io');


const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.static('public'));

let activeUsers = [];

io.on('connection',(socket)=>{
    const userExist = activeUsers.find( socketExist =>{
        return socketExist === socket.id
    })
    if(!userExist){
        activeUsers.push(socket.id);
        socket.emit('update-user-list',{
            users: activeUsers.filter(socketExist =>{
                return socketExist !== socket.id
            })
        })
        socket.broadcast.emit('update-user-list',{
            users:[socket.id]
        })
    }
    socket.on('call-user',(data)=>{
        socket.to(data.to).emit('call-made',{
            offer:data.offer,
            socket:socket.id
        })
    })
    socket.on('make-answer',(data)=>{
        socket.to(data.to).emit('made-answer',{
            socket:socket.id,
            answer:data.answer
        })
    })
    socket.on('reject-call',(data)=>{
        socket.to(data.from).emit('call-rejected',{
            socket:socket.id
        })
    })
    socket.on('disconnect',()=>{
        activeUsers = activeUsers.filter(socketExist =>{
            return socketExist !== socket.id
        });
        socket.broadcast.emit('remove-user',{
            socketId : socket.id
        })
    })
 
})

server.listen(3000,()=>{
    console.log('app liseten on port 3000');
})