const socket = io();

isAlreadyCalling = false;
getCalled= false;

let UsersOnline = document.querySelector('.list-users');
let users = document.querySelectorAll('.user')
const {RTCPeerConnection,RTCSessionDescription} = window;

const peerConnection = new RTCPeerConnection();

async function callUser(socketId){
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit('call-user',{
        offer,
        to:socketId
    })
}

socket.on('update-user-list',(data)=>{
    data.users.forEach(userId =>{
        let user = document.getElementById(userId);
        // console.log(data);
        // console.log(user);
        // console.log(userId)
        if(!user){
            UsersOnline.innerHTML += `<li class="user" id=${userId}>${userId}</li>`;
            users = document.querySelectorAll('.user');
            
            users.forEach(element =>{
                element.addEventListener('click',()=>{
                    users.forEach(e =>{
                        e.classList.remove('active-user')
                    })
                    element.classList.add('active-user');
                    callUser(userId)
                })
            })
        }
        
    })
})


socket.on('remove-user',({socketId})=>{
    const user = document.getElementById(socketId);
    // console.log('remove user ',user)
    user.remove();
})

socket.on('call-made',async (data)=>{
    if(getCalled){
        
        const confirmed = confirm(`The user with ID ${data.socket} wants to call you, do you accept?`);
        if(!confirmed){
        socket.emit('reject-call',{
            from:data.socket
        })
        
        return;
        }
    }
    

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    socket.emit('make-answer',{
        answer,
        to:data.socket
    })
    getCalled = true;
})
socket.on('made-answer',async (data)=>{
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    )
    if(!isAlreadyCalling){
        callUser(data.socket);
        isAlreadyCalling = true;
    }
  
})
socket.on('call-rejected',data =>{
    alert(`The user with ID ${data.socket} rejected your call`);
    users.forEach(element =>{
        element.classList.remove('active-user')
    })
})
peerConnection.ontrack = function(data){
    console.log(data);
    const remoteVideo = document.getElementById('remote-video');
    if(remoteVideo){
        remoteVideo.srcObject = data.streams[0]
    }

}
navigator.getUserMedia({video:true,audio:true},(stream)=>{
    const localVideo = document.getElementById('local-video');
    if(localVideo){
        localVideo.srcObject = stream;
        // localVideo.onloadedmetadata = (e) => {
        //    localVideo.play();
        //   };
    }
    stream.getTracks().forEach(track => peerConnection.addTrack(track,stream));
        
    
},(error)=>{
    console.log(error)
}
)