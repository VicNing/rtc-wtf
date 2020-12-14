const videoA = document.querySelector('.video-a');
const videoB = document.querySelector('.video-b');

async function main() {
    const stream = new MediaStream();
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const highVideoTrack = videoStream.getVideoTracks()[0];
    const lowVideoTrack = await highVideoTrack.clone();
    lowVideoTrack.applyConstraints({ width: 160, height: 120, frameRate: 15 });

    stream.addTrack(highVideoTrack);
    stream.addTrack(lowVideoTrack);

    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();

    pc1.addEventListener('icecandidate', async e => {
        debugger
        if (e.candidate) {
            await pc2.addIceCandidate(e.candidate);
        }
    });
    pc2.addEventListener('icecandidate', async e => {
        if (e.candidate) {
            await pc1.addIceCandidate(e.candidate);
        }
    });
    pc2.addEventListener('track', (e) => {
        // debugger;
        if (!videoA.srcObject) {
            videoA.srcObject = e.streams[0];
            videoA.play();
        } else {
            videoB.srcObject = e.streams[0];
            videoB.play();
        }
    })

    pc1.addTrack(highVideoTrack, stream);
    pc1.addTrack(lowVideoTrack, stream);
    const offer = await pc1.createOffer({ offerToReceiveVideo: 1 });
    pc1.setLocalDescription(offer);
    pc2.setRemoteDescription(offer);

    const answer = await pc2.createAnswer();
    pc2.setLocalDescription(answer);
    pc1.setRemoteDescription(answer);
}
main();