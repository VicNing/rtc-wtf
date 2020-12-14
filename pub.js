async function main() {
  const pc1 = new RTCPeerConnection();

  const socket = new WebSocket('ws://localhost:3000');

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', value: 'pub' }));
  });

  // Listen for messages
  socket.addEventListener('message', async function (event) {
    // console.log('Message from server ', event.data);
    const data = JSON.parse(event.data);
    if (data.type === 'sub_answer') {
      pc1.setRemoteDescription(data.value);
      await setLowEncoding(pc1);
      return;
    }

    if (data.type === 'sub_candidate') {
      pc1.addIceCandidate(data.value);
    }
  });

  const highStream = new MediaStream();
  const lowStream = new MediaStream();
  const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const highVideoTrack = videoStream.getVideoTracks()[0];
  const lowVideoTrack = await highVideoTrack.clone();
  // lowVideoTrack.applyConstraints({ width: 160, height: 120, frameRate: 15 });

  highStream.addTrack(highVideoTrack);
  lowStream.addTrack(lowVideoTrack);

  pc1.addEventListener('icecandidate', async e => {
    if (e.candidate) {
      socket.send(JSON.stringify({ type: 'pub_candidate', value: e.candidate }));
      // await pc2.addIceCandidate(e.candidate);
    }
  });

  pc1.addTrack(highVideoTrack, highStream);
  pc1.addTrack(lowVideoTrack, lowStream);


  const offer = await pc1.createOffer({ offerToReceiveVideo: 1 });
  pc1.setLocalDescription(offer);
  socket.send(JSON.stringify({ type: 'pub_offer', value: offer }));

  window.foo = function () {
    const senders = pc1.getSenders();
    const lowParams = senders[0].getParameters();
    console.log(lowParams);
  }
}
main();


async function setLowEncoding(pc) {
  const senders = pc.getSenders();
  const lowParams = senders[0].getParameters();

  if (!lowParams.encodings) {
    lowParams.encodings = [{}];
  }

  lowParams.encodings[0].scaleResolutionDownBy = 4.0;
  lowParams.encodings[0].maxBitrate = 15000;
  await senders[0].setParameters(lowParams);

  //not change by safari
  if (senders[0].getParameters().encodings[0].scaleResolutionDownBy == 1) {
    await senders[0].track.applyConstraints({ height: 120, width: 160 });
  }

  console.log(senders[0].getParameters().encodings[0].maxBitrate);
}