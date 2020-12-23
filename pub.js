let globalTransceiver;

async function main() {
  const pc1 = new RTCPeerConnection({ sdpSemantics: 'unified-plan' });

  const socket = new WebSocket('ws://10.83.0.191:3000');

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', value: 'pub' }));
  });

  // Listen for messages
  socket.addEventListener('message', async function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'sub_answer') {
      await pc1.setRemoteDescription(data.value);
      // await setLowEncoding(pc1);
      return;
    }

    if (data.type === 'sub_candidate') {
      pc1.addIceCandidate(data.value);
    }
  });

  const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  const highVideoTrack = videoStream.getVideoTracks()[0];
  const lowVideoTrack = await highVideoTrack.clone();
  const audioTrack = videoStream.getAudioTracks()[0];

  pc1.addEventListener('icecandidate', async e => {
    if (e.candidate) {
      socket.send(JSON.stringify({ type: 'pub_candidate', value: e.candidate }));
    }
  });

  const highTransceiver = pc1.addTransceiver(highVideoTrack);

  globalTransceiver = highTransceiver;
  const lowTransceiver = pc1.addTransceiver(lowVideoTrack);
  // const audioTransceiver = pc1.addTransceiver(audioTrack);

  const offer = await pc1.createOffer({ offerToReceiveVideo: 1 });
  console.log(offer.sdp);
  await pc1.setLocalDescription(offer);
  setLowEncoding(pc1);

  // const ssrc = await getSSRC(highTransceiver.sender);
  // console.log('ssrc-------', ssrc);
  socket.send(JSON.stringify({ type: 'pub_offer', value: offer }));

  // setTimeout(async () => {
  // }, 5000);

}
main();


async function setLowEncoding(pc) {
  const senders = pc.getSenders();
  const lowSender = senders[0];
  const lowParams = lowSender.getParameters();

  if (!lowParams.encodings) {
    lowParams.encodings = [{}];
  }

  lowParams.encodings[0].scaleResolutionDownBy = 8;
  // lowParams.encodings[0].maxBitrate = 10000;
  lowParams.encodings[0].maxFramerate = 15;

  await lowSender.setParameters(lowParams);

  // not change by safari
  // if (lowSender.getParameters().encodings[0].scaleResolutionDownBy == 1) {
  //   await lowSender.track.applyConstraints({ height: 120, width: 160, frameRate: 15 });
  // }
}

async function getSSRC(sender) {
  const reports = Array.from(await sender.getStats());
  console.log(reports);
  const report = reports.find(report => {
    return report[1] && report[1].type === 'outbound-rtp' && (report[1].kind === 'video' || report[1].mediaType === 'video') && report[1].ssrc;
  });

  if (report) {
    return report[1].ssrc;
  }

}

document.querySelector('.button').onclick = async () => {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const screenTrack = stream.getVideoTracks()[0];
  globalTransceiver.sender.replaceTrack(screenTrack);
  const ssrc = await getSSRC(globalTransceiver.sender);
  console.log(ssrc);
};