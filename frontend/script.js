let micStream;
let audioContext;
let microphoneSource;
let audioProcessor;
let audioBuffer = [];

const TARGET_SAMPLES = 1600;

let nextPlayTime = 0;

let socket;
let sentChunks = 0;
let receivedChunks = 0;

let activeSource = []

const startButton = document.getElementById("startButton")
const muteButton = document.getElementById("muteButton")

let isRunning = false;
let isMuted = false;


function playPCM(arrayBuffer, sampleRate) {

    // Convert received bytes into 16-bit PCM samples
    const pcmSamples = new Int16Array(arrayBuffer);

    // Create an audio buffer
    // An AudioBuffer is a browser audio container that can hold audio samples for playback.
    const audioBuffer = audioContext.createBuffer(1, pcmSamples.length, sampleRate)

    // Get the audio channel
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 samples into Float32 samples
    for (let i = 0; i < pcmSamples.length; i++) {
        channelData[i] = pcmSamples[i] / 32768;
    }

    // Create an audio source. This creates a node that can play our AudioBuffer.
    const source = audioContext.createBufferSource();

    activeSource.push(source);
    source.onended = function () {
        activeSource = activeSource.filter(s => s !== source)
    }

    source.buffer = audioBuffer;
    source.connect(audioContext.destination)

    // Schedule Playback
    if (nextPlayTime < audioContext.currentTime) {
        nextPlayTime = audioContext.currentTime
    }

    source.start(nextPlayTime);

    nextPlayTime += audioBuffer.duration

}


async function startAgent() {
    socket = new WebSocket("ws://127.0.0.1:8000/ws")
    socket.binaryType = "arraybuffer";
    await new Promise(function (resolve, reject) {
        socket.onopen = resolve;
        socket.onerror = function () {
            reject(new Error("Websocket connection failed."))
        };
    })
    console.log("Websocket Connected.")

    socket.onmessage = function (event) {

        // Check whether this is an interruption message
        if (typeof event.data === "string" && event.data === "INTERRUPTED") {
            console.log("Stopping previous message");

            // Stop all scheduled audio sources
            activeSource.forEach(function (source) {
                try {
                    source.stop()
                } catch (error) {
                    // Source may have already stopped
                }
            });

            activeSource = [];

            // Reset playback scheduling
            nextPlayTime = audioContext.currentTime
            return;
        }
        // Otherwise, this is gemini audio data
        receivedChunks++
        console.log("Received chunks", receivedChunks);
        console.log("Received Bytes:", event.data.byteLength);
        playPCM(event.data, 24000);
    }

    micStream = await navigator.mediaDevices.getUserMedia({audio: true})

    audioContext = new AudioContext();
    console.log("Microphone sample rate", audioContext.sampleRate)

    await audioContext.audioWorklet.addModule("audio_processor.js");

    microphoneSource = audioContext.createMediaStreamSource(micStream);

    audioProcessor = new AudioWorkletNode(audioContext, "audio-processor");

    // Receive samples continuosly, executes in a loop, never ends until we stop
    audioProcessor.port.onmessage = function (event) {
        const audioSamples = event.data;
        // Returns the "audioProcessor.port.onmessage = function (event)" when isMuted = true and this function executes again in loop.
        if (isMuted) {
            return;
        }
        console.log("AudioWorklet message received");
        console.log("Samples received:", audioSamples.length);

        const pcmSamples = new Int16Array(audioSamples.length);
        for (let i = 0; i < audioSamples.length; i++) {
            let sample = Math.max(-1, Math.min(1, audioSamples[i]));
            pcmSamples[i] = sample < 0
                ? sample * 32768
                : sample * 32767;
        }

        for (let i = 0; i < pcmSamples.length; i++) {
            audioBuffer.push(pcmSamples[i])
        }

        // Sending 1600 samples as a packet as Google said, because each sample sending cause many requests
        while (audioBuffer.length >= TARGET_SAMPLES) {
            const packetSamples = audioBuffer.splice(0, TARGET_SAMPLES)
            const audioPacket = Int16Array.from(packetSamples);
            if (socket.readyState === WebSocket.OPEN) {
                console.log("Sending packet:", audioPacket.length, "samples");
                console.log("Packet bytes:", audioPacket.byteLength);
                socket.send(audioPacket.buffer);
                sentChunks++
            }
        }


        console.log("PCM Samples", pcmSamples)


        console.log("Number of samples:", audioSamples.length)

        const duration = audioSamples.length / audioContext.sampleRate;
        console.log("chunk duration:", duration * 1000, "ms");
        console.log(pcmSamples.byteLength)
    };

    microphoneSource.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);
    console.log("Microphone audio processing started")
}


async function stopAgent() {
    if (micStream) {
        micStream.getTracks().forEach(function (track) {
            track.stop()
        });
    }
    if (audioContext) {
        await audioContext.close();
    }
    console.log("microphone Stopped.");
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
    audioBuffer = []
}


startButton.addEventListener("click", async function () {
    if (isRunning === false) {
        await startAgent()

        isRunning = true
        startButton.classList.add("active")
        startButton.title = "Stop"

        muteButton.disabled = false
    } else {
        await stopAgent()

        isRunning = false
        startButton.classList.remove("active")
        startButton.title = "Start"

        muteButton.disabled = true
        muteButton.classList.remove("active")
        isMuted = false
    }
})


muteButton.addEventListener("click", function () {
    isMuted = !isMuted

    // Clearing the audioBuffer Because when we SpokeUp and clicking Mute, the audioBuffer may collect samples lesser than 1600 or
    // there is a chance that the packet sent to gemini by the buffer has some leftover samples that are not greater than or equal to 1600.
    // So after we clicked Unmute, the new audio samples mix up and added to the audioBuffer and send to the Gemini.
    // So we clearing it when Mute button is clicked
    audioBuffer = []
    if (isMuted) {
        muteButton.classList.add("active")
        muteButton.title = "Unmute"
    }
    else {
        muteButton.classList.remove("active")
        muteButton.title = "Mute"
    }
})