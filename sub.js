const videoA = document.querySelector('.video-a');
const videoB = document.querySelector('.video-b');
let videoSettled = false;

async function main() {
  const pc2 = new RTCPeerConnection({ sdpSemantics: "unified-plan" });

  const socket = new WebSocket('ws://localhost:3000/sub');

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', value: 'sub' }));
  });

  socket.addEventListener('message', async function (event) {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'pub_offer': {
        pc2.setRemoteDescription(data.value);
        const answer = await pc2.createAnswer();
        pc2.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: 'sub_answer', value: answer }));
        break;
      }
      case 'pub_candidate': {
        await pc2.addIceCandidate(data.value);
      }
    }
  });


  pc2.addEventListener('icecandidate', async e => {
    if (e.candidate) {
      socket.send(JSON.stringify({ type: 'sub_candidate', value: e.candidate }));
    }
  });
  pc2.addEventListener('track', ({ track }) => {
    console.log('onTrack');

    if (!videoA.srcObject) {
      const stream1 = new MediaStream();
      stream1.addTrack(track);
      videoA.srcObject = stream1;
      videoA.play();
      return;
    }

    if (!videoB.srcObject) {
      const stream2 = new MediaStream();
      stream2.addTrack(track);
      videoB.srcObject = stream2;
      videoB.play();
      return;
    }
  })
}
main();